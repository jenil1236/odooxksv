"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); setStatus("idle"); return; }
      setStatus("sent");
    } catch {
      setError("Network error. Please try again.");
      setStatus("idle");
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-mobile-logo">
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#2563EB" />
          <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>VendorBridge</span>
      </div>

      {status === "sent" ? (
        <>
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--green-50)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h1 className="auth-heading" style={{ textAlign: "center" }}>Check your email</h1>
            <p style={{ color: "var(--gray-500)", fontSize: ".9rem", marginTop: ".5rem" }}>
              If <strong>{email}</strong> is registered, a new password has been sent to that address.
            </p>
            <Link href="/login" className="btn btn-primary" style={{ marginTop: "1.5rem", display: "inline-flex" }}>
              Back to sign in
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="auth-heading">Forgot password?</h1>
          <p className="auth-sub">
            Enter your email and we'll send you a new password right away.
          </p>

          {error && (
            <div className="alert alert-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6.5a.875.875 0 110-1.75.875.875 0 010 1.75z" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="fp-email">Email address</label>
              <input
                id="fp-email"
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <button
              id="fp-submit"
              type="submit"
              className="btn btn-primary btn-full"
              disabled={status === "loading"}
              style={{ marginTop: ".5rem" }}
            >
              {status === "loading" ? <span className="spinner" /> : null}
              {status === "loading" ? "Sending…" : "Send new password"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: ".875rem", color: "var(--gray-500)", marginTop: "1.25rem" }}>
            <Link href="/login" className="link">← Back to sign in</Link>
          </p>
        </>
      )}
    </div>
  );
}
