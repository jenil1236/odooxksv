import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/reports/summary
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // format: "2024-06"

    let dateFilter: { gte?: Date; lt?: Date } = {};
    if (month) {
      const [y, m] = month.split("-").map(Number);
      dateFilter = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      };
    }

    const [
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      activeVendors,
      totalPOs,
      fulfilledPOs,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        _count: true,
        where: month ? { invoiceDate: dateFilter } : {},
      }),
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        _count: true,
        where: { status: "PAID", ...(month ? { invoiceDate: dateFilter } : {}) },
      }),
      prisma.invoice.count({
        where: { status: "OVERDUE", ...(month ? { invoiceDate: dateFilter } : {}) },
      }),
      prisma.vendor.count({ where: { status: "ACTIVE" } }),
      prisma.purchaseOrder.count({ where: month ? { createdAt: dateFilter } : {} }),
      prisma.purchaseOrder.count({ where: { status: "FULFILLED", ...(month ? { createdAt: dateFilter } : {}) } }),
    ]);

    return NextResponse.json({
      totalSpend: totalInvoices._sum.grandTotal ?? 0,
      invoiceCount: totalInvoices._count,
      paidSpend: paidInvoices._sum.grandTotal ?? 0,
      paidCount: paidInvoices._count,
      overdueCount: overdueInvoices,
      activeVendors,
      totalPOs,
      fulfilledPOs,
      poFulfillmentRate: totalPOs > 0 ? Math.round((fulfilledPOs / totalPOs) * 100) : 0,
    });
  } catch (err) {
    console.error("[reports/summary GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
