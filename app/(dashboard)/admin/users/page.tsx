"use client";
import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLES = [
  { value: "PROCUREMENT_OFFICER", label: "Procurement Officer" },
  { value: "MANAGER_APPROVER", label: "Manager / Approver" },
  { value: "ADMIN", label: "Admin" },
];

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  PROCUREMENT_OFFICER: "Procurement Officer",
  MANAGER_APPROVER: "Manager / Approver",
};

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "India",
  "Germany", "France", "Singapore", "UAE", "South Africa", "Other",
];

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", phone: "", country: "", role: "PROCUREMENT_OFFICER" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create user"); return; }
      setSuccess(`User ${form.firstName} ${form.lastName} created successfully.`);
      setModalOpen(false);
      setForm({ firstName: "", lastName: "", email: "", password: "", phone: "", country: "", role: "PROCUREMENT_OFFICER" });
      fetchUsers();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title">Users</h1>
        <div className="topbar-actions">
          <button id="open-create-user" className="btn btn-primary btn-sm" onClick={() => { setError(""); setSuccess(""); setModalOpen(true); }}>
            + Add User
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="page-header">
          <p className="page-title">Organization Users</p>
          <p className="page-desc">Manage your team members and their access roles.</p>
        </div>

        {success && <div className="alert alert-success">{success}</div>}

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem" }}>Loading…</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem" }}>No users yet. Add your first team member.</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500, color: "var(--gray-800)" }}>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge role-${u.role}`}>{roleLabel[u.role] ?? u.role}</span></td>
                    <td><span className={`badge ${u.isActive ? "badge-green" : "badge-red"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                    <td style={{ color: "var(--gray-400)", fontSize: ".8125rem" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="modal-header">
          <p className="modal-title">Add Organization User</p>
          <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", fontSize: "1.25rem", lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={handleCreate} noValidate>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="cu-fname">First name</label>
                <input id="cu-fname" type="text" className="form-input" placeholder="Jane" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cu-lname">Last name</label>
                <input id="cu-lname" type="text" className="form-input" placeholder="Smith" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cu-email">Email</label>
              <input id="cu-email" type="email" className="form-input" placeholder="jane@company.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cu-password">Temporary password</label>
              <input id="cu-password" type="password" className="form-input" placeholder="Min. 8 characters" value={form.password} onChange={(e) => set("password", e.target.value)} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="cu-phone">Phone</label>
                <input id="cu-phone" type="tel" className="form-input" placeholder="+1 555 000" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cu-country">Country</label>
                <select id="cu-country" className="form-select" value={form.country} onChange={(e) => set("country", e.target.value)}>
                  <option value="">Select…</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cu-role">Role</label>
              <select id="cu-role" className="form-select" value={form.role} onChange={(e) => set("role", e.target.value)}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button id="cu-submit" type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : null}
              {submitting ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
