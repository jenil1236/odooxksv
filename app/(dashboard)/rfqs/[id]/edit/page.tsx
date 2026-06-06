"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface RFQItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  description: string | null;
}

interface RFQ {
  id: string;
  title: string;
  category: string;
  description: string | null;
  deadline: string;
  status: string;
  items: RFQItem[];
  invitations: { vendor: { id: string; companyName: string } }[];
}

interface Vendor {
  id: string;
  companyName: string;
  contactEmail: string;
  category: { name: string } | null;
}

const UNITS = ["pcs", "kg", "litre", "box", "set", "unit", "pair", "roll", "meter", "dozen"];

export default function EditRFQPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ title: "", category: "", description: "", deadline: "" });
  const [items, setItems] = useState<{ id?: string; itemName: string; quantity: string; unit: string; description: string }[]>([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/rfqs/${id}`).then(r => r.json()),
      fetch("/api/admin/vendors?status=ACTIVE").then(r => r.json()),
    ]).then(([rfqData, vendorData]) => {
      const r = rfqData.rfq;
      if (!r) { router.push("/rfqs"); return; }
      if (r.status !== "DRAFT") { router.push(`/rfqs/${id}`); return; }
      setRfq(r);
      setForm({
        title: r.title,
        category: r.category,
        description: r.description ?? "",
        deadline: r.deadline.split("T")[0],
      });
      setItems(r.items.map((i: RFQItem) => ({
        id: i.id,
        itemName: i.itemName,
        quantity: String(i.quantity),
        unit: i.unit,
        description: i.description ?? "",
      })));
      setSelectedVendorIds(r.invitations.map((inv: { vendor: { id: string } }) => inv.vendor.id));
      setVendors(vendorData.vendors ?? []);
    }).finally(() => setLoading(false));
  }, [id, router]);

  function addItem() {
    setItems(prev => [...prev, { itemName: "", quantity: "", unit: "pcs", description: "" }]);
  }
  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  }
  function updateItem(i: number, field: string, value: string) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }
  function toggleVendor(id: string) {
    setSelectedVendorIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const validItems = items.filter(i => i.itemName.trim());
    if (validItems.length === 0) { setError("At least one item is required."); return; }
    if (new Date(form.deadline) <= new Date()) { setError("Deadline must be a future date."); return; }

    setSubmitting(true);
    try {
      // Update RFQ
      const res = await fetch(`/api/rfqs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: validItems.map(i => ({ ...i, quantity: Number(i.quantity) })),
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }

      // Update vendor assignments
      if (selectedVendorIds.length > 0) {
        await fetch(`/api/rfqs/${id}/vendors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendorIds: selectedVendorIds }),
        });
      }

      router.push(`/rfqs/${id}`);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredVendors = vendors.filter(v =>
    v.companyName.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  if (loading) return <div className="page-content" style={{ color: "var(--gray-400)", padding: "3rem", textAlign: "center" }}>Loading…</div>;
  if (!rfq) return null;

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Edit RFQ</h1>
          <p className="page-desc">Update draft RFQ — only available while in DRAFT status.</p>
        </div>
        <Link href={`/rfqs/${id}`} className="btn btn-outline btn-sm">← Cancel</Link>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <form onSubmit={handleSave}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.5rem", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Basic Info */}
            <div className="card">
              <div className="card-header"><span className="card-title">RFQ Information</span></div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Title *</label>
                  <input className="form-input" type="text" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Category *</label>
                    <input className="form-input" type="text" value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Deadline *</label>
                    <input className="form-input" type="date"
                      min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                      value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} required />
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" style={{ height: 80 }} value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Line Items</span>
                <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>+ Add Item</button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>#</th><th>Item Name *</th><th>Qty *</th><th>Unit</th><th>Description</th><th></th></tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i}>
                          <td style={{ color: "var(--gray-400)", width: 32 }}>{i + 1}</td>
                          <td>
                            <input className="form-input" type="text" value={item.itemName}
                              onChange={e => updateItem(i, "itemName", e.target.value)}
                              style={{ height: 34, fontSize: "0.8125rem" }} />
                          </td>
                          <td style={{ width: 80 }}>
                            <input className="form-input" type="number" min="0.01" step="any" value={item.quantity}
                              onChange={e => updateItem(i, "quantity", e.target.value)}
                              style={{ height: 34, fontSize: "0.8125rem" }} />
                          </td>
                          <td style={{ width: 100 }}>
                            <select className="form-select" value={item.unit}
                              onChange={e => updateItem(i, "unit", e.target.value)}
                              style={{ height: 34, fontSize: "0.8125rem" }}>
                              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </td>
                          <td>
                            <input className="form-input" type="text" value={item.description}
                              onChange={e => updateItem(i, "description", e.target.value)}
                              style={{ height: 34, fontSize: "0.8125rem" }} />
                          </td>
                          <td style={{ width: 36 }}>
                            {items.length > 1 && (
                              <button type="button" onClick={() => removeItem(i)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", fontSize: "1.1rem" }}>×</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Vendor Assignment */}
          <div className="card" style={{ position: "sticky", top: "72px" }}>
            <div className="card-header">
              <span className="card-title">Assign Vendors</span>
              {selectedVendorIds.length > 0 && <span className="badge badge-blue">{selectedVendorIds.length} selected</span>}
            </div>
            <div className="card-body" style={{ padding: "1rem" }}>
              <input className="form-input" type="text" placeholder="Search vendors…"
                value={vendorSearch} onChange={e => setVendorSearch(e.target.value)} style={{ marginBottom: "0.75rem" }} />
              <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                {filteredVendors.map(v => (
                  <label key={v.id} style={{
                    display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.625rem",
                    borderRadius: "var(--radius)", cursor: "pointer",
                    background: selectedVendorIds.includes(v.id) ? "var(--blue-50)" : "transparent",
                    border: `1.5px solid ${selectedVendorIds.includes(v.id) ? "var(--blue-500)" : "transparent"}`,
                    transition: "all .15s",
                  }}>
                    <input type="checkbox" checked={selectedVendorIds.includes(v.id)} onChange={() => toggleVendor(v.id)}
                      style={{ accentColor: "var(--blue-600)", width: 15, height: 15 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {v.companyName}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--gray-400)" }}>{v.category?.name ?? "Uncategorized"}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--gray-100)" }}>
              <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                {submitting ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
