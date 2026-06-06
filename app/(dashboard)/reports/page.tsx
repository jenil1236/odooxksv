"use client";
import { useState, useEffect, useCallback } from "react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtFull = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

interface SummaryReport {
  totalSpend: number;
  invoiceCount: number;
  paidSpend: number;
  paidCount: number;
  overdueCount: number;
  activeVendors: number;
  totalPOs: number;
  fulfilledPOs: number;
  poFulfillmentRate: number;
}

interface CategorySpend {
  category: string;
  total: number;
}

interface TopVendor {
  vendorId: string;
  companyName: string;
  invoiceCount: number;
  total: number;
}

interface MonthlyTrend {
  month: string;
  total: number;
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [categoryData, setCategoryData] = useState<CategorySpend[]>([]);
  const [topVendors, setTopVendors] = useState<TopVendor[]>([]);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");
  const [exporting, setExporting] = useState(false);

  const fetchAll = useCallback((m: string) => {
    Promise.resolve().then(() => {
      setLoading(true);
    });
    const q = m ? `?month=${m}` : "";
    Promise.all([
      fetch(`/api/reports/summary${q}`).then(r => r.json()),
      fetch(`/api/reports/spend-by-category${q}`).then(r => r.json()),
      fetch(`/api/reports/top-vendors${q}`).then(r => r.json()),
      fetch(`/api/reports/monthly-trends`).then(r => r.json()),
    ]).then(([s, c, v, t]) => {
      setSummary(s);
      setCategoryData(c.data || []);
      setTopVendors(v.data || []);
      setTrends(t.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAll(month);
  }, [fetchAll, month]);

  const handleMonthChange = (m: string) => { setMonth(m); };

  const handleExport = async () => {
    setExporting(true);
    const q = month ? `?month=${month}` : "";
    const res = await fetch(`/api/reports/export${q}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendorbridge-report-${month || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const maxTrend = trends.length > 0 ? Math.max(...trends.map(t => t.total), 1) : 1;
  const maxCategory = categoryData.length > 0 ? Math.max(...categoryData.map(c => c.total), 1) : 1;

  const kpiCards = summary ? [
    { label: "Total Spend", value: fmt(summary.totalSpend ?? 0), sub: `${summary.invoiceCount} invoices`, color: "#2563EB", bg: "#EFF6FF" },
    { label: "Paid Amount", value: fmt(summary.paidSpend ?? 0), sub: `${summary.paidCount} invoices paid`, color: "#15803D", bg: "#F0FDF4" },
    { label: "Overdue Invoices", value: summary.overdueCount ?? 0, sub: "Require attention", color: "#B91C1C", bg: "#FEF2F2" },
    { label: "Active Vendors", value: summary.activeVendors ?? 0, sub: "On platform", color: "#7C3AED", bg: "#F5F3FF" },
    { label: "Purchase Orders", value: summary.totalPOs ?? 0, sub: `${summary.fulfilledPOs} fulfilled`, color: "#0369A1", bg: "#E0F2FE" },
    { label: "PO Fulfillment Rate", value: `${summary.poFulfillmentRate ?? 0}%`, sub: "Orders completed", color: "#B45309", bg: "#FEF3C7" },
  ] : [];

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-desc">Procurement spend, vendor performance, and invoice insights</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <input
            type="month"
            className="form-input"
            style={{ width: "auto" }}
            value={month}
            onChange={e => handleMonthChange(e.target.value)}
          />
          <button className="btn btn-outline btn-sm" onClick={() => handleMonthChange("")}>
            All Time
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting…" : "⬇ Export CSV"}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--gray-400)" }}>Loading analytics…</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {kpiCards.map((card) => (
              <div key={card.label} className="card" style={{ padding: "1.25rem", borderLeft: `4px solid ${card.color}` }}>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--gray-400)", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>{card.label}</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginTop: "0.375rem" }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Two-column: Monthly Trend + Category Spend */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>

            {/* Monthly Trend */}
            <div className="card">
              <div className="card-header"><h3 className="card-title">Monthly Spend Trend</h3></div>
              <div className="card-body">
                {trends.length === 0 ? (
                  <p style={{ color: "var(--gray-400)", textAlign: "center", fontSize: "0.875rem" }}>No trend data yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {trends.map((t) => {
                      const pct = Math.max((t.total / maxTrend) * 100, 2);
                      const [y, m] = t.month.split("-");
                      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
                      return (
                        <div key={t.month} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8125rem" }}>
                          <span style={{ width: 48, color: "var(--gray-500)", flexShrink: 0, textAlign: "right" }}>{label}</span>
                          <div style={{ flex: 1, background: "var(--gray-100)", borderRadius: 4, height: 20, position: "relative" }}>
                            <div style={{ width: `${pct}%`, background: "var(--blue-500)", borderRadius: 4, height: "100%", transition: "width 0.4s" }} />
                          </div>
                          <span style={{ width: 90, color: "var(--gray-700)", fontWeight: 600, textAlign: "right" }}>{fmt(t.total)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Spend by Category */}
            <div className="card">
              <div className="card-header"><h3 className="card-title">Spend by Category</h3></div>
              <div className="card-body">
                {categoryData.length === 0 ? (
                  <p style={{ color: "var(--gray-400)", textAlign: "center", fontSize: "0.875rem" }}>No category data yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {categoryData.map((c, i) => {
                      const pct = Math.max((c.total / maxCategory) * 100, 2);
                      const colors = ["#2563EB", "#7C3AED", "#15803D", "#B45309", "#0369A1", "#B91C1C"];
                      const color = colors[i % colors.length];
                      return (
                        <div key={c.category} style={{ fontSize: "0.8125rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                            <span style={{ color: "var(--gray-700)", fontWeight: 500 }}>{c.category}</span>
                            <span style={{ color: "var(--gray-600)", fontWeight: 600 }}>{fmt(c.total)}</span>
                          </div>
                          <div style={{ background: "var(--gray-100)", borderRadius: 4, height: 8 }}>
                            <div style={{ width: `${pct}%`, background: color, borderRadius: 4, height: "100%", transition: "width 0.4s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Vendors Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Top Vendors by Spend</h3>
              <span className="badge badge-gray">{topVendors.length} vendors</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Vendor</th>
                    <th>Invoices</th>
                    <th style={{ textAlign: "right" }}>Total Spend</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {topVendors.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--gray-400)" }}>No vendor spend data yet.</td></tr>
                  ) : (
                    topVendors.map((v, i) => {
                      const totalAll = topVendors.reduce((s, x) => s + x.total, 0);
                      const share = totalAll > 0 ? ((v.total / totalAll) * 100).toFixed(1) : "0.0";
                      return (
                        <tr key={v.vendorId}>
                          <td style={{ color: "var(--gray-400)", fontWeight: 600 }}>#{i + 1}</td>
                          <td style={{ fontWeight: 600, color: "var(--gray-800)" }}>{v.companyName}</td>
                          <td style={{ color: "var(--gray-500)" }}>{v.invoiceCount}</td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "var(--blue-600)" }}>{fmtFull(v.total)}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ flex: 1, background: "var(--gray-100)", borderRadius: 4, height: 8 }}>
                                <div style={{ width: `${share}%`, background: "var(--blue-500)", borderRadius: 4, height: "100%" }} />
                              </div>
                              <span style={{ fontSize: "0.75rem", color: "var(--gray-500)", width: 36 }}>{share}%</span>
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
        </>
      )}
    </div>
  );
}
