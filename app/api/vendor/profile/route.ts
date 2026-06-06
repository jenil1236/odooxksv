import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAuth(["VENDOR"]);
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.userId },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    return NextResponse.json({ vendor });
  } catch (err) {
    console.error("[vendor/profile GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
