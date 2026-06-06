import { NextResponse } from "next/server";
import { clearCookieOptions } from "@/lib/jwt";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out" });
  res.cookies.set(clearCookieOptions());
  return res;
}
