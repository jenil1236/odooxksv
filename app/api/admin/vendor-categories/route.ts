import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const categories = await prisma.vendorCategory.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        _count: { select: { vendors: true } },
      },
    });

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("[vendor-categories GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN"]);
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const existing = await prisma.vendorCategory.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }

    const category = await prisma.vendorCategory.create({
      data: { name, description: description ?? null },
    });

    await logActivity(
      session.userId,
      "CREATE_VENDOR_CATEGORY",
      `Created category "${name}"`
    );

    return NextResponse.json({ message: "Category created", category }, { status: 201 });
  } catch (err) {
    console.error("[vendor-categories POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
