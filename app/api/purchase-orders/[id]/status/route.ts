import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

// PATCH /api/purchase-orders/[id]/status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["PROCUREMENT_OFFICER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();

    if (!body.status || !["GENERATED", "SENT", "FULFILLED", "CANCELLED"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!purchaseOrder) {
      return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
    }

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: body.status },
    });

    await logActivity(
      session.userId,
      "PO_STATUS_UPDATED",
      `PO ${updatedPO.poNumber} status updated to ${updatedPO.status}`
    );

    return NextResponse.json({ message: "Status updated successfully", purchaseOrder: updatedPO });
  } catch (err) {
    console.error("[purchase-orders/[id]/status PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
