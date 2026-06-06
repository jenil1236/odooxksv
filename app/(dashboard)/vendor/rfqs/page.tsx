"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface RFQ {
  id: string;
  title: string;
  category: string;
  deadline: string;
  status: string;
  items: { id: string }[];
  invitedAt: string;
  myQuotation: { status: string; grandTotal: number } | null;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "badge-gray",
  PUBLISHED: "badge-blue",
  CLOSED: "badge-yellow",
  APPROVED: "badge-green",
  REJECTED: "badge-red",
};

const QUOT_COLORS: Record<string, string> = {
  DRAFT: "badge-gray",
  SUBMITTED: "badge-blue",
  REVISED: "badge-yellow",
  SELECTED: "badge-green",
  REJECTED: "badge-red",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function getDaysLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  return days;
}

export default function VendorRFQsPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  const fetchRfqs = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filterStatus) q.append("status", filterStatus);
      const res = await fetch(`/api/vendor/rfqs?${q}`);
      const data = await res.json();
      setRfqs(data.rfqs ?? []);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchRfqs(); }, [fetchRfqs]);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Assigned RFQs</h1>
        <p className="page-desc">RFQs you have been invited to quote on.</p>
      </div>

      {/* Filter */}
      <div className="card" style={{ padding: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 200 }}>
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published (Open)</option>
            <option value="CLOSED">Closed</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>RFQ Title</th>
                <th>Category</th>
                <th>Items</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>My Quotation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--gray-400)" }}>Loading…</td></tr>
              ) : rfqs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem" }}>
                    <p style={{ color: "var(--gray-500)", fontWeight: 500 }}>No RFQs assigned to you yet.</p>
                  </td>
                </tr>
              ) : rfqs.map(rfq => {
                const daysLeft = getDaysLeft(rfq.deadline);
                const isOpen = rfq.status === "PUBLISHED" && daysLeft > 0;
                const canSubmit = isOpen && !rfq.myQuotation;

                return (
                  <tr key={rfq.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{rfq.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>
                        Invited {formatDate(rfq.invitedAt)}
                      </div>
                    </td>
                    <td><span className="badge badge-gray">{rfq.category}</span></td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{rfq.items.length}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}> item{rfq.items.length !== 1 ? "s" : ""}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.8125rem" }}>{formatDate(rfq.deadline)}</div>
                      {isOpen ? (
                        <div style={{ fontSize: "0.7rem", color: daysLeft <= 3 ? "#B91C1C" : "#16A34A", fontWeight: 600 }}>
                          {daysLeft === 1 ? "1 day left" : `${daysLeft} days left`}
                        </div>
                      ) : daysLeft <= 0 ? (
                        <div style={{ fontSize: "0.7rem", color: "var(--gray-400)" }}>Expired</div>
                      ) : null}
                    </td>
                    <td><span className={`badge ${STATUS_COLORS[rfq.status]}`}>{rfq.status}</span></td>
                    <td>
                      {rfq.myQuotation ? (
                        <div>
                          <span className={`badge ${QUOT_COLORS[rfq.myQuotation.status]}`}>{rfq.myQuotation.status}</span>
                          {rfq.myQuotation.grandTotal > 0 && (
                            <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: 2 }}>{formatCurrency(rfq.myQuotation.grandTotal)}</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link href={`/vendor/rfqs/${rfq.id}`} className="btn btn-outline btn-sm">View</Link>
                        {canSubmit && (
                          <Link href={`/vendor/rfqs/${rfq.id}/quotation`} className="btn btn-primary btn-sm">Submit Quote</Link>
                        )}
                        {rfq.myQuotation && isOpen && (
                          <Link href={`/vendor/rfqs/${rfq.id}/quotation`} className="btn btn-outline btn-sm">Edit Quote</Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
