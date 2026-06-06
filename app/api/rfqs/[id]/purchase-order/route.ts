import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity, createNotification } from "@/lib/activity";

function generatePONumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PO-${year}-${random}`;
}

// POST /api/rfqs/[id]/purchase-order
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["PROCUREMENT_OFFICER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: rfqId } = await params;

    // Check if an APPROVED approval exists for this RFQ
    const approval = await prisma.approval.findFirst({
      where: {
        rfqId,
        status: "APPROVED",
      },
      include: {
        rfq: true,
        quotation: {
          include: {
            vendor: true,
            items: {
              include: {
                rfqItem: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!approval) {
      return NextResponse.json({ error: "An approved quotation is required to generate a PO" }, { status: 400 });
    }

    // Check if a PO already exists for this RFQ
    const existingPO = await prisma.purchaseOrder.findFirst({
      where: { rfqId },
    });

    if (existingPO) {
      return NextResponse.json({ error: "A Purchase Order has already been generated for this RFQ" }, { status: 400 });
    }

    const { quotation, rfq } = approval;

    // Generate PO and Items in transaction
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      // 1. Create PO
      const po = await tx.purchaseOrder.create({
        data: {
          poNumber: generatePONumber(),
          rfqId: rfq.id,
          quotationId: quotation.id,
          vendorId: quotation.vendorId,
          approvedById: approval.approverId!, // From the approval record
          status: "GENERATED",
          subtotal: quotation.subtotal,
          gstPercent: quotation.gstPercent,
          grandTotal: quotation.grandTotal,
          notes: quotation.paymentTerms ? `Payment Terms: ${quotation.paymentTerms}` : null,
        },
      });

      // 2. Create PO Items from Quotation Items
      const poItemsData = quotation.items.map(item => ({
        purchaseOrderId: po.id,
        itemName: item.rfqItem?.itemName || "Unknown Item",
        quantity: item.quantity,
        unit: item.rfqItem?.unit || "unit",
        unitPrice: item.unitPrice,
        total: item.total,
      }));

      await tx.purchaseOrderItem.createMany({
        data: poItemsData,
      });

      return await tx.purchaseOrder.findUnique({
        where: { id: po.id },
        include: { items: true },
      });
    });

    if (!purchaseOrder) {
      throw new Error("Failed to create PO");
    }

    await logActivity(
      session.userId,
      "PO_GENERATED",
      `PO ${purchaseOrder.poNumber} generated for RFQ "${rfq.title}"`
    );

    // Notify vendor
    if (quotation.vendor.userId) {
      await createNotification(
        quotation.vendor.userId,
        "Purchase Order Generated",
        `A Purchase Order (${purchaseOrder.poNumber}) has been generated for your quotation on RFQ: ${rfq.title}.`
      );
    }

    return NextResponse.json({ message: "Purchase Order generated successfully", purchaseOrder }, { status: 201 });
  } catch (err) {
    console.error("[rfqs/[id]/purchase-order POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
