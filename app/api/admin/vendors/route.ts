import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generatePassword } from "@/lib/password";
import { requireAuth } from "@/lib/auth";
import { sendCredentialsEmail } from "@/lib/email";
import { Role } from "@/generated/prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN"]);
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { firstName, lastName, email, phone, country, additionalInfo } =
      await req.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const plainPassword = generatePassword();
    const passwordHash = await hashPassword(plainPassword);

    const vendor = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        phone: phone ?? null,
        country: country ?? null,
        additionalInfo: additionalInfo ?? null,
        role: Role.VENDOR,
        organizationId: null,
      },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    });

    await sendCredentialsEmail(
      email,
      `${firstName} ${lastName}`,
      plainPassword
    );

    return NextResponse.json(
      { message: "Vendor registered and credentials emailed", vendor },
      { status: 201 }
    );
  } catch (err) {
    console.error("[admin/vendors POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await requireAuth(["ADMIN"]);
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const vendors = await prisma.user.findMany({
      where: { role: Role.VENDOR },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        country: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ vendors });
  } catch (err) {
    console.error("[admin/vendors GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
