import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

// POST /api/rfqs/[id]/attachments — Upload attachment metadata
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["PROCUREMENT_OFFICER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const rfq = await prisma.rFQ.findUnique({ where: { id } });
    if (!rfq) return NextResponse.json({ error: "RFQ not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Save file to /public/uploads/rfqs/
    const uploadDir = path.join(process.cwd(), "public", "uploads", "rfqs");
    await fs.mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/rfqs/${fileName}`;

    const attachment = await prisma.rFQAttachment.create({
      data: {
        rfqId: id,
        fileName: file.name,
        fileUrl,
      },
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (err) {
    console.error("[rfqs/[id]/attachments POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/rfqs/[id]/attachments
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const attachments = await prisma.rFQAttachment.findMany({ where: { rfqId: id } });
    return NextResponse.json({ attachments });
  } catch (err) {
    console.error("[rfqs/[id]/attachments GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
