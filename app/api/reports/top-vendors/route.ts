import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/reports/top-vendors
export async function GET() {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const invoices = await prisma.invoice.findMany({
      select: {
        grandTotal: true,
        vendor: { select: { id: true, companyName: true } },
        status: true,
      },
    });

    const vendorMap: Record<string, { companyName: string; total: number; invoiceCount: number }> = {};
    for (const inv of invoices) {
      const id = inv.vendor.id;
      if (!vendorMap[id]) {
        vendorMap[id] = { companyName: inv.vendor.companyName, total: 0, invoiceCount: 0 };
      }
      vendorMap[id].total += inv.grandTotal;
      vendorMap[id].invoiceCount += 1;
    }

    const data = Object.entries(vendorMap)
      .map(([vendorId, v]) => ({ vendorId, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[reports/top-vendors GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
