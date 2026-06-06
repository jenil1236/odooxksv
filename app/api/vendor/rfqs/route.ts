import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/vendor/rfqs — Assigned RFQs for the logged-in vendor
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(["VENDOR"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Find the vendor profile linked to this user
    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = { vendorId: vendor.id };
    if (status) {
      where.rfq = { status };
    }

    const invitations = await prisma.rFQInvitation.findMany({
      where,
      include: {
        rfq: {
          include: {
            items: { select: { id: true } },
            _count: { select: { quotations: true } },
          },
        },
      },
      orderBy: { invitedAt: "desc" },
    });

    // Check if vendor already submitted quotation
    const quotations = await prisma.quotation.findMany({
      where: { vendorId: vendor.id },
      select: { rfqId: true, status: true, grandTotal: true },
    });
    const quotationMap = new Map(quotations.map((q) => [q.rfqId, q]));

    const rfqs = invitations.map((inv) => ({
      ...inv.rfq,
      invitedAt: inv.invitedAt,
      myQuotation: quotationMap.get(inv.rfq.id) || null,
    }));

    return NextResponse.json({ rfqs });
  } catch (err) {
    console.error("[vendor/rfqs GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
