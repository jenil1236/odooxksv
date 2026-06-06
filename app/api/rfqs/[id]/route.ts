import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

// GET /api/rfqs/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const rfq = await prisma.rFQ.findUnique({
      where: { id },
      include: {
        createdBy: { select: { firstName: true, lastName: true, email: true } },
        items: true,
        invitations: {
          include: { vendor: { select: { id: true, companyName: true, contactEmail: true } } },
        },
        attachments: true,
        _count: { select: { quotations: true } },
        quotations: {
          include: {
            vendor: { select: { id: true, companyName: true } },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!rfq) return NextResponse.json({ error: "RFQ not found" }, { status: 404 });

    return NextResponse.json({ rfq });
  } catch (err) {
    console.error("[rfqs/[id] GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/rfqs/[id] — Edit RFQ (only DRAFT)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["PROCUREMENT_OFFICER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { title, category, description, deadline, items } = body;

    const existing = await prisma.rFQ.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    if (existing.status !== "DRAFT") {
      return NextResponse.json({ error: "Only DRAFT RFQs can be edited" }, { status: 400 });
    }

    if (deadline) {
      const d = new Date(deadline);
      if (isNaN(d.getTime()) || d <= new Date()) {
        return NextResponse.json({ error: "Deadline must be a future date" }, { status: 400 });
      }
    }

    // Update RFQ fields
    const updatedRfq = await prisma.rFQ.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(category && { category }),
        description: description !== undefined ? description : existing.description,
        ...(deadline && { deadline: new Date(deadline) }),
      },
    });

    // If items provided, replace them all
    if (items && Array.isArray(items)) {
      if (items.length === 0) {
        return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
      }
      await prisma.rFQItem.deleteMany({ where: { rfqId: id } });
      await prisma.rFQItem.createMany({
        data: items.map((item: { itemName: string; quantity: number; unit: string; description?: string }) => ({
          rfqId: id,
          itemName: item.itemName,
          quantity: Number(item.quantity),
          unit: item.unit,
          description: item.description || null,
        })),
      });
    }

    await logActivity(session.userId, "RFQ_UPDATED", `Updated RFQ "${updatedRfq.title}" (ID: ${id})`);

    return NextResponse.json({ message: "RFQ updated", rfq: updatedRfq });
  } catch (err) {
    console.error("[rfqs/[id] PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
