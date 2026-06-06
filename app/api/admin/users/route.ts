import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { requireAuth } from "@/lib/auth";
import { sendOrgUserCredentialsEmail } from "@/lib/email";
import { Role } from "@/generated/prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN"]);
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { firstName, lastName, email, password, phone, country, role } =
      await req.json();

    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const allowedRoles: Role[] = [
      Role.ADMIN,
      Role.PROCUREMENT_OFFICER,
      Role.MANAGER_APPROVER,
    ];
    if (!allowedRoles.includes(role as Role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    // Org user shares the same organization as the admin
    const admin = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { organizationId: true },
    });

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: normalizedEmail,
        passwordHash,
        phone: phone ?? null,
        country: country ?? null,
        role: role as Role,
        organizationId: admin?.organizationId ?? null,
      },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    });

    // Email credentials to the newly created user
    await sendOrgUserCredentialsEmail(
      normalizedEmail,
      `${firstName} ${lastName}`,
      password
    );

    return NextResponse.json({ message: "User created", user }, { status: 201 });
  } catch (err) {
    console.error("[admin/users POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await requireAuth(["ADMIN"]);
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { organizationId: true },
    });

    const users = await prisma.user.findMany({
      where: {
        organizationId: admin?.organizationId ?? undefined,
        role: { not: Role.VENDOR },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("[admin/users GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
