import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/rfqs/[id]/approval
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: rfqId } = await params;

    const approval = await prisma.approval.findFirst({
      where: { rfqId },
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approver: { select: { id: true, firstName: true, lastName: true, email: true } },
        quotation: {
          include: {
            vendor: {
              select: {
                id: true,
                companyName: true,
                contactName: true,
                contactEmail: true,
                contactPhone: true,
                city: true,
                state: true,
                country: true,
                rating: true,
              },
            },
            items: {
              include: {
                rfqItem: { select: { itemName: true, unit: true, description: true } },
              },
            },
          },
        },
        rfq: {
          select: {
            id: true,
            title: true,
            category: true,
            deadline: true,
            status: true,
          },
        },
      },
    });

    if (!approval) {
      return NextResponse.json({ approval: null });
    }

    return NextResponse.json({ approval });
  } catch (err) {
    console.error("[rfqs/[id]/approval GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
