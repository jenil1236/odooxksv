"use client";
import { useState, useEffect, useCallback } from "react";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "role-ADMIN",
  PROCUREMENT_OFFICER: "role-PROCUREMENT_OFFICER",
  MANAGER_APPROVER: "role-MANAGER_APPROVER",
  VENDOR: "role-VENDOR",
};

const ACTION_ICONS: Record<string, string> = {
  INVOICE_GENERATED: "🧾",
  INVOICE_SENT: "📧",
  INVOICE_MARKED_PAID: "✅",
  INVOICE_PDF_DOWNLOADED: "📥",
  APPROVAL_REQUESTED: "🔔",
  APPROVAL_APPROVED: "✅",
  APPROVAL_REJECTED: "❌",
  PO_GENERATED: "📦",
  PO_STATUS_UPDATED: "🔄",
  WINNING_VENDOR_SELECTED: "🏆",
  COMPARISON_VIEWED: "👁",
  LOGIN: "🔐",
  LOGOUT: "🚪",
  SIGNUP: "👤",
  REGISTER_VENDOR: "🏭",
  UPDATE_VENDOR: "✏️",
  CREATE_VENDOR_CATEGORY: "🗂",
  RESET_PASSWORD: "🔑",
  QUOTATION_SUBMITTED: "📝",
  QUOTATION_REJECTED: "❌",
  RECOMMENDATION_GENERATED: "⭐",
  DEFAULT: "📋",
};

interface AuditLogUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: AuditLogUser;
}

interface UserDropdownItem {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<UserDropdownItem[]>([]);

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");

  const fetchLogs = useCallback((p = 1) => {
    Promise.resolve().then(() => {
      setLoading(true);
    });
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", "50");
    if (actionFilter) params.set("action", actionFilter);
    if (userFilter) params.set("userId", userFilter);
    if (fromFilter) params.set("from", fromFilter);
    if (toFilter) params.set("to", toFilter);

    fetch(`/api/activity-logs?${params}`)
      .then(r => r.json())
      .then(d => {
        setLogs(d.logs || []);
        setTotal(d.total || 0);
        setPage(p);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actionFilter, userFilter, fromFilter, toFilter]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // Fetch users for user filter dropdown (admin only)
  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(() => {});
  }, []);

  const handleApplyFilters = () => fetchLogs(1);
  const handleClearFilters = () => {
    setActionFilter("");
    setUserFilter("");
    setFromFilter("");
    setToFilter("");
    setTimeout(() => fetchLogs(1), 0);
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-desc">Immutable system-wide activity trail — {total} events recorded</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr auto auto", gap: "0.75rem", alignItems: "end" }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Search Action</label>
            <input
              className="form-input"
              placeholder="e.g. INVOICE, APPROVAL..."
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleApplyFilters()}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">User</label>
            <select className="form-select" value={userFilter} onChange={e => setUserFilter(e.target.value)}>
              <option value="">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">From Date</label>
            <input className="form-input" type="date" value={fromFilter} onChange={e => setFromFilter(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">To Date</label>
            <input className="form-input" type="date" value={toFilter} onChange={e => setToFilter(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ marginTop: "1.25rem" }} onClick={handleApplyFilters}>
            Filter
          </button>
          <button className="btn btn-outline" style={{ marginTop: "1.25rem" }} onClick={handleClearFilters}>
            Clear
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--gray-400)", padding: "3rem" }}>
                    Loading audit trail…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--gray-400)", padding: "3rem" }}>
                    No matching activity logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const icon = ACTION_ICONS[log.action] ?? ACTION_ICONS.DEFAULT;
                  return (
                    <tr key={log.id}>
                      <td style={{ color: "var(--gray-500)", whiteSpace: "nowrap", fontSize: "0.8125rem" }}>
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: "var(--gray-800)", fontSize: "0.875rem" }}>
                          {log.user.firstName} {log.user.lastName}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>{log.user.email}</div>
                      </td>
                      <td>
                        <span className={`badge ${ROLE_COLORS[log.user.role] ?? "badge-gray"}`} style={{ fontSize: "0.7rem" }}>
                          {log.user.role}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "1rem" }}>{icon}</span>
                          <span style={{
                            fontSize: "0.75rem", fontWeight: 600, fontFamily: "monospace",
                            background: "var(--gray-100)", color: "var(--gray-700)",
                            padding: "2px 6px", borderRadius: "4px"
                          }}>
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: "var(--gray-600)", fontSize: "0.8125rem", maxWidth: "360px", wordBreak: "break-word" }}>
                        {log.details ?? "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--gray-100)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem" }}>
            <span style={{ color: "var(--gray-500)" }}>
              Page {page} of {totalPages} · {total} total events
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1 || loading}
              >
                ← Prev
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages || loading}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
