"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface RFQItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  description: string | null;
}

interface RFQAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

interface Quotation {
  id: string;
  status: string;
  grandTotal: number;
  submittedAt: string | null;
  vendor: { id: string; companyName: string };
}

interface RFQ {
  id: string;
  title: string;
  category: string;
  description: string | null;
  deadline: string;
  status: string;
  createdAt: string;
  createdBy: { firstName: string; lastName: string; email: string };
  items: RFQItem[];
  invitations: { vendor: { id: string; companyName: string; contactEmail: string } }[];
  attachments: RFQAttachment[];
  _count: { quotations: number };
  quotations: Quotation[];
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
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

export default function RFQDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userRole, setUserRole] = useState("");
  const [uploading, setUploading] = useState(false);
  const [approval, setApproval] = useState<any>(null);
  const [requestingApproval, setRequestingApproval] = useState(false);
  const [generatingPo, setGeneratingPo] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUserRole(d.user?.role ?? ""));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/rfqs/${id}`).then(r => r.json()),
      fetch(`/api/rfqs/${id}/approval`).then(r => r.json())
    ])
      .then(([rfqData, approvalData]) => {
        setRfq(rfqData.rfq ?? null);
        setApproval(approvalData.approval ?? null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handlePublish() {
    if (!rfq) return;
    if (!confirm(`Publish RFQ "${rfq.title}"? Vendors will be notified.`)) return;
    setPublishing(true);
    const res = await fetch(`/api/rfqs/${id}/publish`, { method: "POST" });
    const data = await res.json();
    setPublishing(false);
    if (!res.ok) { setMsg({ type: "error", text: data.error }); return; }
    setMsg({ type: "success", text: "RFQ published! Vendors have been notified." });
    setRfq(r => r ? { ...r, status: "PUBLISHED" } : r);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !rfq) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/rfqs/${id}/attachments`, { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) {
      setRfq(r => r ? { ...r, attachments: [...r.attachments, data.attachment] } : r);
    }
  }

  async function handleRequestApproval() {
    setMsg(null);
    setRequestingApproval(true);
    const res = await fetch(`/api/rfqs/${id}/approval-request`, { method: "POST" });
    const data = await res.json();
    setRequestingApproval(false);
    if (res.ok) {
      setMsg({ type: "success", text: "Approval requested successfully." });
      setApproval(data.approval);
    } else {
      setMsg({ type: "error", text: data.error || "Failed to request approval." });
    }
  }

  async function handleGeneratePO() {
    setMsg(null);
    setGeneratingPo(true);
    const res = await fetch(`/api/rfqs/${id}/purchase-order`, { method: "POST" });
    const data = await res.json();
    setGeneratingPo(false);
    if (res.ok) {
      setMsg({ type: "success", text: `PO Generated: ${data.purchaseOrder.poNumber}` });
      router.push(`/purchase-orders/${data.purchaseOrder.id}`);
    } else {
      setMsg({ type: "error", text: data.error || "Failed to generate PO." });
    }
  }

  if (loading) return <div className="page-content" style={{ color: "var(--gray-400)", padding: "3rem", textAlign: "center" }}>Loading…</div>;
  if (!rfq) return <div className="page-content"><div className="alert alert-error">RFQ not found.</div></div>;

  const isProcurement = userRole === "PROCUREMENT_OFFICER";
  const deadline = new Date(rfq.deadline);
  const isExpired = deadline < new Date();

  return (
    <div className="page-content">
      {msg && (
        <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: "1rem" }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <h1 className="page-title" style={{ margin: 0 }}>{rfq.title}</h1>
            <span className={`badge ${STATUS_COLORS[rfq.status]}`}>{rfq.status}</span>
          </div>
          <p className="page-desc">
            Category: <strong>{rfq.category}</strong> · Deadline: <strong style={{ color: isExpired ? "#B91C1C" : "inherit" }}>{formatDate(rfq.deadline)}</strong>
            {isExpired && " (Expired)"} · Created by {rfq.createdBy.firstName} {rfq.createdBy.lastName}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
          <Link href="/rfqs" className="btn btn-outline btn-sm">← Back</Link>
          {rfq.status === "DRAFT" && isProcurement && (
            <>
              <Link href={`/rfqs/${id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
              <button className="btn btn-primary btn-sm" onClick={handlePublish} disabled={publishing}>
                {publishing ? "Publishing…" : "Publish RFQ"}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

        {/* Description */}
        {rfq.description && (
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="card-header"><span className="card-title">Description</span></div>
            <div className="card-body">
              <p style={{ color: "var(--gray-600)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{rfq.description}</p>
            </div>
          </div>
        )}

        {/* Line Items */}
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <span className="card-title">Line Items</span>
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
                    <td>{item.unit}</td>
                    <td style={{ color: "var(--gray-500)" }}>{item.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assigned Vendors */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Assigned Vendors</span>
            <span className="badge badge-blue">{rfq.invitations.length}</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {rfq.invitations.length === 0 ? (
              <p style={{ padding: "1.5rem", color: "var(--gray-400)", textAlign: "center", fontSize: "0.875rem" }}>
                No vendors assigned yet.
              </p>
            ) : (
              <div>
                {rfq.invitations.map((inv) => (
                  <div key={inv.vendor.id} style={{
                    padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--gray-100)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{inv.vendor.companyName}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>{inv.vendor.contactEmail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Attachments */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Attachments</span>
            {rfq.status === "DRAFT" && isProcurement && (
              <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
                {uploading ? "Uploading…" : "+ Upload"}
                <input type="file" style={{ display: "none" }} onChange={handleUpload} />
              </label>
            )}
          </div>
          <div className="card-body">
            {rfq.attachments.length === 0 ? (
              <p style={{ color: "var(--gray-400)", fontSize: "0.875rem", textAlign: "center" }}>No attachments.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
            )}
          </div>
        </div>

        {/* Approval Workflow (Shows if RFQ is closed) */}
        {rfq.status === "CLOSED" && (
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="card-header"><span className="card-title">Approval & PO Workflow</span></div>
            <div className="card-body">
              {!approval ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ fontWeight: 600, color: "var(--gray-900)" }}>A quotation has been selected.</h4>
                    <p style={{ fontSize: "0.875rem", color: "var(--gray-500)", marginTop: "0.25rem" }}>
                      An approval request must be sent to the Manager before a Purchase Order can be generated.
                    </p>
                  </div>
                  {isProcurement && (
                    <button className="btn btn-primary" onClick={handleRequestApproval} disabled={requestingApproval}>
                      {requestingApproval ? "Requesting…" : "Request Manager Approval"}
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "var(--gray-50)", borderRadius: "var(--radius)", border: "1px solid var(--gray-200)" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--gray-500)", marginBottom: "0.25rem" }}>Approval Status</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span className={`badge ${approval.status === "APPROVED" ? "badge-green" : approval.status === "REJECTED" ? "badge-red" : "badge-yellow"}`}>
                        {approval.status}
                      </span>
                      {approval.status === "REJECTED" && (
                        <span style={{ fontSize: "0.875rem", color: "var(--red-500)", fontWeight: 500 }}>
                          Reason: {approval.remarks}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {approval.status === "APPROVED" && isProcurement && (
                    <button className="btn btn-primary" onClick={handleGeneratePO} disabled={generatingPo}>
                      {generatingPo ? "Generating PO…" : "Generate Purchase Order"}
                    </button>
                  )}
                  {approval.status === "REJECTED" && isProcurement && (
                    <button className="btn btn-outline" onClick={handleRequestApproval} disabled={requestingApproval}>
                      Request Approval Again
                    </button>
                  )}
                  {approval.status === "PENDING" && (
                     <Link href={`/approvals/${rfq.id}`} className="btn btn-outline btn-sm">View Approval Request</Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Received Quotations */}
        {(userRole === "PROCUREMENT_OFFICER" || userRole === "ADMIN" || userRole === "MANAGER_APPROVER") && (
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="card-title">Received Quotations</span>
                <span className="badge badge-green">{rfq._count.quotations} received</span>
              </div>
              {rfq._count.quotations > 0 && (
                <Link href={`/rfqs/${id}/comparison`} className="btn btn-primary btn-sm">
                  Compare Quotations
                </Link>
              )}
            </div>
            <div className="table-wrap">
              {rfq.quotations.length === 0 ? (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--gray-400)", fontSize: "0.875rem" }}>
                  No quotations received yet.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr><th>Vendor</th><th>Submitted</th><th>Status</th><th>Grand Total</th></tr>
                  </thead>
                  <tbody>
                    {rfq.quotations.map(q => (
                      <tr key={q.id}>
                        <td style={{ fontWeight: 500 }}>{q.vendor.companyName}</td>
                        <td>{q.submittedAt ? formatDate(q.submittedAt) : "—"}</td>
                        <td><span className={`badge ${QUOT_COLORS[q.status] ?? "badge-gray"}`}>{q.status}</span></td>
                        <td style={{ fontWeight: 600 }}>{q.grandTotal > 0 ? formatCurrency(q.grandTotal) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
