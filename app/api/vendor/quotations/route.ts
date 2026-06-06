import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/vendor/quotations — List all quotations for the logged-in vendor
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(["VENDOR"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

    const quotations = await prisma.quotation.findMany({
      where: { vendorId: vendor.id },
      include: {
        rfq: { select: { id: true, title: true, category: true, deadline: true, status: true } },
        items: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ quotations });
  } catch (err) {
    console.error("[vendor/quotations GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
