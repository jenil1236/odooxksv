import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/reports/spend-by-category
export async function GET() {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Group invoices by RFQ category
    const invoices = await prisma.invoice.findMany({
      select: {
        grandTotal: true,
        rfq: { select: { category: true } },
      },
    });

    const categoryMap: Record<string, number> = {};
    for (const inv of invoices) {
      const cat = inv.rfq?.category ?? "Uncategorized";
      categoryMap[cat] = (categoryMap[cat] ?? 0) + inv.grandTotal;
    }

    const data = Object.entries(categoryMap)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[reports/spend-by-category GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
