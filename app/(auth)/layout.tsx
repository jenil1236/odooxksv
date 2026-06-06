export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      {/* Brand panel */}
      <div className="auth-brand">
        <div className="auth-brand-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.15)" />
            <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>VendorBridge</span>
        </div>
        <div>
          <p className="auth-brand-tagline">
            Procurement &amp; Vendor<br />
            <span>Management Simplified</span>
          </p>
          <p className="auth-brand-desc" style={{ marginTop: "1rem" }}>
            Manage vendors, purchase orders, and approvals in one unified platform built for modern procurement teams.
          </p>
        </div>
        <div className="auth-features">
          {[
            "Role-based access control",
            "Automated vendor onboarding",
            "Multi-level approval workflows",
            "Real-time procurement analytics",
          ].map((f) => (
            <div className="auth-feature" key={f}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="8" fill="rgba(255,255,255,0.2)" />
                <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-card-side">{children}</div>
    </div>
  );
}
