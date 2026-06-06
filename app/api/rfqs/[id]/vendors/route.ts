import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

// POST /api/rfqs/[id]/vendors — Assign vendors to RFQ
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["PROCUREMENT_OFFICER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { vendorIds } = body;

    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return NextResponse.json({ error: "At least one vendor must be assigned" }, { status: 400 });
    }

    const rfq = await prisma.rFQ.findUnique({ where: { id } });
    if (!rfq) return NextResponse.json({ error: "RFQ not found" }, { status: 404 });

    // Upsert invitations (skip duplicates)
    const results = [];
    for (const vendorId of vendorIds) {
      const inv = await prisma.rFQInvitation.upsert({
        where: { rfqId_vendorId: { rfqId: id, vendorId } },
        update: {},
        create: { rfqId: id, vendorId },
      });
      results.push(inv);
    }

    await logActivity(
      session.userId,
      "VENDOR_ASSIGNED",
      `Assigned ${vendorIds.length} vendor(s) to RFQ "${rfq.title}" (ID: ${id})`
    );

    return NextResponse.json({ message: "Vendors assigned", invitations: results });
  } catch (err) {
    console.error("[rfqs/[id]/vendors POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/rfqs/[id]/vendors — Get vendors assigned to RFQ
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const invitations = await prisma.rFQInvitation.findMany({
      where: { rfqId: id },
      include: {
        vendor: { select: { id: true, companyName: true, contactEmail: true, status: true } },
      },
    });

    return NextResponse.json({ invitations });
  } catch (err) {
    console.error("[rfqs/[id]/vendors GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
