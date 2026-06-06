import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity, createNotification } from "@/lib/activity";

// POST /api/quotations/[id]/select — Select winning quotation
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["PROCUREMENT_OFFICER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: quotationId } = await params;

    // Fetch the target quotation with its RFQ details
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        rfq: true,
        vendor: {
          select: {
            id: true,
            companyName: true,
            userId: true,
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const rfq = quotation.rfq;

    // Validation Rules:
    // 1. RFQ must be active (status should be PUBLISHED; drafts/closed/approved cannot be selected)
    if (rfq.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Quotation selection is only allowed on active, published RFQs" }, { status: 400 });
    }

    // 2. RFQ must not already have a selected quotation
    if (rfq.selectedQuotationId) {
      return NextResponse.json({ error: "A winning quotation has already been selected for this RFQ" }, { status: 400 });
    }

    // 3. Quotation must be submitted or revised
    if (quotation.status !== "SUBMITTED" && quotation.status !== "REVISED") {
      return NextResponse.json({ error: "Only submitted or revised quotations can be selected" }, { status: 400 });
    }

    // 4. Double check quotation belongs to the RFQ (guaranteed by model but safe to keep)
    if (quotation.rfqId !== rfq.id) {
      return NextResponse.json({ error: "Quotation does not belong to this RFQ" }, { status: 400 });
    }

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the winning quotation status to SELECTED
      const winner = await tx.quotation.update({
        where: { id: quotationId },
        data: { status: "SELECTED" },
      });

      // Update remaining submitted/revised/draft quotations for this RFQ to REJECTED
      await tx.quotation.updateMany({
        where: {
          rfqId: rfq.id,
          id: { not: quotationId },
        },
        data: { status: "REJECTED" },
      });

      // Update the RFQ to store the selected quotation and set status to CLOSED
      const updatedRfq = await tx.rFQ.update({
        where: { id: rfq.id },
        data: {
          selectedQuotationId: quotationId,
          status: "CLOSED",
        },
      });

      return { winner, updatedRfq };
    });

    // Logging & Notifications
    await logActivity(
      session.userId,
      "WINNING_VENDOR_SELECTED",
      `Selected vendor "${quotation.vendor.companyName}" (Quotation ID: ${quotationId}) as winner for RFQ "${rfq.title}" (ID: ${rfq.id})`
    );

    // Notify the selected vendor
    if (quotation.vendor.userId) {
      await createNotification(
        quotation.vendor.userId,
        "Quotation Selected",
        `Your quotation has been selected for RFQ: ${rfq.title}.`
      );
    }

    // Fetch and notify remaining vendors who submitted a quotation
    const otherQuotations = await prisma.quotation.findMany({
      where: {
        rfqId: rfq.id,
        id: { not: quotationId },
      },
      include: {
        vendor: { select: { id: true, companyName: true, userId: true } },
      },
    });

    for (const q of otherQuotations) {
      if (q.vendor.userId) {
        await createNotification(
          q.vendor.userId,
          "RFQ Closed",
          `RFQ closed. Another vendor was selected for: ${rfq.title}.`
        );
      }
      // Log rejection
      await logActivity(
        session.userId,
        "QUOTATION_REJECTED",
        `Quotation (ID: ${q.id}) from vendor "${q.vendor.companyName}" was rejected for RFQ "${rfq.title}"`
      );
    }

    return NextResponse.json({
      message: "Quotation selected successfully, remaining rejected",
      rfq: result.updatedRfq,
      quotation: result.winner,
    });
  } catch (err) {
    console.error("[quotations/[id]/select POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
