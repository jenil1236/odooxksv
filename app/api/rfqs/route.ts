import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

// GET /api/rfqs — List RFQs
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }
    if (status) where.status = status;
    if (category) where.category = { contains: category, mode: "insensitive" };

    // Scope by organization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { organizationId: true },
    });
    if (currentUser?.organizationId) {
      where.organizationId = currentUser.organizationId;
    }

    const rfqs = await prisma.rFQ.findMany({
      where,
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        items: { select: { id: true } },
        invitations: {
          include: { vendor: { select: { id: true, companyName: true } } },
        },
        _count: { select: { quotations: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ rfqs });
  } catch (err) {
    console.error("[rfqs GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/rfqs — Create RFQ
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(["PROCUREMENT_OFFICER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { title, category, description, deadline, items, vendorIds } = body;

    if (!title || !category || !deadline) {
      return NextResponse.json({ error: "Title, category, and deadline are required" }, { status: 400 });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return NextResponse.json({ error: "Deadline must be a future date" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    for (const item of items) {
      if (!item.itemName || item.quantity === undefined || !item.unit) {
        return NextResponse.json({ error: "Each item must have a name, quantity, and unit" }, { status: 400 });
      }
      if (Number(item.quantity) <= 0) {
        return NextResponse.json({ error: "Item quantity must be greater than 0" }, { status: 400 });
      }
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { organizationId: true },
    });

    const rfq = await prisma.rFQ.create({
      data: {
        title,
        category,
        description: description || null,
        deadline: deadlineDate,
        status: "DRAFT",
        createdById: session.userId,
        organizationId: currentUser?.organizationId ?? null,
        items: {
          create: items.map((item: { itemName: string; quantity: number; unit: string; description?: string }) => ({
            itemName: item.itemName,
            quantity: Number(item.quantity),
            unit: item.unit,
            description: item.description || null,
          })),
        },
        invitations: vendorIds && Array.isArray(vendorIds) && vendorIds.length > 0
          ? { create: vendorIds.map((vendorId: string) => ({ vendorId })) }
          : undefined,
      },
      include: { items: true, invitations: true },
    });

    await logActivity(session.userId, "RFQ_CREATED", `Created RFQ "${title}" (ID: ${rfq.id})`);

    return NextResponse.json({ message: "RFQ created successfully", rfq }, { status: 201 });
  } catch (err) {
    console.error("[rfqs POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
