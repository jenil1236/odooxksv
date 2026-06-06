import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/reports/export — returns CSV
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    let dateFilter: { gte?: Date; lt?: Date } = {};
    if (month) {
      const [y, m] = month.split("-").map(Number);
      dateFilter = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }

    const invoices = await prisma.invoice.findMany({
      where: month ? { invoiceDate: dateFilter } : {},
      include: {
        vendor: { select: { companyName: true, contactEmail: true } },
        rfq: { select: { title: true, category: true } },
        purchaseOrder: { select: { poNumber: true } },
      },
      orderBy: { invoiceDate: "desc" },
    });

    const rows = [
      ["Invoice No", "PO Number", "RFQ", "Category", "Vendor", "Vendor Email", "Invoice Date", "Due Date", "Subtotal", "CGST", "SGST", "Grand Total", "Status"],
      ...invoices.map((inv) => [
        inv.invoiceNumber,
        inv.purchaseOrder.poNumber,
        inv.rfq.title,
        inv.rfq.category,
        inv.vendor.companyName,
        inv.vendor.contactEmail,
        inv.invoiceDate.toISOString().split("T")[0],
        inv.dueDate.toISOString().split("T")[0],
        inv.subtotal.toFixed(2),
        inv.cgstAmount.toFixed(2),
        inv.sgstAmount.toFixed(2),
        inv.grandTotal.toFixed(2),
        inv.status,
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="vendorbridge-report-${month ?? "all"}.csv"`,
      },
    });
  } catch (err) {
    console.error("[reports/export GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
