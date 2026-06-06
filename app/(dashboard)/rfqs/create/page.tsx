"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Vendor {
  id: string;
  companyName: string;
  contactEmail: string;
  status: string;
  category: { name: string } | null;
}

interface RFQItem {
  itemName: string;
  quantity: string;
  unit: string;
  description: string;
}

const UNITS = ["pcs", "kg", "litre", "box", "set", "unit", "pair", "roll", "meter", "dozen"];

export default function CreateRFQPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    deadline: "",
  });

  const [items, setItems] = useState<RFQItem[]>([
    { itemName: "", quantity: "", unit: "pcs", description: "" },
  ]);

  const fetchVendors = useCallback(async () => {
    const res = await fetch("/api/admin/vendors?status=ACTIVE");
    const data = await res.json();
    setVendors(data.vendors ?? []);
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  function addItem() {
    setItems(prev => [...prev, { itemName: "", quantity: "", unit: "pcs", description: "" }]);
  }

  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof RFQItem, value: string) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  function toggleVendor(id: string) {
    setSelectedVendorIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent, isDraft: boolean) {
    e.preventDefault();
    setError("");

    if (!form.title || !form.category || !form.deadline) {
      setError("Title, category, and deadline are required.");
      return;
    }
    if (new Date(form.deadline) <= new Date()) {
      setError("Deadline must be a future date.");
      return;
    }
    const validItems = items.filter(i => i.itemName.trim());
    if (validItems.length === 0) {
      setError("At least one item with a name is required.");
      return;
    }
    for (const item of validItems) {
      if (!item.quantity || Number(item.quantity) <= 0) {
        setError(`Quantity for "${item.itemName}" must be greater than 0.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: validItems.map(i => ({ ...i, quantity: Number(i.quantity) })),
          vendorIds: selectedVendorIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create RFQ"); return; }

      if (!isDraft && selectedVendorIds.length > 0) {
        const publishRes = await fetch(`/api/rfqs/${data.rfq.id}/publish`, { method: "POST" });
        if (!publishRes.ok) {
          router.push(`/rfqs/${data.rfq.id}`);
          return;
        }
      }
      router.push(`/rfqs/${data.rfq.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredVendors = vendors.filter(v =>
    v.companyName.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    v.contactEmail.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Create RFQ</h1>
        <p className="page-desc">Define the procurement request, add line items, and assign vendors.</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <form onSubmit={e => handleSubmit(e, true)}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem", alignItems: "start" }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Basic Info */}
            <div className="card">
              <div className="card-header"><span className="card-title">RFQ Information</span></div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Title *</label>
                  <input className="form-input" type="text" placeholder="e.g. Office Furniture Q2 2026"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Category *</label>
                    <input className="form-input" type="text" placeholder="e.g. Furniture, IT Equipment"
                      value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required />
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
                  <textarea className="form-textarea" style={{ height: 80 }} placeholder="Provide procurement details, specifications, delivery requirements…"
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Line Items</span>
                <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>+ Add Item</button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item Name *</th>
                        <th>Qty *</th>
                        <th>Unit</th>
                        <th>Description</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i}>
                          <td style={{ color: "var(--gray-400)", width: 32 }}>{i + 1}</td>
                          <td>
                            <input className="form-input" type="text" placeholder="Item name"
                              value={item.itemName} onChange={e => updateItem(i, "itemName", e.target.value)}
                              style={{ height: 34, fontSize: "0.8125rem" }} />
                          </td>
                          <td style={{ width: 80 }}>
                            <input className="form-input" type="number" placeholder="0" min="0.01" step="any"
                              value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)}
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
                            <input className="form-input" type="text" placeholder="Optional specs"
                              value={item.description} onChange={e => updateItem(i, "description", e.target.value)}
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

          {/* Right column — Vendor Assignment */}
          <div className="card" style={{ position: "sticky", top: "72px" }}>
            <div className="card-header">
              <span className="card-title">Assign Vendors</span>
              {selectedVendorIds.length > 0 && (
                <span className="badge badge-blue">{selectedVendorIds.length} selected</span>
              )}
            </div>
            <div className="card-body" style={{ padding: "1rem" }}>
              <input className="form-input" type="text" placeholder="Search vendors…"
                value={vendorSearch} onChange={e => setVendorSearch(e.target.value)}
                style={{ marginBottom: "0.75rem" }} />
              <div style={{ maxHeight: 340, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                {filteredVendors.length === 0 && (
                  <p style={{ color: "var(--gray-400)", fontSize: "0.8125rem", textAlign: "center", padding: "1rem 0" }}>
                    No active vendors found
                  </p>
                )}
                {filteredVendors.map(v => (
                  <label key={v.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.625rem",
                      borderRadius: "var(--radius)", cursor: "pointer",
                      background: selectedVendorIds.includes(v.id) ? "var(--blue-50)" : "transparent",
                      border: `1.5px solid ${selectedVendorIds.includes(v.id) ? "var(--blue-500)" : "transparent"}`,
                      transition: "all .15s",
                    }}>
                    <input type="checkbox" checked={selectedVendorIds.includes(v.id)} onChange={() => toggleVendor(v.id)}
                      style={{ accentColor: "var(--blue-600)", width: 15, height: 15 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: "0.8125rem", color: "var(--gray-800)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {v.companyName}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--gray-400)" }}>{v.category?.name ?? "Uncategorized"}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--gray-100)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button type="submit" className="btn btn-outline btn-full" disabled={submitting}>
                {submitting ? "Saving…" : "Save as Draft"}
              </button>
              <button type="button" className="btn btn-primary btn-full" disabled={submitting}
                onClick={e => handleSubmit(e as unknown as React.FormEvent, false)}>
                {submitting ? "Publishing…" : "Publish RFQ"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
