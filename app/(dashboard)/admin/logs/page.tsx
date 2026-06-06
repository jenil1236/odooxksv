"use client";
import { useState, useEffect } from "react";

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: UserInfo;
}

const actionLabels: Record<string, string> = {
  CREATE_VENDOR_CATEGORY: "Category Created",
  REGISTER_VENDOR: "Vendor Registered",
  UPDATE_VENDOR: "Vendor Profile Updated",
  DEACTIVATE_VENDOR: "Vendor Deactivated",
  SIGNUP: "Sign Up",
  LOGIN: "Login",
  LOGOUT: "Logout",
  RESET_PASSWORD: "Password Reset",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/activity-logs")
      .then((res) => res.json())
      .then((data) => setLogs(data.logs ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>


      <div className="page-content">
        <div className="page-header">
          <p className="page-title">Activity Logs</p>
          <p className="page-desc">System-wide audit trail of administrative and operational actions.</p>
        </div>

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
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem" }}>
                      Loading trail…
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem" }}>
                      No activity logged yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ color: "var(--gray-500)", whiteSpace: "nowrap", fontSize: "0.8125rem" }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: "var(--gray-800)" }}>
                          {log.user.firstName} {log.user.lastName}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>
                          {log.user.email}
                        </div>
                      </td>
                      <td>
                        <span className={`badge role-${log.user.role}`} style={{ fontSize: "0.75rem" }}>
                          {log.user.role}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: 600, fontSize: "0.75rem" }}>
                          {actionLabels[log.action] ?? log.action}
                        </span>
                      </td>
                      <td style={{ color: "var(--gray-600)", maxWidth: "320px", wordBreak: "break-word" }}>
                        {log.details ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
