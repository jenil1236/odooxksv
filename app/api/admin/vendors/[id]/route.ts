import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { VendorStatus } from "@/generated/prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        user: { select: { id: true, isActive: true } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({ vendor });
  } catch (err) {
    console.error("[admin/vendors/[id] GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(["ADMIN"]);
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.vendor.findUnique({
      where: { id },
      select: { companyName: true, userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const {
      companyName,
      categoryId,
      gstNumber,
      contactName,
      contactPhone,
      address,
      city,
      state,
      country,
      postalCode,
      status,
      rating,
      notes,
      isActive,
    } = body;

    const updated = await prisma.$transaction(async (tx) => {
      // Update vendor details
      const v = await tx.vendor.update({
        where: { id },
        data: {
          companyName: companyName ?? undefined,
          gstNumber: gstNumber !== undefined ? gstNumber : undefined,
          contactName: contactName ?? undefined,
          contactPhone: contactPhone !== undefined ? contactPhone : undefined,
          address: address !== undefined ? address : undefined,
          city: city !== undefined ? city : undefined,
          state: state !== undefined ? state : undefined,
          country: country !== undefined ? country : undefined,
          postalCode: postalCode !== undefined ? postalCode : undefined,
          status: status !== undefined ? (status as VendorStatus) : undefined,
          rating: rating !== undefined ? Number(rating) : undefined,
          notes: notes !== undefined ? notes : undefined,
          isActive: isActive !== undefined ? isActive : undefined,
          categoryId: categoryId !== undefined ? (categoryId || null) : undefined,
        },
      });

      // Synchronize User isActive state if isActive or status changes
      if (existing.userId && (isActive !== undefined || status !== undefined)) {
        let userActive = true;
        if (isActive === false || status === VendorStatus.INACTIVE || status === VendorStatus.BLOCKED) {
          userActive = false;
        }
        await tx.user.update({
          where: { id: existing.userId },
          data: { isActive: userActive },
        });
      }

      return v;
    });

    await logActivity(
      session.userId,
      "UPDATE_VENDOR",
      `Updated vendor profile for "${existing.companyName}"`
    );

    return NextResponse.json({ message: "Vendor updated successfully", vendor: updated });
  } catch (err) {
    console.error("[admin/vendors/[id] PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(["ADMIN"]);
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.vendor.findUnique({
      where: { id },
      select: { companyName: true, userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Safely update vendor to INACTIVE/inactive instead of hard delete
    await prisma.$transaction(async (tx) => {
      await tx.vendor.update({
        where: { id },
        data: {
          isActive: false,
          status: VendorStatus.INACTIVE,
        },
      });

      if (existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { isActive: false },
        });
      }
    });

    await logActivity(
      session.userId,
      "DEACTIVATE_VENDOR",
      `Deactivated vendor "${existing.companyName}"`
    );

    return NextResponse.json({ message: "Vendor deactivated successfully" });
  } catch (err) {
    console.error("[admin/vendors/[id] DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
