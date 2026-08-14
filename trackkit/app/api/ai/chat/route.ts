import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserIdFromToken } from "@/lib/auth-server";
import type { AIProductSummary } from "@/lib/ai-context";

const MAX_MESSAGE_LENGTH = 500;
const CLAUDE_MODEL = "claude-3-5-sonnet-20241022";

const SYSTEM_PROMPT = `You are a market trader's assistant. Help market women in Lagos/Accra make smart inventory decisions.
You have access to their products, sales history, costs, and margins as JSON data.
Be concise (2-3 sentences). Use currency: ₦ for Nigerian Naira. Keep a warm, direct, plain-spoken tone — never corporate or robotic.
If asked about a specific product's sales, analyze the data and respond with: quantity sold, daily average, trend if determinable, margin, and one concrete action.
Example: "You sold 24 tins of milk this week (3.4/day avg). Margin: 12% per tin = ₦2,880 profit. Buy more Friday for weekend."
Only use the product data provided — never invent numbers, suppliers, or patterns that aren't in it.
If the data doesn't cover what's being asked (e.g. a product isn't in the list, or there's no sales history for the requested period), say so plainly in one sentence rather than guessing or extrapolating.
Only suggest an action when it's actually grounded in the data given — an irrelevant or generic tip is worse than no tip.`;

interface ChatRequestBody {
  message: string;
  context?: {
    focusProductId?: string;
    timeRange?: "day" | "week" | "month";
    products?: AIProductSummary[];
  };
}

function hashQuery(message: string, focusProductId: string, timeRange: string): string {
  return createHash("sha256").update(`${message}|${focusProductId}|${timeRange}`).digest("hex");
}

export async function POST(request: Request) {
  try {
    let body: ChatRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json(
        { error: "Message is required", code: "MISSING_MESSAGE" },
        { status: 400 }
      );
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`, code: "MESSAGE_TOO_LONG" },
        { status: 400 }
      );
    }

    // AI chat is inherently cloud-only (costs money per call, can't work
    // offline no matter what) and is the paid tier per PHASE-3-AI.md, so
    // unlike the rest of the app it does require a session.
    let token = "";
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("token")?.value || "";
    }
    const userId = token ? await getUserIdFromToken(token) : null;
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to use the AI Assistant", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const focusProductId = body.context?.focusProductId ?? "";
    const timeRange = body.context?.timeRange ?? "week";
    const products = body.context?.products ?? [];
    const queryHash = hashQuery(message, focusProductId, timeRange);

    // Cache check — same question (+ same product/time-range focus) within
    // 7 days reuses the stored response instead of paying for another call.
    const { data: cached } = await supabaseAdmin
      .from("ai_cache")
      .select("ai_response, metadata")
      .eq("user_id", userId)
      .eq("query_hash", queryHash)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cached) {
      return NextResponse.json({
        response: cached.ai_response,
        confidence: cached.metadata?.confidence ?? 0.9,
        cached: true,
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        response: "AI Assistant isn't set up yet — no Anthropic API key configured.",
        confidence: 0,
        cached: false,
      });
    }

    // Computed from data availability *before* calling Claude, not from
    // its answer — a focused product missing from inventory, or with no
    // recorded sales, means any answer would be unfounded regardless of
    // how confident the generated prose sounds. Passed into the prompt as
    // an explicit instruction rather than just recorded after the fact,
    // so a low score actually changes what gets said, not just how it's
    // labeled.
    const confidence = (() => {
      if (products.length === 0) return 0.3;
      if (focusProductId) {
        const focused = products.find((p) => p.id === focusProductId);
        if (!focused) return 0.3;
        if (focused.unitsSoldLast7Days === 0 && focused.unitsSoldLast30Days === 0) return 0.5;
        return 0.9;
      }
      const anySalesHistory = products.some((p) => p.unitsSoldLast30Days > 0);
      return anySalesHistory ? 0.85 : 0.5;
    })();

    const anthropic = new Anthropic({ apiKey });
    const userContext = { today: new Date().toISOString().slice(0, 10), timeRange, focusProductId: focusProductId || undefined, products };
    const confidenceDirective =
      confidence < 0.5
        ? "\n\nData confidence for this question is LOW — the requested product/period has little or no matching data. Do not guess or estimate. Say plainly that there isn't enough data yet, in one short sentence."
        : "";

    let aiResponseText: string;
    try {
      const completion = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `User data: ${JSON.stringify(userContext)}. User question: "${message}"${confidenceDirective}`,
          },
        ],
      });
      const textBlock = completion.content.find((block) => block.type === "text");
      aiResponseText = textBlock && "text" in textBlock ? textBlock.text : "";
      if (!aiResponseText) throw new Error("Empty response from Claude");
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 429) {
        return NextResponse.json({
          response: "AI Assistant is busy right now — try again in a minute.",
          confidence: 0,
          cached: false,
        });
      }
      return NextResponse.json({
        response: "Sorry, AI service unavailable. Try again.",
        confidence: 0,
        cached: false,
      });
    }

    // Only successful responses are cached — caching an error/fallback
    // message would keep serving it for 7 days even after the underlying
    // problem (e.g. a Claude outage) resolves.
    await supabaseAdmin.from("ai_cache").upsert(
      {
        user_id: userId,
        query_hash: queryHash,
        user_query: message,
        ai_response: aiResponseText,
        metadata: { model: CLAUDE_MODEL, confidence },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "user_id,query_hash" }
    );

    return NextResponse.json({
      response: aiResponseText,
      confidence,
      cached: false,
    });
  } catch (err: unknown) {
    // Logged server-side for debugging, but never echoed back to the
    // client — an unexpected error here could be a raw Supabase/Postgres
    // message ("duplicate key value violates constraint...") that
    // reveals schema details for no benefit to the caller.
    console.error("AI chat unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
