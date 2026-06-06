import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity, createNotification } from "@/lib/activity";

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}${month}-${random}`;
}

// POST /api/purchase-orders/[id]/invoice
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["PROCUREMENT_OFFICER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: poId } = await params;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: true,
        vendor: { select: { id: true, companyName: true, userId: true } },
        rfq: { select: { id: true, title: true } },
        invoice: true,
      },
    });

    if (!po) return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
    if (po.invoice) return NextResponse.json({ error: "Invoice already exists for this PO", invoiceId: po.invoice.id }, { status: 409 });
    if (po.status === "CANCELLED") return NextResponse.json({ error: "Cannot generate invoice for a cancelled PO" }, { status: 400 });

    // Calculate CGST/SGST server-side (9% each = 18% GST)
    const subtotal = po.items.reduce((sum, item) => sum + item.total, 0);
    const cgstPercent = 9;
    const sgstPercent = 9;
    const cgstAmount = (subtotal * cgstPercent) / 100;
    const sgstAmount = (subtotal * sgstPercent) / 100;
    const grandTotal = subtotal + cgstAmount + sgstAmount;

    // Due date = 30 days from today
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          purchaseOrderId: poId,
          rfqId: po.rfqId,
          vendorId: po.vendorId,
          status: "ISSUED",
          dueDate,
          subtotal,
          cgstPercent,
          sgstPercent,
          cgstAmount,
          sgstAmount,
          grandTotal,
          notes: po.notes ?? null,
          items: {
            create: po.items.map((item) => ({
              itemName: item.itemName,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
        include: { items: true },
      });

      // Mark PO as SENT
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: "SENT" },
      });

      return inv;
    });

    await logActivity(
      session.userId,
      "INVOICE_GENERATED",
      `Invoice ${invoice.invoiceNumber} generated for PO ${po.poNumber} (RFQ: ${po.rfq.title})`
    );

    if (po.vendor.userId) {
      await createNotification(
        po.vendor.userId,
        "Invoice Issued",
        `Invoice ${invoice.invoiceNumber} has been issued for PO ${po.poNumber}.`
      );
    }

    return NextResponse.json({ message: "Invoice generated", invoice }, { status: 201 });
  } catch (err) {
    console.error("[purchase-orders/[id]/invoice POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
