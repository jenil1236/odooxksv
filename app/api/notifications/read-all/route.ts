import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// PUT /api/notifications/read-all — Mark all notifications as read for current user
export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.notification.updateMany({
      where: { userId: session.userId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("[notifications/read-all PUT]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
