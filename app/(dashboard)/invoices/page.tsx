"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge-gray",
  ISSUED: "badge-blue",
  SENT: "badge-yellow",
  PAID: "badge-green",
  OVERDUE: "badge-red",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  grandTotal: number;
  status: string;
  purchaseOrder?: { poNumber: string } | null;
  rfq?: { title: string } | null;
  vendor?: { companyName: string } | null;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((d) => { setInvoices(d.invoices || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-content" style={{ color: "var(--gray-400)", padding: "3rem", textAlign: "center" }}>
      Loading invoices...
    </div>
  );

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-desc">Tax invoices generated from Purchase Orders</p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>PO Reference</th>
                <th>RFQ</th>
                <th>Vendor</th>
                <th>Invoice Date</th>
                <th>Due Date</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: "var(--gray-400)" }}>
                    No invoices found. Generate one from a Purchase Order.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isOverdue = inv.status !== "PAID" && new Date(inv.dueDate) < new Date();
                  return (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600, color: "var(--blue-600)", whiteSpace: "nowrap" }}>
                        {inv.invoiceNumber}
                      </td>
                      <td style={{ fontSize: "0.8125rem", color: "var(--gray-500)" }}>
                        {inv.purchaseOrder?.poNumber ?? "—"}
                      </td>
                      <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {inv.rfq?.title ?? "—"}
                      </td>
                      <td style={{ fontWeight: 500 }}>{inv.vendor?.companyName ?? "—"}</td>
                      <td style={{ fontSize: "0.8125rem" }}>
                        {new Date(inv.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ fontSize: "0.8125rem", color: isOverdue ? "var(--red-500)" : "inherit", fontWeight: isOverdue ? 600 : 400 }}>
                        {new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        {isOverdue && <span style={{ marginLeft: 4, fontSize: "0.7rem" }}>⚠</span>}
                      </td>
                      <td style={{ fontWeight: 700 }}>{fmt(inv.grandTotal)}</td>
                      <td>
                        <span className={`badge ${isOverdue && inv.status !== "PAID" ? "badge-red" : STATUS_BADGE[inv.status] ?? "badge-gray"}`}>
                          {isOverdue && inv.status !== "PAID" ? "OVERDUE" : inv.status}
                        </span>
                      </td>
                      <td>
                        <Link href={`/invoices/${inv.id}`} className="btn btn-outline btn-sm">View</Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
