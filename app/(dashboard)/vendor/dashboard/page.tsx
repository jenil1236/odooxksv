"use client";
import { useState, useEffect } from "react";
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

interface VendorStats {
  totalRfqs: number;
  openRfqs: number;
  submittedQuotations: number;
  pendingQuotations: number;
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

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function VendorDashboard() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [stats, setStats] = useState<VendorStats>({ totalRfqs: 0, openRfqs: 0, submittedQuotations: 0, pendingQuotations: 0 });
  const [loading, setLoading] = useState(true);
  const [vendorName, setVendorName] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/vendor/rfqs").then(r => r.json()),
      fetch("/api/vendor/quotations").then(r => r.json()),
      fetch("/api/auth/me").then(r => r.json()),
    ]).then(([rfqData, quotData, meData]) => {
      const allRfqs: RFQ[] = rfqData.rfqs ?? [];
      const quotations = quotData.quotations ?? [];

      setRfqs(allRfqs);
      setVendorName(meData.user ? `${meData.user.firstName} ${meData.user.lastName}` : "");

      setStats({
        totalRfqs: allRfqs.length,
        openRfqs: allRfqs.filter((r: RFQ) => r.status === "PUBLISHED" && new Date(r.deadline) > new Date()).length,
        submittedQuotations: quotations.filter((q: { status: string }) => q.status === "SUBMITTED" || q.status === "REVISED").length,
        pendingQuotations: allRfqs.filter((r: RFQ) => r.status === "PUBLISHED" && !r.myQuotation && new Date(r.deadline) > new Date()).length,
      });
    }).finally(() => setLoading(false));
  }, []);

  const recentRfqs = rfqs.slice(0, 5);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Welcome back{vendorName ? `, ${vendorName.split(" ")[0]}` : ""}! 👋</h1>
        <p className="page-desc">Here's an overview of your procurement activity.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>}
          label="Assigned RFQs"
          value={stats.totalRfqs}
          color="var(--blue-600)"
        />
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
          label="Open (Active)"
          value={stats.openRfqs}
          color="#16A34A"
        />
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>}
          label="Quotations Submitted"
          value={stats.submittedQuotations}
          color="#9333EA"
        />
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
          label="Pending Response"
          value={stats.pendingQuotations}
          color="#D97706"
        />
      </div>

      {/* Recent RFQs */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div className="card-header">
          <span className="card-title">Recent Assigned RFQs</span>
          <Link href="/vendor/rfqs" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--gray-400)" }}>Loading…</div>
          ) : recentRfqs.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--gray-400)", fontSize: "0.875rem" }}>
              No RFQs assigned to you yet.
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>RFQ Title</th><th>Category</th><th>Deadline</th><th>Status</th><th>My Quotation</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {recentRfqs.map(rfq => (
                  <tr key={rfq.id}>
                    <td style={{ fontWeight: 500 }}>{rfq.title}</td>
                    <td><span className="badge badge-gray">{rfq.category}</span></td>
                    <td style={{ fontSize: "0.8125rem" }}>{formatDate(rfq.deadline)}</td>
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
                        <span style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>Not submitted</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link href={`/vendor/rfqs/${rfq.id}`} className="btn btn-outline btn-sm">View</Link>
                        {rfq.status === "PUBLISHED" && !rfq.myQuotation && new Date(rfq.deadline) > new Date() && (
                          <Link href={`/vendor/rfqs/${rfq.id}/quotation`} className="btn btn-primary btn-sm">Submit Quote</Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
