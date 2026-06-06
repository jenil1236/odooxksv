import Link from "next/link";
import { getSession } from "@/lib/jwt";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VendorBridge — Procurement & Vendor Management ERP",
  description:
    "Simplify and digitize procurement operations. Manage vendors, RFQs, quotations, approvals, purchase orders, and invoices — all in one centralized ERP platform.",
};

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <>
      <style>{`
        /* ── Landing Reset ────────────────────────────── */
        .landing-body {
          background: #0a0f1e;
          color: #e2e8f0;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }

        /* ── Animated gradient orbs background ────────── */
        .hero-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          animation: orbFloat 12s ease-in-out infinite;
        }
        .orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #3b82f6, #1d4ed8);
          top: -200px; left: -100px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #8b5cf6, #5b21b6);
          top: 30%; right: -150px;
          animation-delay: -4s;
        }
        .orb-3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #06b6d4, #0891b2);
          bottom: -100px; left: 35%;
          animation-delay: -8s;
        }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          33%       { transform: translateY(-40px) scale(1.05); }
          66%       { transform: translateY(30px) scale(0.97); }
        }

        /* ── Grid overlay ─────────────────────────────── */
        .grid-overlay {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 0;
        }

        /* ── Nav ─────────────────────────────────────── */
        .landing-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 2.5rem;
          background: rgba(10,15,30,0.7);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          text-decoration: none;
        }
        .nav-logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
        }
        .nav-logo-text {
          font-size: 1.125rem;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.3px;
        }
        .nav-logo-badge {
          font-size: 0.5625rem;
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          padding: 2px 6px;
          border-radius: 999px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .btn-nav-login {
          height: 38px;
          padding: 0 1.25rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #cbd5e1;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.12);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          transition: all 0.2s;
        }
        .btn-nav-login:hover {
          background: rgba(255,255,255,0.07);
          color: white;
          border-color: rgba(255,255,255,0.2);
        }
        .btn-nav-signup {
          height: 38px;
          padding: 0 1.25rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          border: none;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          box-shadow: 0 0 20px rgba(37,99,235,0.4);
          transition: all 0.2s;
        }
        .btn-nav-signup:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 30px rgba(37,99,235,0.55);
        }

        /* ── Hero ─────────────────────────────────────── */
        .hero-section {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 10rem 2rem 7rem;
          min-height: 100vh;
        }
        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(59,130,246,0.12);
          border: 1px solid rgba(59,130,246,0.25);
          border-radius: 999px;
          padding: 0.3125rem 1rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #93c5fd;
          margin-bottom: 2rem;
          animation: fadeInDown 0.6s ease both;
        }
        .hero-pill-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #3b82f6;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.4); }
        }
        .hero-h1 {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -1.5px;
          color: #f8fafc;
          max-width: 820px;
          margin-bottom: 1.5rem;
          animation: fadeInDown 0.6s 0.1s ease both;
        }
        .hero-h1 .gradient-text {
          background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: 1.125rem;
          color: #94a3b8;
          max-width: 580px;
          line-height: 1.7;
          margin-bottom: 2.75rem;
          animation: fadeInDown 0.6s 0.2s ease both;
        }
        .hero-cta {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
          animation: fadeInDown 0.6s 0.3s ease both;
        }
        .btn-hero-primary {
          height: 52px;
          padding: 0 2rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          border: none;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          box-shadow: 0 0 30px rgba(37,99,235,0.45), 0 4px 15px rgba(0,0,0,0.3);
          transition: all 0.25s;
          cursor: pointer;
        }
        .btn-hero-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 50px rgba(37,99,235,0.6), 0 8px 25px rgba(0,0,0,0.4);
        }
        .btn-hero-secondary {
          height: 52px;
          padding: 0 2rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          color: #e2e8f0;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          backdrop-filter: blur(10px);
          transition: all 0.25s;
        }
        .btn-hero-secondary:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.22);
          transform: translateY(-1px);
        }

        /* ── Trust badges ─────────────────────────────── */
        .trust-bar {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2.5rem;
          padding: 0 2rem 5rem;
          flex-wrap: wrap;
          animation: fadeIn 0.8s 0.5s ease both;
        }
        .trust-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.8125rem;
          font-weight: 500;
        }
        .trust-item svg { color: #3b82f6; }

        /* ── Dash preview card ────────────────────────── */
        .preview-section {
          position: relative;
          z-index: 1;
          padding: 0 2rem 6rem;
          display: flex;
          justify-content: center;
        }
        .preview-wrapper {
          max-width: 1000px;
          width: 100%;
          position: relative;
        }
        .preview-glow {
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4);
          border-radius: 20px;
          filter: blur(8px);
          opacity: 0.35;
          z-index: -1;
        }
        .preview-card {
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          box-shadow: 0 30px 80px rgba(0,0,0,0.6);
        }
        .preview-topbar {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1.25rem;
          background: rgba(255,255,255,0.04);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .preview-dots { display: flex; gap: 6px; }
        .preview-dot {
          width: 11px; height: 11px; border-radius: 50%;
        }
        .d1 { background: #ff5f57; }
        .d2 { background: #ffbd2e; }
        .d3 { background: #28ca41; }
        .preview-url-bar {
          flex: 1;
          height: 24px;
          background: rgba(255,255,255,0.06);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          color: #64748b;
        }
        .preview-body {
          display: grid;
          grid-template-columns: 200px 1fr;
          min-height: 380px;
        }
        .preview-sidebar {
          background: rgba(255,255,255,0.02);
          border-right: 1px solid rgba(255,255,255,0.06);
          padding: 1rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .preview-sidebar-logo {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0 0.375rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 0.5rem;
        }
        .preview-sidebar-logo-icon {
          width: 24px; height: 24px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 6px;
        }
        .preview-sidebar-logo-text {
          font-size: 0.75rem; font-weight: 700; color: #e2e8f0;
        }
        .preview-nav-item {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 0.625rem;
          border-radius: 6px;
          font-size: 0.6875rem;
          color: #64748b;
        }
        .preview-nav-item.active {
          background: rgba(59,130,246,0.12);
          color: #93c5fd;
        }
        .preview-nav-dot {
          width: 8px; height: 8px; border-radius: 50%;
          flex-shrink: 0;
        }
        .preview-content {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .preview-stat-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }
        .preview-stat {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 0.875rem;
        }
        .preview-stat-val {
          font-size: 1.25rem; font-weight: 700;
          color: #f1f5f9; margin-bottom: 0.125rem;
        }
        .preview-stat-lbl {
          font-size: 0.5625rem; color: #64748b; text-transform: uppercase;
          letter-spacing: 0.06em; font-weight: 600;
        }
        .preview-table-wrap {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          overflow: hidden;
          flex: 1;
        }
        .preview-table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          padding: 0.5rem 0.875rem;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-size: 0.5625rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .preview-table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          padding: 0.5625rem 0.875rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 0.6875rem;
          color: #94a3b8;
          align-items: center;
        }
        .preview-table-row:last-child { border-bottom: none; }
        .preview-badge {
          display: inline-flex;
          padding: 1px 6px;
          border-radius: 999px;
          font-size: 0.5625rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .pb-green { background: rgba(34,197,94,0.12); color: #4ade80; }
        .pb-yellow { background: rgba(234,179,8,0.12); color: #facc15; }
        .pb-blue { background: rgba(59,130,246,0.12); color: #60a5fa; }
        .pb-red { background: rgba(239,68,68,0.12); color: #f87171; }

        /* ── Features section ─────────────────────────── */
        .features-section {
          position: relative;
          z-index: 1;
          padding: 5rem 2rem;
        }
        .section-header {
          text-align: center;
          margin-bottom: 3.5rem;
        }
        .section-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          background: rgba(139,92,246,0.12);
          border: 1px solid rgba(139,92,246,0.25);
          border-radius: 999px;
          padding: 0.25rem 0.875rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #c4b5fd;
          margin-bottom: 1.25rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .section-title {
          font-size: clamp(1.75rem, 4vw, 2.75rem);
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.75px;
          line-height: 1.2;
          margin-bottom: 1rem;
        }
        .section-desc {
          font-size: 1rem;
          color: #64748b;
          max-width: 540px;
          margin: 0 auto;
          line-height: 1.7;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          max-width: 1100px;
          margin: 0 auto;
        }
        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 1.75rem;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .feature-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(99,102,241,0.3);
          transform: translateY(-3px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.4);
        }
        .feature-card:hover::before { opacity: 1; }
        .feature-icon-wrap {
          width: 48px; height: 48px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1.125rem;
          font-size: 1.25rem;
        }
        .fi-blue { background: rgba(59,130,246,0.15); }
        .fi-purple { background: rgba(139,92,246,0.15); }
        .fi-cyan { background: rgba(6,182,212,0.15); }
        .fi-green { background: rgba(34,197,94,0.15); }
        .fi-orange { background: rgba(249,115,22,0.15); }
        .fi-pink { background: rgba(236,72,153,0.15); }
        .feature-title {
          font-size: 1rem;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 0.5rem;
        }
        .feature-desc {
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.65;
        }

        /* ── Workflow section ─────────────────────────── */
        .workflow-section {
          position: relative;
          z-index: 1;
          padding: 5rem 2rem;
        }
        .workflow-steps {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .workflow-step {
          display: flex;
          gap: 1.5rem;
          position: relative;
        }
        .workflow-step-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }
        .step-circle {
          width: 44px; height: 44px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800;
          font-size: 0.875rem;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          box-shadow: 0 0 20px rgba(37,99,235,0.4);
          flex-shrink: 0;
          z-index: 1;
        }
        .step-line {
          width: 2px;
          flex: 1;
          background: linear-gradient(to bottom, rgba(37,99,235,0.5), rgba(37,99,235,0.05));
          margin: 4px 0;
        }
        .workflow-step:last-child .step-line { display: none; }
        .workflow-step-content {
          padding: 0 0 2.5rem;
        }
        .step-title {
          font-size: 1rem;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 0.375rem;
          margin-top: 0.625rem;
        }
        .step-desc {
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.6;
        }

        /* ── Roles section ────────────────────────────── */
        .roles-section {
          position: relative;
          z-index: 1;
          padding: 5rem 2rem;
        }
        .roles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: 1.25rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        .role-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 1.5rem;
          transition: all 0.3s;
        }
        .role-card:hover {
          transform: translateY(-2px);
          border-color: rgba(99,102,241,0.2);
          background: rgba(255,255,255,0.045);
        }
        .role-icon {
          font-size: 1.75rem;
          margin-bottom: 0.875rem;
        }
        .role-name {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 0.5rem;
        }
        .role-perms {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .role-perms li {
          font-size: 0.8125rem;
          color: #64748b;
          display: flex;
          align-items: flex-start;
          gap: 0.375rem;
          line-height: 1.4;
        }
        .role-perms li::before {
          content: '→';
          color: #3b82f6;
          font-size: 0.75rem;
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* ── CTA Section ──────────────────────────────── */
        .cta-section {
          position: relative;
          z-index: 1;
          padding: 5rem 2rem 8rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .cta-card {
          max-width: 680px;
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 24px;
          padding: 4rem 3rem;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px);
        }
        .cta-glow {
          position: absolute;
          top: -100px; left: 50%;
          transform: translateX(-50%);
          width: 400px; height: 300px;
          background: radial-gradient(ellipse, rgba(99,102,241,0.2), transparent 70%);
          pointer-events: none;
        }
        .cta-h2 {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.75px;
          line-height: 1.2;
          margin-bottom: 1rem;
          position: relative;
        }
        .cta-sub {
          font-size: 1rem;
          color: #94a3b8;
          line-height: 1.65;
          margin-bottom: 2.5rem;
          position: relative;
        }
        .cta-btns {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          position: relative;
        }

        /* ── Footer ───────────────────────────────────── */
        .landing-footer {
          position: relative;
          z-index: 1;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .footer-logo {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.875rem; font-weight: 700; color: #475569;
        }
        .footer-copy {
          font-size: 0.8125rem;
          color: #334155;
        }
        .footer-tech {
          display: flex; gap: 0.5rem; flex-wrap: wrap;
        }
        .tech-chip {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #475569;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          padding: 2px 8px;
          border-radius: 999px;
          letter-spacing: 0.04em;
        }

        /* ── Animations ───────────────────────────────── */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-up-1 { animation: fadeInUp 0.6s 0.1s ease both; }
        .anim-up-2 { animation: fadeInUp 0.6s 0.2s ease both; }
        .anim-up-3 { animation: fadeInUp 0.6s 0.3s ease both; }
        .anim-up-4 { animation: fadeInUp 0.6s 0.4s ease both; }

        @media (max-width: 640px) {
          .landing-nav { padding: 1rem 1.25rem; }
          .preview-body { grid-template-columns: 1fr; }
          .preview-sidebar { display: none; }
          .preview-stat-row { grid-template-columns: 1fr 1fr; }
          .cta-card { padding: 2.5rem 1.5rem; }
        }
      `}</style>

      <div className="landing-body">
        {/* Animated background */}
        <div className="hero-bg">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className="grid-overlay" />

        {/* ── Nav ─────────────────────────────────── */}
        <nav className="landing-nav">
          <a href="/" className="nav-logo">
            <div className="nav-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 9h18M3 15h18M12 3v18M7.5 3h9a4.5 4.5 0 010 18h-9A4.5 4.5 0 017.5 3z"
                  stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="nav-logo-text">VendorBridge</span>
            <span className="nav-logo-badge">ERP</span>
          </a>
          <div className="nav-actions">
            <a href="/login" className="btn-nav-login" id="nav-login-btn">Sign In</a>
            <a href="/signup" className="btn-nav-signup" id="nav-signup-btn">Get Started →</a>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────── */}
        <section className="hero-section">
          <div className="hero-pill">
            <span className="hero-pill-dot" />
            Procurement & Vendor Management ERP
          </div>
          <h1 className="hero-h1">
            The smarter way to manage<br />
            <span className="gradient-text">procurement workflows</span>
          </h1>
          <p className="hero-sub">
            VendorBridge centralizes your entire procurement cycle — from vendor onboarding
            and RFQs to quotation comparison, approvals, purchase orders, and invoices.
          </p>
          <div className="hero-cta">
            <a href="/signup" className="btn-hero-primary" id="hero-signup-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Start for Free
            </a>
            <a href="/login" className="btn-hero-secondary" id="hero-login-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sign In
            </a>
          </div>
        </section>

        {/* Trust bar */}
        <div className="trust-bar">
          {[
            { icon: "🔐", text: "JWT Session Auth" },
            { icon: "📧", text: "Nodemailer Email" },
            { icon: "🗃️", text: "PostgreSQL + Prisma" },
            { icon: "⚡", text: "Next.js App Router" },
            { icon: "🛡️", text: "Role-Based Access Control" },
          ].map((t) => (
            <div className="trust-item" key={t.text}>
              <span>{t.icon}</span>
              <span>{t.text}</span>
            </div>
          ))}
        </div>

        {/* ── Dashboard Preview ─────────────────── */}
        <div className="preview-section">
          <div className="preview-wrapper">
            <div className="preview-glow" />
            <div className="preview-card">
              <div className="preview-topbar">
                <div className="preview-dots">
                  <div className="preview-dot d1" />
                  <div className="preview-dot d2" />
                  <div className="preview-dot d3" />
                </div>
                <div className="preview-url-bar">
                  🔒 vendorbridge.app/dashboard
                </div>
              </div>
              <div className="preview-body">
                <div className="preview-sidebar">
                  <div className="preview-sidebar-logo">
                    <div className="preview-sidebar-logo-icon" />
                    <span className="preview-sidebar-logo-text">VendorBridge</span>
                  </div>
                  {[
                    { label: "Dashboard", color: "#3b82f6", active: true },
                    { label: "Vendors", color: "#8b5cf6", active: false },
                    { label: "RFQs", color: "#06b6d4", active: false },
                    { label: "Quotations", color: "#22c55e", active: false },
                    { label: "Approvals", color: "#f59e0b", active: false },
                    { label: "Purchase Orders", color: "#f97316", active: false },
                    { label: "Invoices", color: "#ec4899", active: false },
                    { label: "Reports", color: "#64748b", active: false },
                  ].map((item) => (
                    <div key={item.label} className={`preview-nav-item${item.active ? " active" : ""}`}>
                      <div className="preview-nav-dot" style={{ background: item.color }} />
                      {item.label}
                    </div>
                  ))}
                </div>
                <div className="preview-content">
                  <div className="preview-stat-row">
                    {[
                      { val: "24", lbl: "Active RFQs", color: "#60a5fa" },
                      { val: "₹18.4L", lbl: "PO Value", color: "#a78bfa" },
                      { val: "6", lbl: "Pending Approvals", color: "#fbbf24" },
                      { val: "12", lbl: "Invoices Issued", color: "#34d399" },
                    ].map((s) => (
                      <div className="preview-stat" key={s.lbl}>
                        <div className="preview-stat-val" style={{ color: s.color }}>{s.val}</div>
                        <div className="preview-stat-lbl">{s.lbl}</div>
                      </div>
                    ))}
                  </div>
                  <div className="preview-table-wrap">
                    <div className="preview-table-header">
                      <span>RFQ Title</span>
                      <span>Vendor</span>
                      <span>Amount</span>
                      <span>Status</span>
                    </div>
                    {[
                      { title: "Laptop Procurement Q3", vendor: "TechNova", amt: "₹52.5L", status: "PAID", cls: "pb-green" },
                      { title: "Office Supplies FY26", vendor: "OfficeEdge", amt: "₹3.9L", status: "ISSUED", cls: "pb-yellow" },
                      { title: "Canteen Renovation", vendor: "BuildRight", amt: "₹8.2L", status: "FULFILLED", cls: "pb-blue" },
                      { title: "Annual Report Print", vendor: "PrintPro", amt: "₹2.1L", status: "REJECTED", cls: "pb-red" },
                      { title: "Inbound Freight Q3", vendor: "LogiTrack", amt: "₹7.4L", status: "SENT", cls: "pb-yellow" },
                    ].map((r) => (
                      <div className="preview-table-row" key={r.title}>
                        <span style={{ color: "#cbd5e1", fontWeight: 500 }}>{r.title}</span>
                        <span>{r.vendor}</span>
                        <span style={{ color: "#94a3b8" }}>{r.amt}</span>
                        <span><span className={`preview-badge ${r.cls}`}>{r.status}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Features ────────────────────────────── */}
        <section className="features-section">
          <div className="section-header">
            <div className="section-pill">✦ Platform Features</div>
            <h2 className="section-title">Everything procurement needs,<br />nothing it doesn&apos;t</h2>
            <p className="section-desc">
              A complete ERP module covering the full lifecycle from vendor onboarding to invoice payment.
            </p>
          </div>
          <div className="features-grid">
            {[
              {
                icon: "🏢", wrap: "fi-blue",
                title: "Vendor Management",
                desc: "Register vendors with GST details, contact info, and categories. Track status — Active, Pending, Suspended.",
              },
              {
                icon: "📋", wrap: "fi-purple",
                title: "RFQ Creation",
                desc: "Create structured Requests for Quotation with line items, quantities, deadlines, and vendor assignments.",
              },
              {
                icon: "💬", wrap: "fi-cyan",
                title: "Quotation Portal",
                desc: "Vendors submit itemized pricing, delivery timelines, and notes. Draft and revise before final submission.",
              },
              {
                icon: "⚖️", wrap: "fi-green",
                title: "Quotation Comparison",
                desc: "Side-by-side comparison with lowest price highlighting, delivery timeline analysis, and winner selection.",
              },
              {
                icon: "✅", wrap: "fi-orange",
                title: "Approval Workflow",
                desc: "Structured approval chain with remarks, audit trail, timeline tracking, and email notifications.",
              },
              {
                icon: "📄", wrap: "fi-pink",
                title: "PO & Invoice Generation",
                desc: "Auto-generate POs with GST calculations. Create, download PDF, print, and email invoices instantly.",
              },
              {
                icon: "📊", wrap: "fi-blue",
                title: "Reports & Analytics",
                desc: "Procurement trends, spend by category, vendor performance, and exportable CSV/Excel reports.",
              },
              {
                icon: "🔔", wrap: "fi-purple",
                title: "Activity Logs",
                desc: "Full audit trail of every action. Real-time notifications for approvals, quotations, and invoice events.",
              },
              {
                icon: "🛡️", wrap: "fi-cyan",
                title: "Role-Based Access",
                desc: "Admin, Procurement Officer, Manager Approver, and Vendor — each with scoped permissions and views.",
              },
            ].map((f) => (
              <div className="feature-card" key={f.title}>
                <div className={`feature-icon-wrap ${f.wrap}`}>{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Workflow ─────────────────────────────── */}
        <section className="workflow-section">
          <div className="section-header">
            <div className="section-pill">✦ How It Works</div>
            <h2 className="section-title">From RFQ to paid invoice<br />in one platform</h2>
          </div>
          <div className="workflow-steps">
            {[
              {
                n: "1",
                title: "Create an RFQ",
                desc: "Procurement Officer creates a Request for Quotation with line items, quantities, and assigns vendors to invite.",
              },
              {
                n: "2",
                title: "Vendors Submit Quotations",
                desc: "Invited vendors receive access to the RFQ, submit itemized pricing, delivery timelines, and payment terms.",
              },
              {
                n: "3",
                title: "Compare & Select Winner",
                desc: "The procurement team compares quotations side-by-side, highlights the best value, and selects a winning bid.",
              },
              {
                n: "4",
                title: "Request Manager Approval",
                desc: "An approval request is raised to the Manager Approver, who reviews and approves or rejects with remarks.",
              },
              {
                n: "5",
                title: "Generate Purchase Order",
                desc: "On approval, a Purchase Order is auto-generated with a unique PO number and sent to the vendor.",
              },
              {
                n: "6",
                title: "Invoice & Payment",
                desc: "Invoice is generated from the PO with GST calculations. It can be downloaded as PDF, printed, or emailed.",
              },
            ].map((s) => (
              <div className="workflow-step" key={s.n}>
                <div className="workflow-step-left">
                  <div className="step-circle">{s.n}</div>
                  <div className="step-line" />
                </div>
                <div className="workflow-step-content">
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Roles ───────────────────────────────── */}
        <section className="roles-section">
          <div className="section-header">
            <div className="section-pill">✦ User Roles</div>
            <h2 className="section-title">Purpose-built for every<br />procurement stakeholder</h2>
          </div>
          <div className="roles-grid">
            {[
              {
                icon: "👑",
                name: "Admin",
                perms: ["Manage users & vendors", "View all analytics", "Configure organization", "Full system access"],
              },
              {
                icon: "🧑‍💼",
                name: "Procurement Officer",
                perms: ["Create & manage RFQs", "Compare quotations", "Generate POs & invoices", "Track procurement"],
              },
              {
                icon: "✅",
                name: "Manager Approver",
                perms: ["Review approval requests", "Approve or reject with remarks", "Monitor workflows", "View audit timeline"],
              },
              {
                icon: "🏪",
                name: "Vendor",
                perms: ["Submit quotations", "Track RFQ invitations", "View purchase orders", "Manage vendor profile"],
              },
            ].map((r) => (
              <div className="role-card" key={r.name}>
                <div className="role-icon">{r.icon}</div>
                <div className="role-name">{r.name}</div>
                <ul className="role-perms">
                  {r.perms.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────── */}
        <section className="cta-section">
          <div className="cta-card">
            <div className="cta-glow" />
            <h2 className="cta-h2">
              Ready to modernize<br />your procurement?
            </h2>
            <p className="cta-sub">
              Get started in minutes. No credit card required.
              Full access to all features from day one.
            </p>
            <div className="cta-btns">
              <a href="/signup" className="btn-hero-primary" id="cta-signup-btn">
                Create Free Account →
              </a>
              <a href="/login" className="btn-hero-secondary" id="cta-login-btn">
                Sign In to Dashboard
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────── */}
        <footer className="landing-footer">
          <div className="footer-logo">
            <span>⬡</span>
            VendorBridge ERP
          </div>
          <span className="footer-copy">© 2025 VendorBridge. Procurement simplified.</span>
          <div className="footer-tech">
            {["Next.js 15", "PostgreSQL", "Prisma ORM", "Nodemailer", "JWT Auth"].map((t) => (
              <span className="tech-chip" key={t}>{t}</span>
            ))}
          </div>
        </footer>
      </div>
    </>
  );
}
