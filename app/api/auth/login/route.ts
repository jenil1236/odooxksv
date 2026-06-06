import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/password";
import { signJWT, sessionCookieOptions } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail, password } = await req.json();

    if (!rawEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const email = rawEmail.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is inactive. Contact admin." },
        { status: 403 }
      );
    }

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    const res = NextResponse.json({
      message: "Logged in",
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    res.cookies.set(sessionCookieOptions(token));
    return res;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
