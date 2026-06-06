"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RFQ {
  id: string;
  title: string;
  category: string;
  description: string | null;
  deadline: string;
  status: string;
  createdAt: string;
  createdBy: { firstName: string; lastName: string };
  items: { id: string }[];
  invitations: { vendor: { id: string; companyName: string } }[];
  _count: { quotations: number };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "badge-gray",
  PUBLISHED: "badge-blue",
  CLOSED: "badge-yellow",
  APPROVED: "badge-green",
  REJECTED: "badge-red",
};

const STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "CLOSED", "APPROVED", "REJECTED"];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function isExpired(deadline: string) {
  return new Date(deadline) < new Date();
}

export default function RFQListPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [publishing, setPublishing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUserRole(d.user?.role ?? ""));
  }, []);

  const fetchRfqs = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append("search", search);
      if (filterStatus) q.append("status", filterStatus);
      if (filterCategory) q.append("category", filterCategory);
      const res = await fetch(`/api/rfqs?${q}`);
      const data = await res.json();
      setRfqs(data.rfqs ?? []);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterCategory]);

  useEffect(() => { fetchRfqs(); }, [fetchRfqs]);

  async function handlePublish(id: string, title: string) {
    if (!confirm(`Publish RFQ "${title}"? This will notify all assigned vendors.`)) return;
    setPublishing(id);
    try {
      const res = await fetch(`/api/rfqs/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: "error", text: data.error }); return; }
      setMsg({ type: "success", text: `RFQ "${title}" published and vendors notified.` });
      fetchRfqs();
    } finally {
      setPublishing(null);
    }
  }

  const canCreate = userRole === "PROCUREMENT_OFFICER";
  const canPublish = userRole === "PROCUREMENT_OFFICER";

  return (
    <>
      <div className="page-content">
        <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 className="page-title">Requests for Quotation</h1>
            <p className="page-desc">Manage procurement RFQs, assign vendors, and track responses.</p>
          </div>
          {canCreate && (
            <Link href="/rfqs/create" className="btn btn-primary" id="create-rfq-btn">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" />
              </svg>
              Create RFQ
            </Link>
          )}
        </div>

        {msg && (
          <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: "1rem" }}>
            {msg.text}
            <button onClick={() => setMsg(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}>×</button>
          </div>
        )}

        {/* Filters */}
        <div className="card" style={{ padding: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by title…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 2, minWidth: 200 }}
            />
            <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: 1, minWidth: 140 }}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              type="text"
              className="form-input"
              placeholder="Filter by category…"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              style={{ flex: 1, minWidth: 160 }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>RFQ Title</th>
                  <th>Category</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Vendors</th>
                  <th>Quotations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--gray-400)" }}>Loading…</td></tr>
                ) : rfqs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem" }}>
                      <div style={{ color: "var(--gray-400)", marginBottom: "0.5rem" }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto", display: "block", marginBottom: 8 }}>
                          <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                        </svg>
                      </div>
                      <p style={{ color: "var(--gray-500)", fontWeight: 500 }}>No RFQs found</p>
                      {canCreate && <Link href="/rfqs/create" className="btn btn-primary btn-sm" style={{ marginTop: "0.75rem" }}>Create your first RFQ</Link>}
                    </td>
                  </tr>
                ) : rfqs.map(rfq => (
                  <tr key={rfq.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--gray-800)" }}>{rfq.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>
                        by {rfq.createdBy.firstName} {rfq.createdBy.lastName}
                      </div>
                    </td>
                    <td><span className="badge badge-gray">{rfq.category}</span></td>
                    <td>
                      <div style={{ fontSize: "0.8125rem" }}>{formatDate(rfq.deadline)}</div>
                      {isExpired(rfq.deadline) && rfq.status === "PUBLISHED" && (
                        <span style={{ fontSize: "0.7rem", color: "#B91C1C", fontWeight: 600 }}>Expired</span>
                      )}
                    </td>
                    <td><span className={`badge ${STATUS_COLORS[rfq.status] ?? "badge-gray"}`}>{rfq.status}</span></td>
                    <td>
                      {rfq.invitations.length > 0 ? (
                        <div style={{ fontSize: "0.8125rem" }}>
                          <span style={{ fontWeight: 600 }}>{rfq.invitations.length}</span> vendor{rfq.invitations.length !== 1 ? "s" : ""}
                          <div style={{ fontSize: "0.7rem", color: "var(--gray-400)" }}>
                            {rfq.invitations.slice(0, 2).map(i => i.vendor.companyName).join(", ")}
                            {rfq.invitations.length > 2 && ` +${rfq.invitations.length - 2} more`}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "var(--gray-400)", fontSize: "0.8125rem" }}>None assigned</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: "0.8125rem" }}>
                        <span style={{ fontWeight: 600 }}>{rfq._count.quotations} / {rfq.invitations.length}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}> Responded</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <Link href={`/rfqs/${rfq.id}`} className="btn btn-outline btn-sm">View</Link>
                        {rfq.status === "DRAFT" && canCreate && (
                          <Link href={`/rfqs/${rfq.id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                        )}
                        {rfq.status === "DRAFT" && canPublish && (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={publishing === rfq.id}
                            onClick={() => handlePublish(rfq.id, rfq.title)}
                          >
                            {publishing === rfq.id ? "Publishing…" : "Publish"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
