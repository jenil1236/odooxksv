"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge-gray", ISSUED: "badge-blue", SENT: "badge-yellow", PAID: "badge-green", OVERDUE: "badge-red",
};

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

interface InvoiceItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  grandTotal: number;
  status: string;
  notes?: string | null;
  items: InvoiceItem[];
  purchaseOrder?: { poNumber: string } | null;
  rfq?: { title: string } | null;
  vendor: {
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string | null;
    address?: string | null;
    city?: string | null;
    gstNumber?: string | null;
  };
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUserRole(d.user?.role || ""));
    fetch(`/api/invoices/${invoiceId}`).then(r => r.json()).then(d => {
      setInvoice(d.invoice);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [invoiceId]);

  const handleMarkPaid = async () => {
    setMarkingPaid(true);
    setMsg(null);
    const res = await fetch(`/api/invoices/${invoiceId}/paid`, { method: "PATCH" });
    const data = await res.json();
    setMarkingPaid(false);
    if (res.ok) {
      setMsg({ type: "success", text: "Invoice marked as PAID." });
      setInvoice((prev) => prev ? ({ ...prev, status: "PAID" }) : null);
    } else {
      setMsg({ type: "error", text: data.error || "Failed to mark paid." });
    }
  };

  const handleEmail = async () => {
    setEmailSending(true);
    setMsg(null);
    const res = await fetch(`/api/invoices/${invoiceId}/email`, { method: "POST" });
    const data = await res.json();
    setEmailSending(false);
    if (res.ok) {
      setMsg({ type: "success", text: "Invoice emailed successfully." });
      setInvoice((prev) => prev ? ({ ...prev, status: prev.status === "ISSUED" ? "SENT" : prev.status }) : null);
    } else {
      setMsg({ type: "error", text: data.error || "Failed to send email." });
    }
  };

  const handlePrint = () => window.open(`/invoices/${invoiceId}/print`, "_blank");

  if (loading) return <div className="page-content" style={{ color: "var(--gray-400)", padding: "3rem", textAlign: "center" }}>Loading invoice...</div>;
  if (!invoice) return <div className="page-content"><div className="alert alert-error">Invoice not found.</div></div>;

  const isProcurement = userRole === "PROCUREMENT_OFFICER" || userRole === "ADMIN";
  const isOverdue = invoice.status !== "PAID" && new Date(invoice.dueDate) < new Date();
  const displayStatus = isOverdue && invoice.status !== "PAID" ? "OVERDUE" : invoice.status;

  return (
    <div className="page-content">
      {msg && (
        <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">Invoice: {invoice.invoiceNumber}</h1>
            <span className={`badge ${isOverdue ? "badge-red" : STATUS_BADGE[invoice.status] ?? "badge-gray"}`} style={{ fontSize: "0.8rem" }}>
              {displayStatus}
            </span>
          </div>
          <p className="page-desc" style={{ marginTop: "0.25rem" }}>
            PO Ref: {invoice.purchaseOrder?.poNumber} · RFQ: {invoice.rfq?.title}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button className="btn btn-outline btn-sm" onClick={handlePrint}>🖨 Print / PDF</button>
          {isProcurement && (
            <button className="btn btn-outline btn-sm" onClick={handleEmail} disabled={emailSending}>
              {emailSending ? "Sending…" : "📧 Email Invoice"}
            </button>
          )}
          {isProcurement && invoice.status !== "PAID" && (
            <button className="btn btn-primary btn-sm" style={{ background: "#16A34A" }} onClick={handleMarkPaid} disabled={markingPaid}>
              {markingPaid ? "Updating…" : "✓ Mark as Paid"}
            </button>
          )}
          <Link href="/invoices" className="btn btn-outline btn-sm">Back</Link>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Bill To */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <p style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--gray-400)", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Bill To</p>
          <p style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.25rem" }}>{invoice.vendor.companyName}</p>
          <p style={{ fontSize: "0.875rem", color: "var(--gray-600)", lineHeight: 1.6 }}>
            {invoice.vendor.contactName}<br />
            {invoice.vendor.contactEmail}
            {invoice.vendor.contactPhone && <><br />{invoice.vendor.contactPhone}</>}
            {invoice.vendor.address && <><br />{invoice.vendor.address}, {invoice.vendor.city}</>}
            {invoice.vendor.gstNumber && <><br /><strong>GSTIN:</strong> {invoice.vendor.gstNumber}</>}
          </p>
        </div>

        {/* Invoice Details */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <p style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--gray-400)", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Invoice Details</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
            {[
              ["Invoice No.", invoice.invoiceNumber],
              ["Invoice Date", new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })],
              ["Due Date", new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })],
              ["PO Number", invoice.purchaseOrder?.poNumber],
              ["RFQ Reference", invoice.rfq?.title],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px solid var(--gray-100)" }}>
                <span style={{ color: "var(--gray-500)" }}>{label}</span>
                <span style={{ fontWeight: 500, color: "var(--gray-800)", textAlign: "right", maxWidth: "60%" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header"><h3 className="card-title">Line Items</h3></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i: number) => (
                <tr key={item.id}>
                  <td style={{ color: "var(--gray-400)" }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{item.itemName}</td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>{fmt(item.unitPrice)}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Totals */}
        <div style={{ padding: "1.5rem", borderTop: "1px solid var(--gray-200)", display: "flex", justifyContent: "flex-end", background: "var(--gray-50)", borderRadius: "0 0 var(--radius-lg) var(--radius-lg)" }}>
          <div style={{ width: "320px", fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              ["Subtotal", fmt(invoice.subtotal)],
              [`CGST (${invoice.cgstPercent}%)`, fmt(invoice.cgstAmount)],
              [`SGST (${invoice.sgstPercent}%)`, fmt(invoice.sgstAmount)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--gray-500)" }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid var(--gray-300)", paddingTop: "0.75rem", marginTop: "0.25rem", fontSize: "1.1rem" }}>
              <span style={{ fontWeight: 700 }}>Grand Total</span>
              <span style={{ fontWeight: 800, color: "var(--blue-600)" }}>{fmt(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <p style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--gray-400)", marginBottom: "0.5rem" }}>Notes / Terms</p>
          <p style={{ fontSize: "0.875rem", color: "var(--gray-700)" }}>{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
