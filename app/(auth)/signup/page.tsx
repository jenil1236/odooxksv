"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "India",
  "Germany", "France", "Singapore", "UAE", "South Africa", "Other",
];

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", confirmPassword: "",
    phone: "", country: "", additionalInfo: "",
    organizationName: "", organizationDetails: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match"); return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters"); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, password: form.password,
          phone: form.phone, country: form.country,
          additionalInfo: form.additionalInfo || undefined,
          organizationName: form.organizationName,
          organizationDetails: form.organizationDetails || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Signup failed"); return; }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card" style={{ maxWidth: 500 }}>
      <div className="auth-mobile-logo">
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#2563EB" />
          <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>VendorBridge</span>
      </div>

      <h1 className="auth-heading">Create organization account</h1>
      <p className="auth-sub">Set up VendorBridge for your company</p>

      {error && (
        <div className="alert alert-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6.5a.875.875 0 110-1.75.875.875 0 010 1.75z" /></svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Personal info */}
        <p style={{ fontSize: ".75rem", fontWeight: 600, color: "var(--gray-400)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: ".75rem" }}>
          Your details
        </p>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="signup-fname">First name</label>
            <input id="signup-fname" type="text" className="form-input" placeholder="Jane" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-lname">Last name</label>
            <input id="signup-lname" type="text" className="form-input" placeholder="Smith" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-email">Email address</label>
          <input id="signup-email" type="email" className="form-input" placeholder="jane@company.com" value={form.email} onChange={(e) => set("email", e.target.value)} required autoComplete="email" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input id="signup-password" type="password" className="form-input" placeholder="Min. 8 characters" value={form.password} onChange={(e) => set("password", e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm">Confirm password</label>
            <input id="signup-confirm" type="password" className="form-input" placeholder="Repeat password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="signup-phone">Phone</label>
            <input id="signup-phone" type="tel" className="form-input" placeholder="+1 555 000 0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-country">Country</label>
            <select id="signup-country" className="form-select" value={form.country} onChange={(e) => set("country", e.target.value)}>
              <option value="">Select country</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-info">Additional information <span style={{ color: "var(--gray-400)" }}>(optional)</span></label>
          <textarea id="signup-info" className="form-textarea" placeholder="Anything else we should know…" value={form.additionalInfo} onChange={(e) => set("additionalInfo", e.target.value)} />
        </div>

        {/* Organization info */}
        <p style={{ fontSize: ".75rem", fontWeight: 600, color: "var(--gray-400)", letterSpacing: ".08em", textTransform: "uppercase", margin: "1rem 0 .75rem" }}>
          Organization
        </p>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-org">Organization name</label>
          <input id="signup-org" type="text" className="form-input" placeholder="Acme Corp" value={form.organizationName} onChange={(e) => set("organizationName", e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-org-details">Organization details <span style={{ color: "var(--gray-400)" }}>(optional)</span></label>
          <textarea id="signup-org-details" className="form-textarea" placeholder="Industry, size, business context…" value={form.organizationDetails} onChange={(e) => set("organizationDetails", e.target.value)} />
        </div>

        <button id="signup-submit" type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: ".5rem" }}>
          {loading ? <span className="spinner" /> : null}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: ".875rem", color: "var(--gray-500)", marginTop: "1.25rem" }}>
        Already have an account?{" "}
        <Link href="/login" className="link">Sign in</Link>
      </p>
    </div>
  );
}
