"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface RFQ {
  id: string;
  title: string;
  category: string;
  deadline: string;
  status: string;
}

interface QuotationItem {
  id: string;
  rfqItemId: string;
  unitPrice: number;
  quantity: number;
  deliveryDays: number;
  total: number;
}

interface Quotation {
  id: string;
  rfqId: string;
  status: string;
  notes: string | null;
  paymentTerms: string | null;
  subtotal: number;
  gstPercent: number;
  grandTotal: number;
  submittedAt: string | null;
  updatedAt: string;
  rfq: RFQ;
  items: QuotationItem[];
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "badge-gray",
  SUBMITTED: "badge-blue",
  REVISED: "badge-yellow",
  SELECTED: "badge-green",
  REJECTED: "badge-red",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

export default function VendorQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/vendor/quotations")
      .then(r => r.json())
      .then(d => {
        setQuotations(d.quotations ?? []);
      })
      .catch(err => console.error("Error fetching quotations", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = q.rfq.title.toLowerCase().includes(search.toLowerCase()) || 
                          q.rfq.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">My Quotations</h1>
          <p className="page-desc">Track and manage your draft and submitted quotations.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-body" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem" }}>
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: "0.25rem", background: "var(--gray-100)", padding: 4, borderRadius: "var(--radius-lg)" }}>
            {["ALL", "DRAFT", "SUBMITTED", "SELECTED", "REJECTED"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  border: "none",
                  background: statusFilter === status ? "white" : "transparent",
                  color: statusFilter === status ? "var(--blue-600)" : "var(--gray-500)",
                  fontWeight: statusFilter === status ? 600 : 500,
                  fontSize: "0.8125rem",
                  padding: "6px 12px",
                  borderRadius: "var(--radius)",
                  cursor: "pointer",
                  transition: "all 0.12s",
                  boxShadow: statusFilter === status ? "var(--shadow-sm)" : "none",
                }}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: "relative", minWidth: 260 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by RFQ title or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: "2rem" }}
            />
            <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--gray-400)" }}>Loading…</div>
          ) : filteredQuotations.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--gray-400)", fontSize: "0.875rem" }}>
              No quotations found matching your criteria.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>RFQ / Category</th>
                  <th>Submission Date</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Grand Total (incl. GST)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map(q => {
                  const isExpired = new Date(q.rfq.deadline) < new Date();
                  const canEdit = !isExpired && (q.status === "DRAFT" || q.status === "SUBMITTED" || q.status === "REVISED");

                  return (
                    <tr key={q.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--gray-900)" }}>{q.rfq.title}</div>
                          <span className="badge badge-gray" style={{ marginTop: 4 }}>{q.rfq.category}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: "0.8125rem" }}>{formatDate(q.submittedAt)}</td>
                      <td style={{ fontSize: "0.8125rem" }}>
                        <span style={{ color: isExpired ? "var(--red-500)" : "var(--gray-700)", fontWeight: isExpired ? 500 : 400 }}>
                          {formatDate(q.rfq.deadline)}
                          {isExpired && <span style={{ marginLeft: 4, fontSize: "0.75rem" }}>(Passed)</span>}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${STATUS_COLORS[q.status]}`}>{q.status}</span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "var(--gray-900)" }}>
                        {formatCurrency(q.grandTotal)}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <Link href={`/vendor/rfqs/${q.rfqId}`} className="btn btn-outline btn-sm">
                            View RFQ
                          </Link>
                          {canEdit ? (
                            <Link href={`/vendor/rfqs/${q.rfqId}/quotation`} className="btn btn-primary btn-sm">
                              Edit Quote
                            </Link>
                          ) : (
                            <Link href={`/vendor/rfqs/${q.rfqId}/quotation`} className="btn btn-outline btn-sm">
                              View Quote
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
