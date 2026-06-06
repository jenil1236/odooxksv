"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const poId = params.id as string;

  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => setUserRole(d.user?.role || ""));

    fetch(`/api/purchase-orders/${poId}`)
      .then(r => r.json())
      .then(d => {
        setPo(d.purchaseOrder);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [poId]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/purchase-orders/${poId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: "PO Status updated successfully." });
        setPo({ ...po, status: newStatus });
      } else {
        setMsg({ type: "error", text: data.error || "Failed to update status." });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Network error." });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "GENERATED": return "badge-blue";
      case "SENT": return "badge-yellow";
      case "FULFILLED": return "badge-green";
      case "CANCELLED": return "badge-red";
      default: return "badge-gray";
    }
  };

  if (loading) return <div className="page-content" style={{ color: "var(--gray-400)", padding: "3rem", textAlign: "center" }}>Loading PO details...</div>;
  if (!po) return <div className="page-content"><div className="alert alert-error">Purchase Order not found.</div></div>;

  const isProcurement = userRole === "PROCUREMENT_OFFICER";

  return (
    <div className="page-content">
      {msg && (
        <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}>×</button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Purchase Order: {po.poNumber}</h1>
          <p className="page-desc" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
            <span className={`badge ${getStatusBadge(po.status)}`} style={{ fontSize: "0.8rem" }}>{po.status}</span>
            <span>Issued on: {format(new Date(po.issueDate), "dd MMM yyyy")}</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {isProcurement && (
            <select 
              className="form-select" 
              style={{ width: "auto", height: "32px", fontSize: "0.8125rem", padding: "0 2rem 0 0.75rem" }}
              value={po.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updating}
            >
              <option value="GENERATED">Generated</option>
              <option value="SENT">Sent to Vendor</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}
          <Link href="/purchase-orders" className="btn btn-outline btn-sm">Back</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {/* Top Info Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Vendor Info */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--gray-400)", letterSpacing: "0.05em", marginBottom: "1rem" }}>Vendor Details</h3>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--gray-900)", marginBottom: "0.5rem" }}>{po.vendor.companyName}</div>
            <div style={{ color: "var(--gray-600)", fontSize: "0.875rem", lineHeight: 1.6 }}>
              <div>{po.vendor.contactName}</div>
              <div>{po.vendor.contactEmail} {po.vendor.contactPhone && `| ${po.vendor.contactPhone}`}</div>
              {po.vendor.address && <div style={{ marginTop: "0.5rem" }}>{po.vendor.address}, {po.vendor.city}, {po.vendor.state} {po.vendor.postalCode}</div>}
              {po.vendor.gstNumber && <div style={{ marginTop: "0.5rem" }}><strong>GSTIN:</strong> {po.vendor.gstNumber}</div>}
            </div>
          </div>

          {/* General Info */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--gray-400)", letterSpacing: "0.05em", marginBottom: "1rem" }}>Order Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.875rem" }}>
              <div>
                <span style={{ color: "var(--gray-500)", display: "block", marginBottom: 2 }}>RFQ Reference</span>
                <Link href={`/rfqs/${po.rfq.id}`} className="link">{po.rfq.title}</Link>
              </div>
              <div>
                <span style={{ color: "var(--gray-500)", display: "block", marginBottom: 2 }}>Approved By</span>
                <span style={{ fontWeight: 500, color: "var(--gray-800)" }}>{po.approvedBy.firstName} {po.approvedBy.lastName}</span>
              </div>
              {po.notes && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ color: "var(--gray-500)", display: "block", marginBottom: 2 }}>Payment/Order Terms</span>
                  <div style={{ padding: "0.5rem", background: "var(--gray-50)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-sm)" }}>
                    {po.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">Line Items</h3></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((item: any) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.itemName}</td>
                    <td>{item.quantity} {item.unit}</td>
                    <td>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(item.unitPrice)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Totals */}
          <div style={{ padding: "1.5rem", borderTop: "1px solid var(--gray-200)", display: "flex", justifyContent: "flex-end", background: "var(--gray-50)", borderRadius: "0 0 var(--radius-lg) var(--radius-lg)" }}>
            <div style={{ width: "300px", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--gray-500)" }}>Subtotal</span>
                <span style={{ fontWeight: 500 }}>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(po.subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--gray-500)" }}>GST ({po.gstPercent}%)</span>
                <span style={{ fontWeight: 500 }}>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format((po.subtotal * po.gstPercent) / 100)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--gray-300)", paddingTop: "0.75rem", marginTop: "0.25rem", fontSize: "1.1rem" }}>
                <span style={{ fontWeight: 700, color: "var(--gray-800)" }}>Grand Total</span>
                <span style={{ fontWeight: 800, color: "var(--blue-600)" }}>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(po.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
