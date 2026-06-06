import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generatePassword } from "@/lib/password";
import { requireAuth } from "@/lib/auth";
import { sendCredentialsEmail } from "@/lib/email";
import { logActivity, createNotification } from "@/lib/activity";
import { Role, VendorStatus } from "@/generated/prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN"]);
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      companyName,
      categoryId,
      gstNumber,
      contactName,
      contactEmail,
      contactPhone,
      address,
      city,
      state,
      country,
      postalCode,
      notes,
    } = body;

    if (!companyName || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: "Company name, contact name, and email are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = contactEmail.toLowerCase().trim();

    // Check if email already in use
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const existingVendor = await prisma.vendor.findUnique({ where: { contactEmail: normalizedEmail } });
    if (existingUser || existingVendor) {
      return NextResponse.json(
        { error: "Email already in use by another user or vendor" },
        { status: 409 }
      );
    }

    // Split name for User record
    const nameParts = contactName.trim().split(/\s+/);
    const firstName = nameParts[0] || "Vendor";
    const lastName = nameParts.slice(1).join(" ") || "User";

    // Get admin's organization
    const admin = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { organizationId: true },
    });

    const plainPassword = generatePassword();
    const passwordHash = await hashPassword(plainPassword);

    // Run atomically in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email: normalizedEmail,
          passwordHash,
          phone: contactPhone ?? null,
          country: country ?? null,
          role: Role.VENDOR,
          organizationId: admin?.organizationId ?? null,
        },
      });

      const vendor = await tx.vendor.create({
        data: {
          companyName,
          gstNumber: gstNumber ?? null,
          contactName,
          contactEmail: normalizedEmail,
          contactPhone: contactPhone ?? null,
          address: address ?? null,
          city: city ?? null,
          state: state ?? null,
          country: country ?? null,
          postalCode: postalCode ?? null,
          status: VendorStatus.ACTIVE, // Default to ACTIVE as they are registered by Admin
          notes: notes ?? null,
          userId: user.id,
          organizationId: admin?.organizationId ?? null,
          categoryId: categoryId || null,
        },
      });

      return { user, vendor };
    });

    // Email credentials
    await sendCredentialsEmail(
      normalizedEmail,
      contactName,
      plainPassword
    );

    // Audit logs
    await logActivity(
      session.userId,
      "REGISTER_VENDOR",
      `Registered vendor "${companyName}" (Email: ${normalizedEmail})`
    );

    await createNotification(
      session.userId,
      "Vendor Registered",
      `Vendor "${companyName}" has been registered successfully.`
    );

    return NextResponse.json(
      { message: "Vendor registered successfully", vendor: result.vendor },
      { status: 201 }
    );
  } catch (err) {
    console.error("[admin/vendors POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId") || "";
    const status = searchParams.get("status") || "";

    // Filters
    const where: any = {};

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { gstNumber: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
        { contactPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status as VendorStatus;
    }

    // Filter by Organization context
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { organizationId: true },
    });
    if (currentUser?.organizationId) {
      where.organizationId = currentUser.organizationId;
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ vendors });
  } catch (err) {
    console.error("[admin/vendors GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
