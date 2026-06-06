import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import nodemailer from "nodemailer";

// POST /api/invoices/[id]/email
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["PROCUREMENT_OFFICER", "ADMIN"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        vendor: { select: { companyName: true, contactEmail: true, contactName: true } },
        rfq: { select: { title: true } },
        purchaseOrder: { select: { poNumber: true } },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const fmt = (n: number) =>
      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

    const itemRows = invoice.items
      .map(
        (item) =>
          `<tr style="border-bottom:1px solid #e2e8f0">
            <td style="padding:8px 12px">${item.itemName}</td>
            <td style="padding:8px 12px;text-align:center">${item.quantity} ${item.unit}</td>
            <td style="padding:8px 12px;text-align:right">${fmt(item.unitPrice)}</td>
            <td style="padding:8px 12px;text-align:right;font-weight:600">${fmt(item.total)}</td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:sans-serif;max-width:640px;margin:0 auto;color:#1e293b">
        <div style="background:#2563EB;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0;font-size:22px">VendorBridge</h1>
          <p style="color:#bfdbfe;margin:4px 0 0;font-size:14px">Tax Invoice</p>
        </div>
        <div style="background:white;border:1px solid #e2e8f0;border-top:none;padding:32px;border-radius:0 0 8px 8px">
          <div style="display:flex;justify-content:space-between;margin-bottom:24px">
            <div>
              <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Invoice No.</p>
              <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1e293b">${invoice.invoiceNumber}</p>
            </div>
            <div style="text-align:right">
              <p style="margin:0;font-size:12px;color:#64748b">Invoice Date: <strong>${new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}</strong></p>
              <p style="margin:4px 0 0;font-size:12px;color:#64748b">Due Date: <strong style="color:#dc2626">${new Date(invoice.dueDate).toLocaleDateString("en-IN")}</strong></p>
              <p style="margin:4px 0 0;font-size:12px;color:#64748b">PO Ref: <strong>${invoice.purchaseOrder.poNumber}</strong></p>
            </div>
          </div>

          <div style="background:#f8fafc;padding:16px;border-radius:6px;margin-bottom:24px">
            <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Bill To</p>
            <p style="margin:4px 0 0;font-weight:600">${invoice.vendor.companyName}</p>
            <p style="margin:2px 0;font-size:13px;color:#64748b">${invoice.vendor.contactName} · ${invoice.vendor.contactEmail}</p>
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px">
            <thead>
              <tr style="background:#f1f5f9">
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Item</th>
                <th style="padding:10px 12px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase">Qty</th>
                <th style="padding:10px 12px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase">Unit Price</th>
                <th style="padding:10px 12px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase">Total</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <div style="display:flex;justify-content:flex-end">
            <div style="width:280px">
              <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0"><span style="color:#64748b">Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
              <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0"><span style="color:#64748b">CGST (${invoice.cgstPercent}%)</span><span>${fmt(invoice.cgstAmount)}</span></div>
              <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0"><span style="color:#64748b">SGST (${invoice.sgstPercent}%)</span><span>${fmt(invoice.sgstAmount)}</span></div>
              <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;padding:8px 0;border-top:2px solid #e2e8f0;margin-top:4px"><span>Grand Total</span><span style="color:#2563EB">${fmt(invoice.grandTotal)}</span></div>
            </div>
          </div>

          <p style="font-size:12px;color:#94a3b8;margin-top:32px;text-align:center">Generated by VendorBridge · This is a system-generated invoice.</p>
        </div>
      </div>`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "VendorBridge <no-reply@vendorbridge.com>",
      to: invoice.vendor.contactEmail,
      subject: `Invoice ${invoice.invoiceNumber} — ${invoice.rfq.title}`,
      html,
    });

    // Update status to SENT
    await prisma.invoice.update({ where: { id }, data: { status: "SENT" } });

    await logActivity(session.userId, "INVOICE_SENT", `Invoice ${invoice.invoiceNumber} emailed to ${invoice.vendor.contactEmail}`);

    return NextResponse.json({ message: "Invoice emailed successfully" });
  } catch (err) {
    console.error("[invoices/[id]/email POST]", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
