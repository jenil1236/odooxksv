import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity, createNotification } from "@/lib/activity";

// POST /api/approvals/[id]/reject
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();

    if (!body.remarks || typeof body.remarks !== "string" || body.remarks.trim() === "") {
      return NextResponse.json({ error: "Remarks are required for rejection" }, { status: 400 });
    }

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
        status: "REJECTED",
        approverId: session.userId,
        rejectedAt: new Date(),
        remarks: body.remarks.trim(),
      },
    });

    await logActivity(
      session.userId,
      "APPROVAL_REJECTED",
      `Approval rejected for RFQ "${approval.rfq.title}" (ID: ${approval.rfq.id}). Reason: ${body.remarks.trim()}`
    );

    // Notify the requester
    await createNotification(
      approval.requestedById,
      "Quotation Rejected",
      `Your approval request for RFQ "${approval.rfq.title}" was REJECTED.`
    );

    return NextResponse.json({ message: "Approval rejected successfully", approval: updatedApproval });
  } catch (err) {
    console.error("[approvals/[id]/reject POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
