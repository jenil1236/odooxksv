import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/invoices
export async function GET() {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { companyName: true } },
        rfq: { select: { title: true } },
        purchaseOrder: { select: { poNumber: true } },
      },
    });

    return NextResponse.json({ invoices });
  } catch (err) {
    console.error("[invoices GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
