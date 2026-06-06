import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

// GET /api/vendor/quotations/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["VENDOR"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        rfq: { include: { items: true, attachments: true } },
        items: { include: { rfqItem: true } },
      },
    });

    if (!quotation || quotation.vendorId !== vendor.id) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json({ quotation });
  } catch (err) {
    console.error("[vendor/quotations/[id] GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/vendor/quotations/[id] — Edit quotation (before deadline)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["VENDOR"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { rfq: true },
    });

    if (!quotation || quotation.vendorId !== vendor.id) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (new Date(quotation.rfq.deadline) < new Date()) {
      return NextResponse.json({ error: "Cannot edit quotation after RFQ deadline" }, { status: 400 });
    }

    const body = await req.json();
    const { notes, paymentTerms, gstPercent, items, isDraft } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: { unitPrice: number; quantity: number }) => {
      return sum + Number(item.unitPrice) * Number(item.quantity);
    }, 0);
    const gst = Number(gstPercent) || 0;
    const grandTotal = subtotal + (subtotal * gst) / 100;
    const status = isDraft ? "DRAFT" : "SUBMITTED";

    await prisma.quotationItem.deleteMany({ where: { quotationId: id } });

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        status,
        notes: notes || null,
        paymentTerms: paymentTerms || null,
        gstPercent: gst,
        subtotal,
        grandTotal,
        submittedAt: status === "SUBMITTED" ? (quotation.submittedAt ?? new Date()) : quotation.submittedAt,
        items: {
          create: items.map((item: { rfqItemId: string; unitPrice: number; quantity: number; deliveryDays: number }) => ({
            rfqItemId: item.rfqItemId,
            unitPrice: Number(item.unitPrice),
            quantity: Number(item.quantity),
            deliveryDays: Number(item.deliveryDays) || 0,
            total: Number(item.unitPrice) * Number(item.quantity),
          })),
        },
      },
      include: { items: true },
    });

    await logActivity(session.userId, "QUOTATION_UPDATED", `Updated quotation (ID: ${id}) for RFQ "${quotation.rfq.title}"`);

    return NextResponse.json({ message: "Quotation updated", quotation: updated });
  } catch (err) {
    console.error("[vendor/quotations/[id] PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
