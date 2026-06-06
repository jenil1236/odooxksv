import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/rfqs/[id]/quotations — Get all quotations for an RFQ
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    // Check if RFQ exists
    const rfq = await prisma.rFQ.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    });
    if (!rfq) return NextResponse.json({ error: "RFQ not found" }, { status: 404 });

    // Fetch all quotations (submitted or revised)
    const quotations = await prisma.quotation.findMany({
      where: {
        rfqId: id,
        status: { in: ["SUBMITTED", "REVISED", "SELECTED", "REJECTED"] },
      },
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
            rating: true,
            status: true,
          },
        },
        items: {
          select: {
            id: true,
            rfqItemId: true,
            unitPrice: true,
            quantity: true,
            deliveryDays: true,
            total: true,
          },
        },
      },
      orderBy: { grandTotal: "asc" },
    });

    // Format Decimal rating as number for JSON safety
    const formattedQuotations = quotations.map((q) => {
      const vendorRating = q.vendor.rating ? Number(q.vendor.rating) : 0;
      return {
        ...q,
        vendor: {
          ...q.vendor,
          rating: vendorRating,
        },
      };
    });

    return NextResponse.json({ quotations: formattedQuotations });
  } catch (err) {
    console.error("[rfqs/[id]/quotations GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
