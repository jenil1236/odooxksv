"use client";
import { useState, useEffect } from "react";

interface Vendor {
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
  notes: string | null;
  category: { id: string; name: string } | null;
}

export default function VendorProfilePage() {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/vendor/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load vendor profile.");
        return res.json();
      })
      .then((data) => setVendor(data.vendor))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--gray-400)", fontSize: "1.1rem" }}>Loading profile details…</p>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="page-content">
        <div className="alert alert-error">{error || "Vendor profile not found."}</div>
      </div>
    );
  }

  return (
    <>
      <div className="page-content">
        <div className="page-header">
          <p className="page-title">{vendor.companyName}</p>
          <p className="page-desc">Your official supplier profile in the VendorBridge network.</p>
        </div>

        <div className="form-row" style={{ alignItems: "start", gap: "1.5rem" }}>
          {/* Main profile card */}
          <div className="card" style={{ flex: 2, padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--gray-800)", marginBottom: "1.25rem", borderBottom: "1px solid var(--gray-100)", paddingBottom: "0.5rem" }}>
              Company Details
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray-400)", display: "block", marginBottom: "0.25rem" }}>
                  GST Number
                </span>
                <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--gray-700)", fontFamily: "monospace" }}>
                  {vendor.gstNumber ?? "Not provided"}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray-400)", display: "block", marginBottom: "0.25rem" }}>
                  Category
                </span>
                <span className="badge badge-info" style={{ display: "inline-block" }}>
                  {vendor.category?.name ?? "General Supply"}
                </span>
              </div>
            </div>

            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--gray-800)", marginBottom: "1.25rem", borderBottom: "1px solid var(--gray-100)", paddingBottom: "0.5rem", marginTop: "1rem" }}>
              Address Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--gray-400)", display: "block", marginBottom: "0.25rem" }}>
                  Street Address
                </span>
                <span style={{ fontSize: "0.9375rem", color: "var(--gray-700)" }}>
                  {vendor.address ?? "—"}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--gray-400)", display: "block", marginBottom: "0.25rem" }}>
                  City / State
                </span>
                <span style={{ fontSize: "0.9375rem", color: "var(--gray-700)" }}>
                  {vendor.city || vendor.state ? `${vendor.city ?? ""}, ${vendor.state ?? ""}` : "—"}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--gray-400)", display: "block", marginBottom: "0.25rem" }}>
                  Country / Postal Code
                </span>
                <span style={{ fontSize: "0.9375rem", color: "var(--gray-700)" }}>
                  {vendor.country || vendor.postalCode ? `${vendor.country ?? ""}, ${vendor.postalCode ?? ""}` : "—"}
                </span>
              </div>
            </div>

            {vendor.notes && (
              <>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--gray-800)", marginBottom: "0.75rem" }}>
                  Company Summary
                </h3>
                <p style={{ color: "var(--gray-500)", fontSize: "0.9375rem", lineHeight: 1.5, background: "var(--gray-50)", padding: "12px", borderRadius: "var(--radius-sm)" }}>
                  {vendor.notes}
                </p>
              </>
            )}
          </div>

          {/* Contact and Status card */}
          <div className="card" style={{ flex: 1, padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--gray-800)", marginBottom: "1.25rem", borderBottom: "1px solid var(--gray-100)", paddingBottom: "0.5rem" }}>
              Status & Rating
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--gray-500)" }}>Status:</span>
              <span className={`badge ${vendor.status === "ACTIVE" ? "badge-green" : "badge-yellow"}`}>
                {vendor.status}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--gray-500)" }}>Platform Rating:</span>
              <span style={{ fontWeight: 600, color: "var(--yellow-600)", fontSize: "1rem" }}>
                ⭐ {Number(vendor.rating).toFixed(1)} / 5.0
              </span>
            </div>

            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--gray-800)", marginBottom: "1.25rem", borderBottom: "1px solid var(--gray-100)", paddingBottom: "0.5rem" }}>
              Contact Person
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--gray-400)", display: "block" }}>Name</span>
                <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--gray-700)" }}>{vendor.contactName}</span>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--gray-400)", display: "block" }}>Email</span>
                <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--gray-700)" }}>{vendor.contactEmail}</span>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--gray-400)", display: "block" }}>Phone</span>
                <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--gray-700)" }}>{vendor.contactPhone ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
