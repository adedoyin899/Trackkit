import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || supabaseUrl === "https://placeholder-url.supabase.co") {
    // Offline mode — client should use local SQLite helpers directly
    return NextResponse.json(
      { error: "Cloud sync not configured", code: "OFFLINE_MODE" },
      { status: 503 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const productId = searchParams.get("productId") ?? undefined;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;
  const supplier = searchParams.get("supplier") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  let query = supabase
    .from("transactions")
    .select(`
      id,
      product_id,
      products!inner(name, unit),
      quantity,
      cost_per_unit,
      supplier,
      notes,
      created_at
    `, { count: "exact" })
    .eq("user_id", user.id)
    .eq("transaction_type", "restock")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (productId) query = query.eq("product_id", productId);
  if (startDate) query = query.gte("created_at", startDate);
  if (endDate) query = query.lte("created_at", `${endDate}T23:59:59.999Z`);
  if (supplier) query = query.ilike("supplier", `%${supplier}%`);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build entries
  const entries = (data ?? []).map((row: Record<string, unknown>) => {
    const product = row.products as { name: string; unit: string } | null;
    const qty = row.quantity as number;
    const cpu = row.cost_per_unit as number | null;
    return {
      id: row.id,
      product_id: row.product_id,
      product_name: product?.name ?? "Unknown",
      product_unit: product?.unit ?? "",
      quantity: qty,
      cost_per_unit: cpu,
      total_cost: cpu != null ? qty * cpu : null,
      supplier: row.supplier,
      notes: row.notes,
      created_at: row.created_at,
    };
  });

  // Summary aggregates
  const totalSpent = entries.reduce((s, e) => s + (e.total_cost ?? 0), 0);
  const costsWithValue = entries.filter((e) => e.cost_per_unit != null);
  const avgCostPerUnit =
    costsWithValue.length > 0
      ? costsWithValue.reduce((s, e) => s + (e.cost_per_unit ?? 0), 0) /
        costsWithValue.length
      : null;
  const totalUnits = entries.reduce((s, e) => s + e.quantity, 0);

  // Frequency: purchases per month over span
  let frequencyPerMonth = 0;
  if (entries.length > 1) {
    const dates = entries.map((e) => new Date(e.created_at as string).getTime());
    const spanMs = Math.max(...dates) - Math.min(...dates);
    const months = Math.max(1, spanMs / (1000 * 60 * 60 * 24 * 30));
    frequencyPerMonth = Math.round((entries.length / months) * 10) / 10;
  }

  return NextResponse.json({
    entries,
    total: count ?? entries.length,
    summary: { totalSpent, avgCostPerUnit, totalUnits, frequencyPerMonth },
  });
}
