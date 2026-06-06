"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface Vendor {
  id: string;
  companyName: string;
  rating: number;
  status: string;
}

interface Quotation {
  id: string;
  rfqId: string;
  status: string;
  notes: string | null;
  paymentTerms: string | null;
  subtotal: number;
  gstPercent: number;
  grandTotal: number;
  submittedAt: string | null;
  deliveryDays: number;
  vendor: Vendor;
  isLowestPrice: boolean;
  isFastestDelivery: boolean;
  recommendationScore: number;
}

interface Recommendation {
  quotationId: string;
  vendorName: string;
  score: number;
  price: number;
  delivery: number;
  rating: number;
}

interface RFQ {
  id: string;
  title: string;
  category: string;
  status: string;
}

interface QuotationItem {
  id: string;
  itemName: string;
  rfqItemId: string;
  unitPrice: number;
  quantity: number;
  deliveryDays: number;
  total: number;
  rfqItem?: {
    itemName: string;
    unit: string;
    description: string | null;
  };
}

interface QuotationDetail {
  id: string;
  status: string;
  notes: string | null;
  paymentTerms: string | null;
  subtotal: number;
  gstPercent: number;
  grandTotal: number;
  submittedAt: string | null;
  rfq: {
    id: string;
    title: string;
    category: string;
  };
  vendor: {
    id: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    rating: number;
  };
  items: QuotationItem[];
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "badge-gray",
  SUBMITTED: "badge-blue",
  REVISED: "badge-yellow",
  SELECTED: "badge-green",
  REJECTED: "badge-red",
};

export default function QuotationComparisonPage() {
  const params = useParams();
  const router = useRouter();
  const rfqId = params.id as string;

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filters state
  const [vendorFilter, setVendorFilter] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [deliveryMax, setDeliveryMax] = useState("");
  const [ratingMin, setRatingMin] = useState("");

  // Sorting state
  const [sortBy, setSortBy] = useState("SCORE_DESC");

  // Selection state
  const [selectedQuotForAction, setSelectedQuotForAction] = useState<Quotation | null>(null);
  const [selectingWinner, setSelectingWinner] = useState(false);

  // Drawer state
  const [activeQuotationId, setActiveQuotationId] = useState<string | null>(null);
  const [quotationDetail, setQuotationDetail] = useState<QuotationDetail | null>(null);
  const [loadingDrawer, setLoadingDrawer] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/comparison`);
      const data = await res.json();
      if (res.ok) {
        setRfq(data.rfq);
        setQuotations(data.quotations ?? []);
        setRecommendation(data.recommendation);
      } else {
        setMsg({ type: "error", text: data.error ?? "Failed to fetch comparison data" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Network error occurred" });
    } finally {
      setLoading(false);
    }
  }, [rfqId]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserRole(d.user?.role ?? ""));
    fetchData();
  }, [fetchData]);

  // Fetch Quotation Detail when Drawer opens
  useEffect(() => {
    if (!activeQuotationId) {
      setQuotationDetail(null);
      return;
    }
    setLoadingDrawer(true);
    fetch(`/api/quotations/${activeQuotationId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.quotation) setQuotationDetail(d.quotation);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingDrawer(false));
  }, [activeQuotationId]);

  const handleSelectWinner = async () => {
    if (!selectedQuotForAction) return;
    setSelectingWinner(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/quotations/${selectedQuotForAction.id}/select`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: `Quotation from ${selectedQuotForAction.vendor.companyName} selected as the winner successfully!` });
        setSelectedQuotForAction(null);
        setActiveQuotationId(null);
        fetchData();
      } else {
        setMsg({ type: "error", text: data.error ?? "Failed to select winning quotation" });
      }
    } catch {
      setMsg({ type: "error", text: "Failed to connect to the server" });
    } finally {
      setSelectingWinner(false);
    }
  };

  // Star rendering helper
  const renderStars = (rating: number) => {
    const numRating = Number(rating);
    const rounded = Math.round(numRating);
    const goldStars = "★".repeat(rounded);
    const grayStars = "☆".repeat(5 - rounded);
    return (
      <span style={{ color: "#D97706", fontWeight: "bold", fontSize: "0.95rem" }} title={`Rating: ${numRating.toFixed(1)}/5`}>
        {goldStars}
        <span style={{ color: "var(--gray-300)" }}>{grayStars}</span>
        <span style={{ marginLeft: 6, color: "var(--gray-500)", fontSize: "0.75rem" }}>({numRating.toFixed(1)})</span>
      </span>
    );
  };

  // Filtering & Sorting Logic
  const filteredQuotations = quotations.filter((q) => {
    const matchesVendor = q.vendor.companyName.toLowerCase().includes(vendorFilter.toLowerCase());
    const matchesPrice = priceMax ? q.grandTotal <= parseFloat(priceMax) : true;
    const matchesDelivery = deliveryMax ? q.deliveryDays <= parseInt(deliveryMax) : true;
    const matchesRating = ratingMin ? q.vendor.rating >= parseFloat(ratingMin) : true;
    return matchesVendor && matchesPrice && matchesDelivery && matchesRating;
  });

  const sortedQuotations = [...filteredQuotations].sort((a, b) => {
    if (sortBy === "PRICE_ASC") return a.grandTotal - b.grandTotal;
    if (sortBy === "PRICE_DESC") return b.grandTotal - a.grandTotal;
    if (sortBy === "DELIVERY_ASC") return a.deliveryDays - b.deliveryDays;
    if (sortBy === "RATING_DESC") return b.vendor.rating - a.vendor.rating;
    return b.recommendationScore - a.recommendationScore; // DEFAULT (Score Descending)
  });

  const isProcurement = userRole === "PROCUREMENT_OFFICER";
  const hasSelectedWinner = quotations.some((q) => q.status === "SELECTED");

  if (loading) return <div className="page-content" style={{ color: "var(--gray-400)", padding: "3rem", textAlign: "center" }}>Loading comparison...</div>;
  if (!rfq) return <div className="page-content"><div className="alert alert-error">RFQ not found.</div></div>;

  return (
    <div className="page-content" style={{ position: "relative" }}>
      {/* Messages */}
      {msg && (
        <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: "1.25rem", display: "flex", width: "100%" }}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "bold" }}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Quotation Comparison</h1>
          <p className="page-desc">
            RFQ: <strong style={{ color: "var(--gray-800)" }}>{rfq.title}</strong> · Category: <strong>{rfq.category}</strong>
          </p>
        </div>
        <Link href={`/rfqs/${rfqId}`} className="btn btn-outline btn-sm">← Back to RFQ</Link>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: recommendation ? "1fr 340px" : "1fr", gap: "1.5rem", alignItems: "start" }}>
        
        {/* Left column: Filters & Table */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Filters Card */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", alignItems: "end" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Search Vendor</label>
                <input className="form-input" type="text" placeholder="Vendor name..." value={vendorFilter} onChange={e => setVendorFilter(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Max Price (₹)</label>
                <input className="form-input" type="number" placeholder="Max total price..." value={priceMax} onChange={e => setPriceMax(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Max Delivery Days</label>
                <input className="form-input" type="number" placeholder="Max days..." value={deliveryMax} onChange={e => setDeliveryMax(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Min Rating</label>
                <select className="form-select" value={ratingMin} onChange={e => setRatingMin(e.target.value)}>
                  <option value="">All Ratings</option>
                  <option value="4.5">4.5+ ⭐</option>
                  <option value="4.0">4.0+ ⭐</option>
                  <option value="3.5">3.5+ ⭐</option>
                  <option value="3.0">3.0+ ⭐</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Sort By</label>
                <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="SCORE_DESC">Recommended Match</option>
                  <option value="PRICE_ASC">Lowest Price first</option>
                  <option value="PRICE_DESC">Highest Price first</option>
                  <option value="DELIVERY_ASC">Fastest Delivery first</option>
                  <option value="RATING_DESC">Highest Rating first</option>
                </select>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Grand Total</th>
                    <th>GST</th>
                    <th>Delivery Time</th>
                    <th>Rating</th>
                    <th>Payment Terms</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedQuotations.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--gray-400)" }}>No matching quotations found.</td></tr>
                  ) : (
                    sortedQuotations.map((q) => {
                      // Highlighting background colors
                      let bg = "white";
                      if (q.isLowestPrice && q.isFastestDelivery) bg = "#EFF6FF"; // soft blue
                      else if (q.isLowestPrice) bg = "#F0FDF4"; // soft green
                      else if (q.isFastestDelivery) bg = "#F5F3FF"; // soft purple

                      return (
                        <tr
                          key={q.id}
                          onClick={() => setActiveQuotationId(q.id)}
                          style={{ background: bg, cursor: "pointer", transition: "background .15s" }}
                        >
                          <td>
                            <div style={{ fontWeight: 600, color: "var(--gray-800)" }}>{q.vendor.companyName}</div>
                            {q.status === "SELECTED" && <span className="badge badge-green" style={{ marginTop: 4 }}>Winning Bid</span>}
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(q.grandTotal)}
                            {q.isLowestPrice && (
                              <div style={{ marginTop: 4 }}>
                                <span className="badge badge-green" style={{ fontSize: "0.6rem" }}>Lowest Price</span>
                              </div>
                            )}
                          </td>
                          <td style={{ color: "var(--gray-500)" }}>{q.gstPercent}%</td>
                          <td style={{ fontWeight: 600 }}>
                            {q.deliveryDays} days
                            {q.isFastestDelivery && (
                              <div style={{ marginTop: 4 }}>
                                <span className="badge badge-purple" style={{ fontSize: "0.6rem" }}>Fastest Delivery</span>
                              </div>
                            )}
                          </td>
                          <td>{renderStars(q.vendor.rating)}</td>
                          <td style={{ fontSize: "0.8rem", color: "var(--gray-500)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {q.paymentTerms || "—"}
                          </td>
                          <td>
                            <span className={`badge ${STATUS_COLORS[q.status] ?? "badge-gray"}`}>{q.status}</span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.25rem" }} onClick={e => e.stopPropagation()}>
                              <button className="btn btn-outline btn-sm" onClick={() => setActiveQuotationId(q.id)}>Details</button>
                              {isProcurement && !hasSelectedWinner && (q.status === "SUBMITTED" || q.status === "REVISED") && (
                                <button className="btn btn-primary btn-sm" onClick={() => setSelectedQuotForAction(q)}>Select</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Recommendation Card */}
        {recommendation && (
          <div className="card" style={{ border: "1px solid var(--blue-100)", background: "#F8FAFC" }}>
            <div className="card-header" style={{ background: "linear-gradient(135deg, var(--blue-600) 0%, var(--blue-700) 100%)", color: "white", borderRadius: "11px 11px 0 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="card-title" style={{ color: "white", fontSize: "0.95rem" }}>System Recommendation</span>
              </div>
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--gray-400)", display: "block", marginBottom: 2 }}>Recommended Supplier</span>
                <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--gray-900)" }}>{recommendation.vendorName}</span>
              </div>

              <div style={{ background: "white", padding: "10px 14px", borderRadius: "var(--radius)", border: "1px solid var(--gray-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--gray-500)", fontWeight: 500 }}>Recommendation Match</span>
                <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--blue-600)" }}>{recommendation.score}%</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                  <span style={{ color: "var(--gray-500)" }}>Quote Price</span>
                  <span style={{ fontWeight: 600, color: "var(--gray-800)" }}>
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(recommendation.price)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                  <span style={{ color: "var(--gray-500)" }}>Delivery Timeline</span>
                  <span style={{ fontWeight: 600, color: "var(--gray-800)" }}>{recommendation.delivery} days</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                  <span style={{ color: "var(--gray-500)" }}>Vendor Rating</span>
                  <span style={{ fontWeight: 600, color: "var(--gray-800)" }}>⭐ {Number(recommendation.rating).toFixed(1)} / 5.0</span>
                </div>
              </div>

              {isProcurement && !hasSelectedWinner && (
                <button
                  className="btn btn-primary btn-full btn-sm"
                  style={{ marginTop: "0.5rem" }}
                  onClick={() => {
                    const recQuot = quotations.find((q) => q.id === recommendation.quotationId);
                    if (recQuot) setSelectedQuotForAction(recQuot);
                  }}
                >
                  Select Recommended Vendor
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Side Panel Drawer for Quotation Details */}
      {activeQuotationId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", justifyContent: "flex-end" }}>
          {/* Backdrop */}
          <div onClick={() => setActiveQuotationId(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(1px)" }} />
          
          {/* Drawer container */}
          <div style={{
            position: "relative",
            width: "520px",
            height: "100%",
            background: "white",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            animation: "slideIn 0.2s ease-out",
          }}>
            {/* Header */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--gray-100)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--gray-900)" }}>Quotation Details</h3>
                <span className="badge badge-gray" style={{ marginTop: 4 }}>ID: {activeQuotationId.substring(0, 10)}...</span>
              </div>
              <button
                onClick={() => setActiveQuotationId(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: "var(--gray-400)", fontWeight: "300" }}
              >
                &times;
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
              {loadingDrawer ? (
                <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--gray-400)" }}>Loading details…</div>
              ) : quotationDetail ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {/* Supplier Card */}
                  <div>
                    <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--gray-400)", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Supplier Information</h4>
                    <div style={{ background: "var(--gray-50)", padding: "1rem", borderRadius: "var(--radius)", border: "1px solid var(--gray-200)" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--gray-800)", marginBottom: 6 }}>{quotationDetail.vendor.companyName}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.8125rem", color: "var(--gray-600)" }}>
                        <div>Contact: {quotationDetail.vendor.contactName}</div>
                        <div>Email: {quotationDetail.vendor.contactEmail}</div>
                        {quotationDetail.vendor.contactPhone && <div>Phone: {quotationDetail.vendor.contactPhone}</div>}
                        <div style={{ marginTop: 4 }}>Rating: {renderStars(quotationDetail.vendor.rating)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing breakdown */}
                  <div>
                    <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--gray-400)", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Bidded Line Items</h4>
                    <div style={{ border: "1px solid var(--gray-200)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                      <table style={{ fontSize: "0.8125rem" }}>
                        <thead style={{ background: "var(--gray-50)" }}>
                          <tr>
                            <th>Item Name</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Timeline</th>
                            <th style={{ textAlign: "right" }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quotationDetail.items.map((item) => (
                            <tr key={item.id}>
                              <td style={{ fontWeight: 500 }}>{item.rfqItem?.itemName || item.itemName}</td>
                              <td>{item.quantity} {item.rfqItem?.unit}</td>
                              <td>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(item.unitPrice)}</td>
                              <td>{item.deliveryDays}d</td>
                              <td style={{ textAlign: "right", fontWeight: 600 }}>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Notes & Terms */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--gray-400)", display: "block", marginBottom: 2 }}>Payment Terms</span>
                      <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--gray-700)" }}>{quotationDetail.paymentTerms || "Standard Terms"}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--gray-400)", display: "block", marginBottom: 2 }}>Submission Status</span>
                      <span className={`badge ${STATUS_COLORS[quotationDetail.status]}`}>{quotationDetail.status}</span>
                    </div>
                    {quotationDetail.notes && (
                      <div style={{ gridColumn: "span 2" }}>
                        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--gray-400)", display: "block", marginBottom: 2 }}>Vendor Remarks</span>
                        <div style={{ fontSize: "0.8125rem", color: "var(--gray-600)", padding: 8, background: "var(--gray-50)", borderRadius: "var(--radius-sm)", border: "1px solid var(--gray-200)" }}>
                          {quotationDetail.notes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Totals Box */}
                  <div style={{ background: "var(--gray-50)", padding: "1rem", borderRadius: "var(--radius)", border: "1px solid var(--gray-200)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.875rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--gray-500)" }}>Subtotal</span>
                        <span style={{ fontWeight: 500 }}>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(quotationDetail.subtotal)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--gray-500)" }}>GST ({quotationDetail.gstPercent}%)</span>
                        <span style={{ fontWeight: 500 }}>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format((quotationDetail.subtotal * quotationDetail.gstPercent) / 100)}</span>
                      </div>
                      <div style={{ borderTop: "1px solid var(--gray-200)", marginTop: 4, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 700, color: "var(--gray-800)" }}>Grand Total</span>
                        <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--blue-600)" }}>
                          {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(quotationDetail.grandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: "var(--gray-400)", textAlign: "center" }}>Failed to load details.</div>
              )}
            </div>

            {/* Actions Footer */}
            {quotationDetail && isProcurement && !hasSelectedWinner && (quotationDetail.status === "SUBMITTED" || quotationDetail.status === "REVISED") && (
              <div style={{ padding: "1rem", borderTop: "1px solid var(--gray-100)", background: "var(--gray-50)" }}>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => {
                    const q = quotations.find(qt => qt.id === quotationDetail.id);
                    if (q) setSelectedQuotForAction(q);
                  }}
                >
                  Select Vendor Winner
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedQuotForAction && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="modal-title">Select Winning Vendor</span>
              <button onClick={() => setSelectedQuotForAction(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "var(--gray-400)" }}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.9rem", color: "var(--gray-600)", lineHeight: 1.5 }}>
                Are you sure you want to select <strong>{selectedQuotForAction.vendor.companyName}</strong>'s quotation as the winner for this RFQ?
              </p>
              <div style={{ background: "var(--gray-50)", padding: "10px 14px", borderRadius: "var(--radius)", border: "1px solid var(--gray-200)", marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: 4 }}>
                  <span style={{ color: "var(--gray-500)" }}>Supplier</span>
                  <span style={{ fontWeight: 600, color: "var(--gray-800)" }}>{selectedQuotForAction.vendor.companyName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                  <span style={{ color: "var(--gray-500)" }}>Total Price</span>
                  <span style={{ fontWeight: 600, color: "var(--gray-800)" }}>
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(selectedQuotForAction.grandTotal)}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--red-500)", fontWeight: 500, marginTop: 12 }}>
                ⚠️ This will reject all other quotations and close the RFQ. Vendors will be notified.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" disabled={selectingWinner} onClick={() => setSelectedQuotForAction(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" disabled={selectingWinner} onClick={handleSelectWinner}>
                {selectingWinner ? "Selecting Winner…" : "Confirm Selection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide Drawer Animation CSS Helper */}
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
