import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity, createNotification } from "@/lib/activity";

// POST /api/vendor/rfqs/[id]/quotation — Submit quotation
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["VENDOR"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: rfqId } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

    // Verify invitation
    const invitation = await prisma.rFQInvitation.findUnique({
      where: { rfqId_vendorId: { rfqId, vendorId: vendor.id } },
    });
    if (!invitation) return NextResponse.json({ error: "You are not assigned to this RFQ" }, { status: 403 });

    // Verify RFQ is published and deadline not passed
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: { items: true, createdBy: { select: { id: true } } },
    });
    if (!rfq) return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    if (rfq.status !== "PUBLISHED") {
      return NextResponse.json({ error: "RFQ is not published" }, { status: 400 });
    }
    if (new Date(rfq.deadline) < new Date()) {
      return NextResponse.json({ error: "RFQ deadline has passed" }, { status: 400 });
    }

    const body = await req.json();
    const { notes, paymentTerms, gstPercent, items, isDraft } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    // Validate items
    for (const item of items) {
      if (Number(item.unitPrice) <= 0) {
        return NextResponse.json({ error: "Unit price must be greater than 0" }, { status: 400 });
      }
      if (Number(item.deliveryDays) < 0) {
        return NextResponse.json({ error: "Delivery days cannot be negative" }, { status: 400 });
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: { unitPrice: number; quantity: number }) => {
      return sum + Number(item.unitPrice) * Number(item.quantity);
    }, 0);
    const gst = Number(gstPercent) || 0;
    const grandTotal = subtotal + (subtotal * gst) / 100;

    const status = isDraft ? "DRAFT" : "SUBMITTED";

    // Check if quotation already exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { rfqId_vendorId: { rfqId, vendorId: vendor.id } },
    });

    let quotation;
    if (existingQuotation) {
      // Update existing
      await prisma.quotationItem.deleteMany({ where: { quotationId: existingQuotation.id } });
      quotation = await prisma.quotation.update({
        where: { id: existingQuotation.id },
        data: {
          status,
          notes: notes || null,
          paymentTerms: paymentTerms || null,
          gstPercent: gst,
          subtotal,
          grandTotal,
          submittedAt: status === "SUBMITTED" ? new Date() : existingQuotation.submittedAt,
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
    } else {
      quotation = await prisma.quotation.create({
        data: {
          rfqId,
          vendorId: vendor.id,
          status,
          notes: notes || null,
          paymentTerms: paymentTerms || null,
          gstPercent: gst,
          subtotal,
          grandTotal,
          submittedAt: status === "SUBMITTED" ? new Date() : null,
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
    }

    await logActivity(
      session.userId,
      status === "SUBMITTED" ? "QUOTATION_SUBMITTED" : "QUOTATION_SAVED_DRAFT",
      `${status === "SUBMITTED" ? "Submitted" : "Saved draft"} quotation for RFQ "${rfq.title}" (ID: ${rfqId})`
    );

    // Notify procurement officer when submitted
    if (status === "SUBMITTED") {
      const vendorProfile = await prisma.vendor.findUnique({
        where: { id: vendor.id },
        select: { companyName: true },
      });
      await createNotification(
        rfq.createdBy.id,
        "Quotation Received",
        `Quotation received from ${vendorProfile?.companyName ?? "a vendor"} for RFQ: ${rfq.title}`
      );
    }

    return NextResponse.json({ message: `Quotation ${status === "SUBMITTED" ? "submitted" : "saved"}`, quotation }, { status: 201 });
  } catch (err) {
    console.error("[vendor/rfqs/[id]/quotation POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
