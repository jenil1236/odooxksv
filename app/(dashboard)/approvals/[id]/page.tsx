"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

export default function ApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rfqId = params.id as string;

  const [approval, setApproval] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reject modal state
  const [showReject, setShowReject] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => setUserRole(d.user?.role || ""));

    Promise.all([
      fetch(`/api/rfqs/${rfqId}/approval`),
      fetch(`/api/rfqs/${rfqId}/approval-timeline`)
    ])
      .then(async ([res1, res2]) => {
        const d1 = await res1.json();
        const d2 = await res2.json();
        setApproval(d1.approval);
        setTimeline(d2.timeline || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [rfqId]);

  const handleApprove = async () => {
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/approvals/${approval.id}/approve`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: "Approval granted successfully." });
        setApproval(data.approval);
        fetchTimeline();
      } else {
        setMsg({ type: "error", text: data.error || "Failed to approve." });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Network error." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectRemarks.trim()) {
      setMsg({ type: "error", text: "Remarks are required for rejection." });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/approvals/${approval.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks: rejectRemarks })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: "Approval rejected successfully." });
        setApproval(data.approval);
        setShowReject(false);
        fetchTimeline();
      } else {
        setMsg({ type: "error", text: data.error || "Failed to reject." });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Network error." });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchTimeline = () => {
    fetch(`/api/rfqs/${rfqId}/approval-timeline`)
      .then(r => r.json())
      .then(d => setTimeline(d.timeline || []));
  };

  if (loading) return <div className="page-content" style={{ color: "var(--gray-400)", padding: "3rem", textAlign: "center" }}>Loading approval details...</div>;
  if (!approval) return <div className="page-content"><div className="alert alert-error">Approval record not found.</div></div>;

  const isManager = userRole === "MANAGER_APPROVER";

  return (
    <div className="page-content">
      {msg && (
        <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}>×</button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Approval Request</h1>
          <p className="page-desc">RFQ: {approval.rfq.title}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/approvals" className="btn btn-outline btn-sm">Back to Approvals</Link>
          <Link href={`/rfqs/${rfqId}`} className="btn btn-outline btn-sm">View RFQ</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Status Banner */}
          <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid " + (approval.status === "APPROVED" ? "#22C55E" : approval.status === "REJECTED" ? "#EF4444" : "#F59E0B") }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                  Status: <span style={{ color: approval.status === "APPROVED" ? "#15803D" : approval.status === "REJECTED" ? "#B91C1C" : "#B45309" }}>{approval.status}</span>
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>
                  Requested by {approval.requestedBy.firstName} {approval.requestedBy.lastName} on {format(new Date(approval.createdAt), "PPP")}
                </p>
                {approval.remarks && (
                  <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", background: "var(--red-50)", color: "#991B1B", borderRadius: "var(--radius-sm)", fontSize: "0.875rem" }}>
                    <strong>Reason for Rejection:</strong> {approval.remarks}
                  </div>
                )}
              </div>
              
              {isManager && approval.status === "PENDING" && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-danger" onClick={() => setShowReject(true)} disabled={submitting}>Reject</button>
                  <button className="btn btn-primary" style={{ background: "#16A34A" }} onClick={handleApprove} disabled={submitting}>Approve Quote</button>
                </div>
              )}
            </div>
          </div>

          {/* Quotation Details */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">Quotation Summary</h3></div>
            <div className="card-body">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--gray-100)" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--gray-400)", marginBottom: "0.25rem" }}>Vendor</div>
                  <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>{approval.quotation.vendor.companyName}</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>Rating: {approval.quotation.vendor.rating}/5.0</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--gray-400)", marginBottom: "0.25rem" }}>Grand Total</div>
                  <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--blue-600)" }}>
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(approval.quotation.grandTotal)}
                  </div>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approval.quotation.items.map((item: any) => (
                      <tr key={item.id}>
                        <td>{item.rfqItem?.itemName || "Item"}</td>
                        <td>{item.quantity} {item.rfqItem?.unit}</td>
                        <td>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(item.unitPrice)}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card" style={{ alignSelf: "start" }}>
          <div className="card-header"><h3 className="card-title">Activity Timeline</h3></div>
          <div className="card-body">
            {timeline.length === 0 ? (
              <p style={{ color: "var(--gray-400)", fontSize: "0.875rem", textAlign: "center" }}>No activity recorded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {timeline.map((event, idx) => (
                  <div key={idx} style={{ position: "relative", paddingLeft: "1.5rem" }}>
                    <div style={{ position: "absolute", left: 0, top: 4, width: 8, height: 8, borderRadius: "50%", background: event.type === "APPROVED" ? "#22C55E" : event.type === "REJECTED" ? "#EF4444" : "var(--blue-500)" }} />
                    {idx !== timeline.length - 1 && (
                      <div style={{ position: "absolute", left: 3, top: 16, bottom: -16, width: 2, background: "var(--gray-200)" }} />
                    )}
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--gray-800)" }}>{event.detail}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: "0.25rem" }}>
                      {format(new Date(event.timestamp), "MMM dd, HH:mm")} · {event.actor}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showReject && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="modal-title">Reject Approval Request</span>
              <button onClick={() => setShowReject(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "var(--gray-400)" }}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Reason for Rejection <span style={{ color: "red" }}>*</span></label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Explain why this quotation is being rejected..."
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setShowReject(false)} disabled={submitting}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleReject} disabled={submitting}>
                {submitting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
