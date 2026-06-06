import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// PATCH /api/notifications/[id]/read
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== session.userId) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    await prisma.notification.update({ where: { id }, data: { read: true } });

    return NextResponse.json({ message: "Marked as read" });
  } catch (err) {
    console.error("[notifications/[id]/read PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
