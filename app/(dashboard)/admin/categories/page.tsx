"use client";
import { useState, useEffect, useCallback } from "react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  _count: { vendors: number };
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vendor-categories");
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/vendor-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create category");
        return;
      }
      setSuccess(`Category "${name}" created successfully.`);
      setName("");
      setDescription("");
      setModalOpen(false);
      fetchCategories();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-content">
        <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p className="page-title">Manage Categories</p>
            <p className="page-desc">Create and view vendor classification categories.</p>
          </div>
          <button
            id="open-create-category"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setError("");
              setSuccess("");
              setModalOpen(true);
            }}
          >
            + Add Category
          </button>
        </div>

        {success && <div className="alert alert-success">{success}</div>}

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th style={{ textAlign: "right" }}>Linked Vendors</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem" }}>
                      Loading…
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem" }}>
                      No categories defined yet. Add your first category.
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500, color: "var(--gray-800)" }}>{c.name}</td>
                      <td style={{ color: "var(--gray-500)" }}>{c.description ?? "—"}</td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "var(--gray-700)" }}>
                        {c._count?.vendors ?? 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="modal-header">
          <p className="modal-title">Create Vendor Category</p>
          <button
            onClick={() => setModalOpen(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--gray-400)",
              fontSize: "1.25rem",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleCreate} noValidate>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label" htmlFor="cat-name">
                Category Name
              </label>
              <input
                id="cat-name"
                type="text"
                className="form-input"
                placeholder="e.g. Logistics, IT Hardware"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cat-desc">
                Description <span style={{ color: "var(--gray-400)" }}>(optional)</span>
              </label>
              <textarea
                id="cat-desc"
                className="form-textarea"
                placeholder="Enter description of this category..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button id="cat-submit" type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : null}
              {submitting ? "Creating…" : "Create Category"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
