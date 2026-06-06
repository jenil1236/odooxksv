import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity, createNotification } from "@/lib/activity";

// POST /api/approvals/[id]/approve
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        rfq: true,
      },
    });

    if (!approval) return NextResponse.json({ error: "Approval record not found" }, { status: 404 });
    if (approval.status !== "PENDING") {
      return NextResponse.json({ error: `Approval is already ${approval.status}` }, { status: 400 });
    }

    const updatedApproval = await prisma.approval.update({
      where: { id },
      data: {
        status: "APPROVED",
        approverId: session.userId,
        approvedAt: new Date(),
      },
    });

    await logActivity(
      session.userId,
      "APPROVAL_APPROVED",
      `Approval approved for RFQ "${approval.rfq.title}" (ID: ${approval.rfq.id})`
    );

    // Notify the requester
    await createNotification(
      approval.requestedById,
      "Quotation Approved",
      `Your approval request for RFQ "${approval.rfq.title}" has been APPROVED.`
    );

    return NextResponse.json({ message: "Approval granted successfully", approval: updatedApproval });
  } catch (err) {
    console.error("[approvals/[id]/approve POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
