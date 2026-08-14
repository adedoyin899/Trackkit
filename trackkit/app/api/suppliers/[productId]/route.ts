import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || supabaseUrl === "https://placeholder-url.supabase.co") {
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

  // Aggregate per supplier
  const { data, error } = await supabase
    .from("transactions")
    .select("supplier, cost_per_unit, quantity, created_at")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("transaction_type", "restock")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];

  // Group by supplier
  const supplierMap = new Map<
    string,
    {
      prices: number[];
      quantities: number[];
      dates: string[];
    }
  >();

  for (const row of rows) {
    const name = (row.supplier as string | null) ?? "Unknown";
    if (!supplierMap.has(name)) {
      supplierMap.set(name, { prices: [], quantities: [], dates: [] });
    }
    const entry = supplierMap.get(name)!;
    if (row.cost_per_unit != null) entry.prices.push(row.cost_per_unit as number);
    entry.quantities.push(row.quantity as number);
    entry.dates.push(row.created_at as string);
  }

  const suppliers = Array.from(supplierMap.entries()).map(([name, { prices, quantities, dates }]) => {
    const avgPrice = prices.length > 0
      ? prices.reduce((s, p) => s + p, 0) / prices.length
      : null;
    const totalSpent = prices.reduce((s, p, i) => s + p * (quantities[i] ?? 0), 0);
    const totalQty = quantities.reduce((s, q) => s + q, 0);
    const lastPrice = prices[0] ?? null;
    const lastDate = dates[0] ?? null;

    return {
      name,
      lastPrice,
      lastDate,
      totalSpent,
      totalQty,
      avgPrice,
      purchaseCount: dates.length,
    };
  });

  // Sort cheapest first
  suppliers.sort((a, b) => (a.avgPrice ?? Infinity) - (b.avgPrice ?? Infinity));

  // Cheapest supplier's avg price is the baseline — every other supplier's
  // savingsPercent is how much MORE they cost relative to it.
  const minAvg = suppliers.reduce((mn, s) => Math.min(mn, s.avgPrice ?? Infinity), Infinity);

  const result = suppliers.map((s, idx) => ({
    ...s,
    savingsPercent:
      minAvg > 0 && minAvg !== Infinity && s.avgPrice != null
        ? Math.round(((s.avgPrice - minAvg) / minAvg) * 100)
        : 0,
    isCheapest: idx === 0 && suppliers.length > 1,
  }));

  return NextResponse.json({ suppliers: result });
}
