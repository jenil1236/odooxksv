import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/vendor/rfqs/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["VENDOR"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

    // Verify the vendor is invited to this RFQ
    const invitation = await prisma.rFQInvitation.findUnique({
      where: { rfqId_vendorId: { rfqId: id, vendorId: vendor.id } },
    });
    if (!invitation) return NextResponse.json({ error: "RFQ not found or not assigned to you" }, { status: 404 });

    const rfq = await prisma.rFQ.findUnique({
      where: { id },
      include: {
        items: true,
        attachments: true,
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!rfq) return NextResponse.json({ error: "RFQ not found" }, { status: 404 });

    // Include this vendor's quotation if exists
    const myQuotation = await prisma.quotation.findUnique({
      where: { rfqId_vendorId: { rfqId: id, vendorId: vendor.id } },
      include: { items: true },
    });

    return NextResponse.json({ rfq, myQuotation });
  } catch (err) {
    console.error("[vendor/rfqs/[id] GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
