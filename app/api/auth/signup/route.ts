import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signJWT, sessionCookieOptions } from "@/lib/jwt";
import { Role } from "@/generated/prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      country,
      additionalInfo,
      organizationName,
      organizationDetails,
    } = body;

    if (!firstName || !lastName || !email || !password || !organizationName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if any org users exist — first signup becomes ADMIN
    const userCount = await prisma.user.count({
      where: { role: { not: Role.VENDOR } },
    });

    if (userCount > 0) {
      return NextResponse.json(
        { error: "Organization sign-up is closed. Contact your admin." },
        { status: 403 }
      );
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create org + first admin atomically
    const org = await prisma.organization.create({
      data: { name: organizationName, details: organizationDetails ?? null },
    });

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        phone: phone ?? null,
        country: country ?? null,
        additionalInfo: additionalInfo ?? null,
        role: Role.ADMIN,
        organizationId: org.id,
      },
    });

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    const res = NextResponse.json(
      { message: "Account created", role: user.role },
      { status: 201 }
    );
    res.cookies.set(sessionCookieOptions(token));
    return res;
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
