"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface RFQItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  description: string | null;
}

interface RFQ {
  id: string;
  title: string;
  category: string;
  description: string | null;
  deadline: string;
  status: string;
  createdBy: { firstName: string; lastName: string };
  items: RFQItem[];
  attachments: { id: string; fileName: string; fileUrl: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "badge-gray",
  PUBLISHED: "badge-blue",
  CLOSED: "badge-yellow",
  APPROVED: "badge-green",
  REJECTED: "badge-red",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function VendorRFQDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [myQuotation, setMyQuotation] = useState<{ id: string; status: string; grandTotal: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vendor/rfqs/${id}`)
      .then(r => r.json())
      .then(d => {
        setRfq(d.rfq ?? null);
        setMyQuotation(d.myQuotation ?? null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-content" style={{ textAlign: "center", padding: "3rem", color: "var(--gray-400)" }}>Loading…</div>;
  if (!rfq) return <div className="page-content"><div className="alert alert-error">RFQ not found or not assigned to you.</div></div>;

  const deadline = new Date(rfq.deadline);
  const isExpired = deadline < new Date();
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / 86400000);
  const canSubmit = rfq.status === "PUBLISHED" && !isExpired;

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <h1 className="page-title" style={{ margin: 0 }}>{rfq.title}</h1>
            <span className={`badge ${STATUS_COLORS[rfq.status]}`}>{rfq.status}</span>
          </div>
          <p className="page-desc">
            Category: <strong>{rfq.category}</strong> ·
            Deadline: <strong style={{ color: isExpired ? "#B91C1C" : daysLeft <= 3 ? "#D97706" : "inherit" }}>
              {formatDate(rfq.deadline)}
              {!isExpired && ` (${daysLeft} day${daysLeft !== 1 ? "s" : ""} left)`}
              {isExpired && " (Expired)"}
            </strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/vendor/rfqs" className="btn btn-outline btn-sm">← Back</Link>
          {canSubmit && !myQuotation && (
            <Link href={`/vendor/rfqs/${id}/quotation`} className="btn btn-primary">Submit Quotation</Link>
          )}
          {canSubmit && myQuotation && (
            <Link href={`/vendor/rfqs/${id}/quotation`} className="btn btn-outline">Edit Quotation</Link>
          )}
        </div>
      </div>

      {/* Quotation status banner */}
      {myQuotation && (
        <div className={`alert ${myQuotation.status === "SUBMITTED" ? "alert-success" : "alert-info"}`} style={{ marginBottom: "1.25rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          You have already submitted a quotation for this RFQ.
          Status: <strong>{myQuotation.status}</strong>
          {myQuotation.grandTotal > 0 && ` · Grand Total: ₹${myQuotation.grandTotal.toLocaleString("en-IN")}`}
        </div>
      )}

      {isExpired && !myQuotation && (
        <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>
          The deadline for this RFQ has passed. Quotation submission is closed.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.25rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Description */}
          {rfq.description && (
            <div className="card">
              <div className="card-header"><span className="card-title">Description</span></div>
              <div className="card-body">
                <p style={{ color: "var(--gray-600)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{rfq.description}</p>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Required Items</span>
              <span className="badge badge-gray">{rfq.items.length} item{rfq.items.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Item Name</th><th>Quantity</th><th>Unit</th><th>Description</th></tr>
                </thead>
                <tbody>
                  {rfq.items.map((item, i) => (
                    <tr key={item.id}>
                      <td style={{ color: "var(--gray-400)" }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{item.itemName}</td>
                      <td>{item.quantity}</td>
                      <td><span className="badge badge-gray">{item.unit}</span></td>
                      <td style={{ color: "var(--gray-500)" }}>{item.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Info card */}
          <div className="card">
            <div className="card-header"><span className="card-title">RFQ Info</span></div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Posted By</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{rfq.createdBy.firstName} {rfq.createdBy.lastName}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Deadline</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: isExpired ? "#B91C1C" : daysLeft <= 3 ? "#D97706" : "var(--gray-800)" }}>
                  {formatDate(rfq.deadline)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Items Required</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{rfq.items.length}</div>
              </div>
            </div>
            {canSubmit && !myQuotation && (
              <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--gray-100)" }}>
                <Link href={`/vendor/rfqs/${id}/quotation`} className="btn btn-primary btn-full">Submit Quotation</Link>
              </div>
            )}
          </div>

          {/* Attachments */}
          {rfq.attachments.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Attachments</span></div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {rfq.attachments.map(a => (
                  <a key={a.id} href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--blue-600)", fontSize: "0.875rem", textDecoration: "none" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    {a.fileName}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
