"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface RFQItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  description: string | null;
}

interface QuotationItemState {
  rfqItemId: string;
  itemName: string;
  rfqQuantity: number;
  unit: string;
  unitPrice: string;
  quantity: string;
  deliveryDays: string;
}

export default function QuotationFormPage() {
  const params = useParams();
  const router = useRouter();
  const rfqId = params.id as string;

  const [rfqTitle, setRfqTitle] = useState("");
  const [rfqDeadline, setRfqDeadline] = useState("");
  const [items, setItems] = useState<QuotationItemState[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [gstPercent, setGstPercent] = useState("18");

  useEffect(() => {
    fetch(`/api/vendor/rfqs/${rfqId}`)
      .then(r => r.json())
      .then(d => {
        if (!d.rfq) { router.push("/vendor/rfqs"); return; }
        setRfqTitle(d.rfq.title);
        setRfqDeadline(d.rfq.deadline);
        setItems(d.rfq.items.map((item: RFQItem) => ({
          rfqItemId: item.id,
          itemName: item.itemName,
          rfqQuantity: item.quantity,
          unit: item.unit,
          unitPrice: d.myQuotation?.items?.find((qi: { rfqItemId: string; unitPrice: number }) => qi.rfqItemId === item.id)?.unitPrice?.toString() ?? "",
          quantity: String(item.quantity),
          deliveryDays: d.myQuotation?.items?.find((qi: { rfqItemId: string; deliveryDays: number }) => qi.rfqItemId === item.id)?.deliveryDays?.toString() ?? "0",
        })));
        if (d.myQuotation) {
          setNotes(d.myQuotation.notes ?? "");
          setPaymentTerms(d.myQuotation.paymentTerms ?? "");
          setGstPercent(String(d.myQuotation.gstPercent ?? 18));
        }
      })
      .finally(() => setLoading(false));
  }, [rfqId, router]);

  function updateItem(i: number, field: keyof QuotationItemState, value: string) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.unitPrice) || 0;
    const qty = parseFloat(item.quantity) || 0;
    return sum + price * qty;
  }, 0);
  const gst = parseFloat(gstPercent) || 0;
  const grandTotal = subtotal + (subtotal * gst) / 100;

  function formatCurrency(n: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
  }

  async function handleSubmit(isDraft: boolean) {
    setError("");

    for (const item of items) {
      if (parseFloat(item.unitPrice) <= 0 || isNaN(parseFloat(item.unitPrice))) {
        setError(`Please enter a valid unit price for "${item.itemName}"`);
        return;
      }
      if (parseInt(item.deliveryDays) < 0) {
        setError(`Delivery days cannot be negative for "${item.itemName}"`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/vendor/rfqs/${rfqId}/quotation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          paymentTerms,
          gstPercent: gst,
          isDraft,
          items: items.map(item => ({
            rfqItemId: item.rfqItemId,
            unitPrice: parseFloat(item.unitPrice),
            quantity: parseFloat(item.quantity),
            deliveryDays: parseInt(item.deliveryDays) || 0,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to submit quotation"); return; }
      router.push("/vendor/quotations");
    } finally {
      setSubmitting(false);
    }
  }

  const isExpired = rfqDeadline && new Date(rfqDeadline) < new Date();

  if (loading) return <div className="page-content" style={{ textAlign: "center", padding: "3rem", color: "var(--gray-400)" }}>Loading…</div>;

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Submit Quotation</h1>
          <p className="page-desc">For RFQ: <strong>{rfqTitle}</strong></p>
        </div>
        <Link href={`/vendor/rfqs/${rfqId}`} className="btn btn-outline btn-sm">← Back to RFQ</Link>
      </div>

      {isExpired && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          This RFQ deadline has passed. Submissions are no longer accepted.
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Items Pricing Table */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Price Your Items</span>
              <span className="badge badge-gray">{items.length} item{items.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item Name</th>
                    <th>RFQ Qty</th>
                    <th>Unit</th>
                    <th>Unit Price (₹) *</th>
                    <th>Delivery Days</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const lineTotal = (parseFloat(item.unitPrice) || 0) * (parseFloat(item.quantity) || 0);
                    return (
                      <tr key={item.rfqItemId}>
                        <td style={{ color: "var(--gray-400)", width: 32 }}>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{item.itemName}</td>
                        <td style={{ color: "var(--gray-500)" }}>{item.rfqQuantity}</td>
                        <td><span className="badge badge-gray">{item.unit}</span></td>
                        <td style={{ width: 140 }}>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={e => updateItem(i, "unitPrice", e.target.value)}
                            disabled={!!isExpired}
                            style={{ height: 34, fontSize: "0.8125rem" }}
                          />
                        </td>
                        <td style={{ width: 110 }}>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="0"
                            min="0"
                            step="1"
                            value={item.deliveryDays}
                            onChange={e => updateItem(i, "deliveryDays", e.target.value)}
                            disabled={!!isExpired}
                            style={{ height: 34, fontSize: "0.8125rem" }}
                          />
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 500 }}>
                          {lineTotal > 0 ? formatCurrency(lineTotal) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="card">
            <div className="card-header"><span className="card-title">Terms & Notes</span></div>
            <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Payment Terms</label>
                <input className="form-input" type="text" placeholder="e.g. 30 days net, 50% advance"
                  value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} disabled={!!isExpired} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">GST %</label>
                <input className="form-input" type="number" min="0" max="100" step="0.01"
                  value={gstPercent} onChange={e => setGstPercent(e.target.value)} disabled={!!isExpired} />
              </div>
              <div className="form-group" style={{ margin: 0, gridColumn: "1 / -1" }}>
                <label className="form-label">Notes / Remarks</label>
                <textarea className="form-textarea" style={{ height: 80 }}
                  placeholder="Any additional information, warranty terms, delivery conditions…"
                  value={notes} onChange={e => setNotes(e.target.value)} disabled={!!isExpired} />
              </div>
            </div>
          </div>
        </div>

        {/* Right — Summary */}
        <div className="card" style={{ position: "sticky", top: "72px" }}>
          <div className="card-header"><span className="card-title">Quotation Summary</span></div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--gray-500)" }}>Subtotal</span>
                <span style={{ fontWeight: 500 }}>{formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--gray-500)" }}>GST ({gstPercent || 0}%)</span>
                <span style={{ fontWeight: 500 }}>{formatCurrency((subtotal * gst) / 100)}</span>
              </div>
              <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, color: "var(--gray-800)" }}>Grand Total</span>
                <span style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--blue-600)" }}>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
          {!isExpired && (
            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--gray-100)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                className="btn btn-outline btn-full"
                disabled={submitting}
                onClick={() => handleSubmit(true)}
              >
                {submitting ? "Saving…" : "Save Draft"}
              </button>
              <button
                className="btn btn-primary btn-full"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
              >
                {submitting ? "Submitting…" : "Submit Quotation"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
