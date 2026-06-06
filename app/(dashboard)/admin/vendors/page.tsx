"use client";
import { useState, useEffect, useCallback } from "react";

interface Category {
  id: string;
  name: string;
}

interface Vendor {
  id: string;
  companyName: string;
  gstNumber: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  status: string;
  rating: number;
  isActive: boolean;
  notes: string | null;
  categoryId: string | null;
  category: { id: string; name: string } | null;
}

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "India",
  "Germany", "France", "Singapore", "UAE", "South Africa", "Other",
];

const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "INACTIVE", label: "Inactive" },
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Filter State
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modals
  const [registerOpen, setRegisterOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Form State
  const [form, setForm] = useState({
    companyName: "",
    categoryId: "",
    gstNumber: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    id: "",
    companyName: "",
    categoryId: "",
    gstNumber: "",
    contactName: "",
    contactPhone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    status: "ACTIVE",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/vendor-categories");
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (filterCategory) query.append("categoryId", filterCategory);
      if (filterStatus) query.append("status", filterStatus);

      const res = await fetch(`/api/admin/vendors?${query.toString()}`);
      const data = await res.json();
      setVendors(data.vendors ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, filterStatus]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  function handleOpenDetails(v: Vendor) {
    setSelectedVendor(v);
    setEditForm({
      id: v.id,
      companyName: v.companyName,
      categoryId: v.categoryId ?? "",
      gstNumber: v.gstNumber ?? "",
      contactName: v.contactName,
      contactPhone: v.contactPhone ?? "",
      address: v.address ?? "",
      city: v.city ?? "",
      state: v.state ?? "",
      country: v.country ?? "",
      postalCode: v.postalCode ?? "",
      status: v.status,
      notes: v.notes ?? "",
    });
    setDetailsOpen(true);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.companyName || !form.contactName || !form.contactEmail) {
      setError("Please fill out all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to register vendor");
        return;
      }
      setSuccess(`Vendor "${form.companyName}" registered. Credentials sent to ${form.contactEmail}.`);
      setRegisterOpen(false);
      setForm({
        companyName: "",
        categoryId: "",
        gstNumber: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        notes: "",
      });
      fetchVendors();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/vendors/${editForm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update vendor");
        return;
      }
      setSuccess(`Vendor "${editForm.companyName}" profile updated.`);
      setDetailsOpen(false);
      fetchVendors();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Are you sure you want to deactivate this vendor?")) return;
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccess("Vendor deactivated successfully.");
        setDetailsOpen(false);
        fetchVendors();
      } else {
        const data = await res.json();
        setError(data.error ?? "Deactivation failed.");
      }
    } catch {
      setError("Network error.");
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "ACTIVE":
        return "badge-green";
      case "PENDING":
        return "badge-yellow";
      case "BLOCKED":
        return "badge-red";
      default:
        return "badge-gray";
    }
  }

  return (
    <>
      <div className="page-content">
        <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p className="page-title">Vendor Master Data</p>
            <p className="page-desc">Add, search, filter and configure partner profiles.</p>
          </div>
          <button
            id="open-register-vendor"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setError("");
              setSuccess("");
              setRegisterOpen(true);
            }}
          >
            + Register Vendor
          </button>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Filters bar */}
        <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
          <div className="form-row" style={{ gap: "1rem", margin: 0 }}>
            <div className="form-group" style={{ flex: 2, margin: 0 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by company name, GST, email or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <select
                className="form-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Category</th>
                  <th>GST Number</th>
                  <th>Contact Person</th>
                  <th>Email / Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem" }}>
                      Loading vendors…
                    </td>
                  </tr>
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem" }}>
                      No vendors match the criteria.
                    </td>
                  </tr>
                ) : (
                  vendors.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--gray-800)" }}>{v.companyName}</div>
                        {v.notes && (
                          <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {v.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-gray">{v.category?.name ?? "Unassigned"}</span>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "var(--gray-700)" }}>
                        {v.gstNumber ?? "—"}
                      </td>
                      <td>{v.contactName}</td>
                      <td>
                        <div>{v.contactEmail}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>{v.contactPhone ?? "—"}</div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusClass(v.status)}`}>{v.status}</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => handleOpenDetails(v)}
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Register Vendor Modal */}
      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)}>
        <div className="modal-header">
          <p className="modal-title">Register New Vendor Partner</p>
          <button onClick={() => setRegisterOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", fontSize: "1.25rem" }}>×</button>
        </div>
        <form onSubmit={handleRegister}>
          <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
              Vendor login account will be generated automatically and credentials sent to their email.
            </div>
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Acme Corp"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">Select Category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="22AAAAA0000A1Z5"
                  value={form.gstNumber}
                  onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contact Person Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="john@acme.com"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+1 555-0000"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <select
                  className="form-select"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                >
                  <option value="">Select country…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="123 Industrial Area"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Postal Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-textarea"
                placeholder="Details about services/specializations..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setRegisterOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Registering…" : "Register Vendor"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details / Edit Modal */}
      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)}>
        <div className="modal-header">
          <p className="modal-title">Vendor Details & Edit Profile</p>
          <button onClick={() => setDetailsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", fontSize: "1.25rem" }}>×</button>
        </div>
        <form onSubmit={handleUpdate}>
          <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-input"
                value={editForm.companyName}
                onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={editForm.categoryId}
                  onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                >
                  <option value="">Select Category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.gstNumber}
                  onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contact Person Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.contactName}
                  onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editForm.contactPhone}
                  onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <select
                  className="form-select"
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                >
                  <option value="">Select country…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-input"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.state}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Postal Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.postalCode}
                  onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-red"
              style={{ marginRight: "auto" }}
              onClick={() => handleDeactivate(editForm.id)}
            >
              Deactivate Vendor
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setDetailsOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
