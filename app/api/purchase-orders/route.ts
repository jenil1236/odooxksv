import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/purchase-orders
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vendor: {
          select: { companyName: true, contactName: true },
        },
        rfq: {
          select: { title: true },
        },
        approvedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({ purchaseOrders });
  } catch (err) {
    console.error("[purchase-orders GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
