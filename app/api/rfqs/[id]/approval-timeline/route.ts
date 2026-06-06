import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/rfqs/[id]/approval-timeline
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: rfqId } = await params;

    // Get all approvals for this RFQ (history)
    const approvals = await prisma.approval.findMany({
      where: { rfqId },
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approver: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Build timeline events from the approvals
    const events: { timestamp: Date; type: string; actor: string; detail: string }[] = [];
    for (const a of approvals) {
      events.push({
        timestamp: a.createdAt,
        type: "REQUESTED",
        actor: `${a.requestedBy.firstName} ${a.requestedBy.lastName}`,
        detail: "Approval requested",
      });
      if (a.status === "APPROVED" && a.approvedAt && a.approver) {
        events.push({
          timestamp: a.approvedAt,
          type: "APPROVED",
          actor: `${a.approver.firstName} ${a.approver.lastName}`,
          detail: "Quotation approved",
        });
      }
      if (a.status === "REJECTED" && a.rejectedAt && a.approver) {
        events.push({
          timestamp: a.rejectedAt,
          type: "REJECTED",
          actor: `${a.approver.firstName} ${a.approver.lastName}`,
          detail: a.remarks ? `Rejected — ${a.remarks}` : "Quotation rejected",
        });
      }
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ timeline: events, approvals });
  } catch (err) {
    console.error("[rfqs/[id]/approval-timeline GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
