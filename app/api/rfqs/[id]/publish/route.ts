import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity, createNotification } from "@/lib/activity";

// POST /api/rfqs/[id]/publish
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["PROCUREMENT_OFFICER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const rfq = await prisma.rFQ.findUnique({
      where: { id },
      include: {
        items: true,
        invitations: {
          include: { vendor: { include: { user: { select: { id: true } } } } },
        },
      },
    });

    if (!rfq) return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    if (rfq.status !== "DRAFT") {
      return NextResponse.json({ error: "Only DRAFT RFQs can be published" }, { status: 400 });
    }
    if (rfq.items.length === 0) {
      return NextResponse.json({ error: "RFQ must have at least one item before publishing" }, { status: 400 });
    }
    if (rfq.invitations.length === 0) {
      return NextResponse.json({ error: "At least one vendor must be assigned before publishing" }, { status: 400 });
    }

    const published = await prisma.rFQ.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    await logActivity(session.userId, "RFQ_PUBLISHED", `Published RFQ "${rfq.title}" (ID: ${id})`);

    // Notify each invited vendor's user
    for (const inv of rfq.invitations) {
      if (inv.vendor.user?.id) {
        await createNotification(
          inv.vendor.user.id,
          "New RFQ Assigned",
          `New RFQ assigned: ${rfq.title}. Deadline: ${new Date(rfq.deadline).toLocaleDateString()}`
        );
      }
    }

    return NextResponse.json({ message: "RFQ published successfully", rfq: published });
  } catch (err) {
    console.error("[rfqs/[id]/publish POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
