"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => setUserRole(d.user?.role || ""));

    fetch("/api/approvals")
      .then(r => r.json())
      .then(d => {
        setApprovals(d.approvals || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return "badge-yellow";
      case "APPROVED": return "badge-green";
      case "REJECTED": return "badge-red";
      default: return "badge-gray";
    }
  };

  if (loading) return <div className="page-content" style={{ color: "var(--gray-400)", padding: "3rem", textAlign: "center" }}>Loading approvals...</div>;

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Approval Workflow</h1>
          <p className="page-desc">Manage quotation approvals for RFQs</p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>RFQ Title</th>
                <th>Selected Vendor</th>
                <th>Grand Total</th>
                <th>Requested By</th>
                <th>Requested At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvals.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--gray-400)" }}>
                    No approvals found.
                  </td>
                </tr>
              ) : (
                approvals.map(approval => (
                  <tr key={approval.id}>
                    <td style={{ fontWeight: 500, color: "var(--gray-800)" }}>{approval.rfq.title}</td>
                    <td>{approval.quotation.vendor.companyName}</td>
                    <td style={{ fontWeight: 600 }}>
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(approval.quotation.grandTotal)}
                    </td>
                    <td>{approval.requestedBy.firstName} {approval.requestedBy.lastName}</td>
                    <td>{format(new Date(approval.createdAt), "dd MMM yyyy, HH:mm")}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(approval.status)}`}>{approval.status}</span>
                    </td>
                    <td>
                      <Link href={`/approvals/${approval.rfqId}`} className="btn btn-outline btn-sm">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
