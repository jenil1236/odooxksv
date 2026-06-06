import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

// PATCH /api/invoices/[id]/paid
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["PROCUREMENT_OFFICER", "ADMIN"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (invoice.status === "PAID") return NextResponse.json({ error: "Invoice is already marked as paid" }, { status: 400 });

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: "PAID" },
    });

    await logActivity(session.userId, "INVOICE_MARKED_PAID", `Invoice ${invoice.invoiceNumber} marked as PAID`);

    return NextResponse.json({ message: "Invoice marked as paid", invoice: updated });
  } catch (err) {
    console.error("[invoices/[id]/paid PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
