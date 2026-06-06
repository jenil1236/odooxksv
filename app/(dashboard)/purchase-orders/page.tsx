"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/purchase-orders")
      .then(r => r.json())
      .then(d => {
        setPurchaseOrders(d.purchaseOrders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "GENERATED": return "badge-blue";
      case "SENT": return "badge-yellow";
      case "FULFILLED": return "badge-green";
      case "CANCELLED": return "badge-red";
      default: return "badge-gray";
    }
  };

  if (loading) return <div className="page-content" style={{ color: "var(--gray-400)", padding: "3rem", textAlign: "center" }}>Loading purchase orders...</div>;

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-desc">Manage generated Purchase Orders</p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>RFQ Title</th>
                <th>Vendor</th>
                <th>Grand Total</th>
                <th>Issue Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--gray-400)" }}>
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map(po => (
                  <tr key={po.id}>
                    <td style={{ fontWeight: 600, color: "var(--blue-600)" }}>{po.poNumber}</td>
                    <td style={{ fontWeight: 500, color: "var(--gray-800)" }}>{po.rfq.title}</td>
                    <td>{po.vendor.companyName}</td>
                    <td style={{ fontWeight: 600 }}>
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(po.grandTotal)}
                    </td>
                    <td>{format(new Date(po.issueDate), "dd MMM yyyy")}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(po.status)}`}>{po.status}</span>
                    </td>
                    <td>
                      <Link href={`/purchase-orders/${po.id}`} className="btn btn-outline btn-sm">
                        View PO
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
