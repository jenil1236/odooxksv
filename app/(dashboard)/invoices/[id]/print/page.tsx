"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

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

export default function InvoicePrintPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}/pdf`)
      .then(r => r.json())
      .then(d => { setInvoice(d.invoice); setLoading(false); })
      .catch(() => setLoading(false));
  }, [invoiceId]);

  useEffect(() => {
    if (!loading && invoice) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, invoice]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif", color: "#64748b" }}>
      Preparing invoice…
    </div>
  );
  if (!invoice) return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", color: "red" }}>Invoice not found.</div>
  );

  const isOverdue = invoice.status !== "PAID" && new Date(invoice.dueDate) < new Date();

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          @page { margin: 1.5cm; }
        }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: white; color: #1e293b; }
      `}</style>

      {/* Print button — hidden when printing */}
      <div className="no-print" style={{ position: "fixed", top: 16, right: 16, display: "flex", gap: 8, zIndex: 999 }}>
        <button
          onClick={() => window.print()}
          style={{ background: "#2563EB", color: "white", border: "none", padding: "8px 18px", borderRadius: 6, fontSize: 14, cursor: "pointer", fontWeight: 600 }}
        >
          🖨 Print / Save PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: 6, fontSize: 14, cursor: "pointer" }}
        >
          ✕ Close
        </button>
      </div>

      {/* Invoice Document */}
      <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1.5rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "2px solid #2563EB" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><path d="M8 16L14 22L24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "#1e293b" }}>VendorBridge</span>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Procurement & Vendor Management</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#2563EB", margin: 0 }}>TAX INVOICE</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: "4px 0 0" }}>{invoice.invoiceNumber}</p>
            <div style={{
              display: "inline-block", marginTop: 6, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
              background: invoice.status === "PAID" ? "#f0fdf4" : isOverdue ? "#fef2f2" : invoice.status === "SENT" ? "#fefce8" : "#eff6ff",
              color: invoice.status === "PAID" ? "#15803d" : isOverdue ? "#b91c1c" : invoice.status === "SENT" ? "#92400e" : "#1d4ed8",
            }}>
              {isOverdue && invoice.status !== "PAID" ? "OVERDUE" : invoice.status}
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          <div>
            <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Bill To</p>
            <p style={{ fontWeight: 700, margin: "0 0 2px" }}>{invoice.vendor.companyName}</p>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 2px" }}>{invoice.vendor.contactName}</p>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 2px" }}>{invoice.vendor.contactEmail}</p>
            {invoice.vendor.gstNumber && <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>GSTIN: {invoice.vendor.gstNumber}</p>}
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Invoice Details</p>
            <p style={{ fontSize: 13, margin: "0 0 2px" }}><strong>Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
            <p style={{ fontSize: 13, margin: "0 0 2px", color: isOverdue ? "#b91c1c" : "inherit" }}><strong>Due:</strong> {new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>References</p>
            <p style={{ fontSize: 13, margin: "0 0 2px" }}><strong>PO:</strong> {invoice.purchaseOrder?.poNumber}</p>
            <p style={{ fontSize: 13, margin: "0 0 2px", wordBreak: "break-word" }}><strong>RFQ:</strong> {invoice.rfq?.title}</p>
          </div>
        </div>

        {/* Line Items */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: "1.5rem" }}>
          <thead>
            <tr style={{ background: "#1e293b" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "white", fontWeight: 600 }}>#</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: "white", fontWeight: 600 }}>Description</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: "white", fontWeight: 600 }}>Qty / Unit</th>
              <th style={{ padding: "10px 12px", textAlign: "right", color: "white", fontWeight: 600 }}>Unit Price</th>
              <th style={{ padding: "10px 12px", textAlign: "right", color: "white", fontWeight: 600 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i: number) => (
              <tr key={item.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{i + 1}</td>
                <td style={{ padding: "10px 12px", fontWeight: 500 }}>{item.itemName}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", color: "#64748b" }}>{item.quantity} {item.unit}</td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>{fmt(item.unitPrice)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "2rem" }}>
          <div style={{ width: 300 }}>
            {[
              ["Subtotal", fmt(invoice.subtotal)],
              [`CGST @ ${invoice.cgstPercent}%`, fmt(invoice.cgstAmount)],
              [`SGST @ ${invoice.sgstPercent}%`, fmt(invoice.sgstAmount)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>{label}</span>
                <span>{value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 16, fontWeight: 800, borderTop: "2px solid #1e293b", marginTop: 4 }}>
              <span>Grand Total</span>
              <span style={{ color: "#2563EB" }}>{fmt(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
            <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Notes / Payment Terms</p>
            <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
          This is a system-generated invoice from VendorBridge. Thank you for your business.
        </div>
      </div>
    </>
  );
}
