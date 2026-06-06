import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

// GET /api/invoices/[id]/pdf — returns invoice data for client-side print/PDF
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        vendor: true,
        rfq: { select: { id: true, title: true, category: true } },
        purchaseOrder: { select: { id: true, poNumber: true } },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    await logActivity(session.userId, "INVOICE_PDF_DOWNLOADED", `Invoice ${invoice.invoiceNumber} PDF viewed/downloaded`);

    return NextResponse.json({ invoice });
  } catch (err) {
    console.error("[invoices/[id]/pdf GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
