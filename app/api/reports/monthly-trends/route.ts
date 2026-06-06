import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/reports/monthly-trends
export async function GET() {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Last 12 months
    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceDate: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 11, 1)),
        },
      },
      select: { invoiceDate: true, grandTotal: true },
      orderBy: { invoiceDate: "asc" },
    });

    const monthMap: Record<string, number> = {};
    for (const inv of invoices) {
      const key = `${inv.invoiceDate.getFullYear()}-${String(inv.invoiceDate.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] ?? 0) + inv.grandTotal;
    }

    const data = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[reports/monthly-trends GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
