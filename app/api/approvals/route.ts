import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/approvals
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Fetch all approvals
    const approvals = await prisma.approval.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        rfq: {
          select: { title: true, category: true },
        },
        quotation: {
          include: {
            vendor: { select: { companyName: true } },
          },
        },
        requestedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({ approvals });
  } catch (err) {
    console.error("[approvals GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
