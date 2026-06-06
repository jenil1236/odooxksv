import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generatePassword } from "@/lib/password";
import { sendForgotPasswordEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Return success regardless to prevent user enumeration
    if (!user) {
      return NextResponse.json({ message: "If the email exists, a new password has been sent." });
    }

    const newPassword = generatePassword();
    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await sendForgotPasswordEmail(
      user.email,
      `${user.firstName} ${user.lastName}`,
      newPassword
    );

    return NextResponse.json({ message: "If the email exists, a new password has been sent." });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
