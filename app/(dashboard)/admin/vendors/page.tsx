"use client";
import { useState, useEffect, useCallback } from "react";

interface Vendor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  country: string | null;
  isActive: boolean;
  createdAt: string;
}

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

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", country: "", additionalInfo: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/vendors");
    const data = await res.json();
    setVendors(data.vendors ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to register vendor"); return; }
      setSuccess(`Vendor ${form.firstName} ${form.lastName} registered. Credentials sent to ${form.email}.`);
      setModalOpen(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", country: "", additionalInfo: "" });
      fetchVendors();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title">Vendors</h1>
        <div className="topbar-actions">
          <button id="open-register-vendor" className="btn btn-primary btn-sm" onClick={() => { setError(""); setSuccess(""); setModalOpen(true); }}>
            + Register Vendor
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="page-header">
          <p className="page-title">Vendor Management</p>
          <p className="page-desc">Register vendor partners. Credentials are auto-generated and emailed.</p>
        </div>

        {success && <div className="alert alert-success">{success}</div>}

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem" }}>Loading…</td></tr>
                ) : vendors.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem" }}>No vendors yet. Register your first vendor partner.</td></tr>
                ) : vendors.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 500, color: "var(--gray-800)" }}>{v.firstName} {v.lastName}</td>
                    <td>{v.email}</td>
                    <td style={{ color: "var(--gray-500)" }}>{v.phone ?? "—"}</td>
                    <td style={{ color: "var(--gray-500)" }}>{v.country ?? "—"}</td>
                    <td><span className={`badge ${v.isActive ? "badge-green" : "badge-red"}`}>{v.isActive ? "Active" : "Inactive"}</span></td>
                    <td style={{ color: "var(--gray-400)", fontSize: ".8125rem" }}>{new Date(v.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="modal-header">
          <p className="modal-title">Register Vendor</p>
          <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", fontSize: "1.25rem", lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={handleRegister} noValidate>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 9.25a.75.75 0 011.5 0v.5a.75.75 0 01-1.5 0v-.5zM8 4.5a.875.875 0 110 1.75A.875.875 0 018 4.5zm-.75 2.75a.75.75 0 011.5 0v2.5a.75.75 0 01-1.5 0v-2.5z" /></svg>
              A secure password will be auto-generated and emailed to the vendor.
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="rv-fname">First name</label>
                <input id="rv-fname" type="text" className="form-input" placeholder="John" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="rv-lname">Last name</label>
                <input id="rv-lname" type="text" className="form-input" placeholder="Doe" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="rv-email">Email</label>
              <input id="rv-email" type="email" className="form-input" placeholder="vendor@company.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="rv-phone">Phone</label>
                <input id="rv-phone" type="tel" className="form-input" placeholder="+1 555 000" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="rv-country">Country</label>
                <select id="rv-country" className="form-select" value={form.country} onChange={(e) => set("country", e.target.value)}>
                  <option value="">Select…</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="rv-info">Additional information <span style={{ color: "var(--gray-400)" }}>(optional)</span></label>
              <textarea id="rv-info" className="form-textarea" placeholder="Vendor specialization, notes…" value={form.additionalInfo} onChange={(e) => set("additionalInfo", e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button id="rv-submit" type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : null}
              {submitting ? "Registering…" : "Register & send credentials"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
