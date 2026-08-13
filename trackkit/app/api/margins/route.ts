import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    // Parse authorization token
    let token = "";
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("token")?.value || "";
    }

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Initialize Supabase client scoped to this user token to respect RLS
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
      },
    });

    // Get current user details
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Fetch all active (non-deleted) products for the user
    const { data: products, error: productsError } = await client
      .from("products")
      .select("*")
      .is("deleted_at", null);

    if (productsError) {
      return NextResponse.json(
        { error: productsError.message, code: "DB_ERROR" },
        { status: 500 }
      );
    }

    // Fetch sales transactions from the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: sales, error: salesError } = await client
      .from("transactions")
      .select("product_id, quantity")
      .eq("transaction_type", "sale")
      .gte("created_at", sevenDaysAgo);

    if (salesError) {
      return NextResponse.json(
        { error: salesError.message, code: "DB_ERROR" },
        { status: 500 }
      );
    }

    // Sum sales quantities grouped by product_id
    const salesMap: Record<string, number> = {};
    if (sales) {
      for (const sale of sales) {
        if (!sale.product_id) continue;
        salesMap[sale.product_id] = (salesMap[sale.product_id] || 0) + (sale.quantity || 0);
      }
    }

    // Compute margins per product
    let profitableCount = 0;
    let totalMarginThisWeek = 0;
    let marginSum = 0;
    let marginCount = 0;

    const productsWithMargin = products.map((p) => {
      const costPerUnit = p.cost_per_unit ? Number(p.cost_per_unit) : null;
      const sellingPrice = p.selling_price_per_unit ? Number(p.selling_price_per_unit) : 0;
      const unitsSold = salesMap[p.id] || 0;

      let marginPercent: number | null = null;
      let marginAmount: number | null = null;

      if (costPerUnit !== null && costPerUnit > 0) {
        marginAmount = sellingPrice - costPerUnit;
        marginPercent = Math.round((marginAmount / costPerUnit) * 100);

        if (marginAmount > 0) {
          profitableCount++;
        }
        marginSum += marginPercent;
        marginCount++;
      } else {
        marginAmount = sellingPrice; // No cost = margin amount is full selling price
      }

      const totalProfitThisWeek = unitsSold * (marginAmount ?? 0);
      totalMarginThisWeek += totalProfitThisWeek;

      return {
        productId: p.id,
        name: p.name,
        costPerUnit,
        sellingPrice,
        marginPercent,
        marginAmount,
        units_sold_this_week: unitsSold,
        total_profit_this_week: totalProfitThisWeek,
      };
    });

    // Sort products by marginPercent (lowest first, nulls representing unconfigured costs first)
    productsWithMargin.sort((a, b) => {
      if (a.marginPercent === null && b.marginPercent === null) return 0;
      if (a.marginPercent === null) return -1;
      if (b.marginPercent === null) return 1;
      return a.marginPercent - b.marginPercent;
    });

    const averageMargin = marginCount > 0 ? Math.round(marginSum / marginCount) : 0;

    return NextResponse.json({
      products: productsWithMargin,
      summary: {
        totalProducts: products.length,
        profitableCount,
        totalMarginThisWeek,
        averageMargin,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: message, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
