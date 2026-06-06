import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/quotations/[id] — Get single quotation details
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        rfq: {
          select: {
            id: true,
            title: true,
            category: true,
            deadline: true,
            status: true,
          },
        },
        vendor: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
            address: true,
            city: true,
            state: true,
            country: true,
            rating: true,
            userId: true,
          },
        },
        items: {
          include: {
            rfqItem: {
              select: {
                itemName: true,
                unit: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // Role-based protection: VENDOR can only view their own quotation
    if (session.role === "VENDOR") {
      const vendorProfile = await prisma.vendor.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      if (!vendorProfile || quotation.vendorId !== vendorProfile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Format Decimal rating as number for JSON safety
    const formattedQuotation = {
      ...quotation,
      vendor: {
        ...quotation.vendor,
        rating: quotation.vendor.rating ? Number(quotation.vendor.rating) : 0,
      },
    };

    return NextResponse.json({ quotation: formattedQuotation });
  } catch (err) {
    console.error("[quotations/[id] GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
