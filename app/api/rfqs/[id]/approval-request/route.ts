import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity, createNotification } from "@/lib/activity";

// POST /api/rfqs/[id]/approval-request
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["PROCUREMENT_OFFICER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: rfqId } = await params;

    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: {
        selectedQuotation: {
          include: { vendor: { select: { id: true, companyName: true } } },
        },
      },
    });

    if (!rfq) return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    if (rfq.status !== "CLOSED") {
      return NextResponse.json({ error: "Approval can only be requested for CLOSED RFQs with a selected quotation" }, { status: 400 });
    }
    if (!rfq.selectedQuotationId) {
      return NextResponse.json({ error: "No quotation has been selected for this RFQ" }, { status: 400 });
    }

    // Only one active approval per RFQ
    const existing = await prisma.approval.findFirst({
      where: {
        rfqId,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "An active approval record already exists for this RFQ" }, { status: 409 });
    }

    const approval = await prisma.approval.create({
      data: {
        rfqId,
        quotationId: rfq.selectedQuotationId,
        requestedById: session.userId,
        status: "PENDING",
      },
    });

    await logActivity(
      session.userId,
      "APPROVAL_REQUESTED",
      `Approval requested for RFQ "${rfq.title}" (ID: ${rfqId})`
    );

    // Notify all MANAGER_APPROVER users in the same organization
    const managers = await prisma.user.findMany({
      where: {
        role: "MANAGER_APPROVER",
        isActive: true,
      },
    });
    for (const manager of managers) {
      await createNotification(
        manager.id,
        "Approval Pending",
        `Approval pending for RFQ "${rfq.title}" — vendor: ${rfq.selectedQuotation?.vendor.companyName}`
      );
    }

    return NextResponse.json({ message: "Approval requested successfully", approval }, { status: 201 });
  } catch (err) {
    console.error("[rfqs/[id]/approval-request POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
