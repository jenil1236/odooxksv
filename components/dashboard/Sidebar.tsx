"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  PROCUREMENT_OFFICER: "Procurement Officer",
  MANAGER_APPROVER: "Manager / Approver",
  VENDOR: "Vendor",
};

function Icon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    grid: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" />
        <rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    ),
    users: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 14v-1a4 4 0 00-8 0v1" /><circle cx="7" cy="6" r="3" />
        <path d="M14 14v-1a3 3 0 00-2-2.83" /><path d="M11 3.13a3 3 0 010 5.74" />
      </svg>
    ),
    briefcase: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="5" width="14" height="10" rx="1.5" />
        <path d="M5 5V3.5A1.5 1.5 0 016.5 2h3A1.5 1.5 0 0111 3.5V5" />
      </svg>
    ),
    folder: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 11.5A1.5 1.5 0 0112.5 13h-9A1.5 1.5 0 012 11.5v-7A1.5 1.5 0 013.5 3h3a1.5 1.5 0 011 .5L9 5h3.5A1.5 1.5 0 0114 6.5v5z" />
      </svg>
    ),
    activity: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1.5 8.5h3L6 4l2.5 8 1.5-4h4.5" />
      </svg>
    ),
    profile: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 14c0-2.21-1.79-4-4-4s-4 1.79-4 4" />
        <circle cx="8" cy="5" r="3" />
      </svg>
    ),
    logout: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 14H2a1 1 0 01-1-1V3a1 1 0 011-1h4" />
        <polyline points="11,11 15,8 11,5" /><line x1="15" y1="8" x2="6" y2="8" />
      </svg>
    ),
    rfq: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="1" width="12" height="14" rx="1.5" />
        <path d="M5 5h6M5 8h6M5 11h4" />
      </svg>
    ),
    quotation: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="14" height="10" rx="1.5" />
        <path d="M1 6h14" />
        <path d="M5 9.5h6M5 11.5h4" />
      </svg>
    ),
    checkCircle: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 8A6 6 0 112 8a6 6 0 0112 0z" />
        <path d="M5.5 8.5L7 10l3.5-3.5" />
      </svg>
    ),
    fileText: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2h-6a1.5 1.5 0 00-1.5 1.5v9A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5v-7L9.5 2z" />
        <path d="M9.5 2v4.5h4.5" />
        <path d="M5 9h6M5 11.5h4" />
      </svg>
    ),
    receipt: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 2v12l2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5V2z" />
        <path d="M5 6h6M5 8.5h4" />
      </svg>
    ),
    barChart: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="9" width="3" height="5" rx="0.5" />
        <rect x="6" y="5" width="3" height="9" rx="0.5" />
        <rect x="11" y="2" width="3" height="12" rx="0.5" />
      </svg>
    ),
  };
  return <>{icons[name] ?? null}</>;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "…";

  const isVendor = user?.role === "VENDOR";
  const isAdmin = user?.role === "ADMIN";
  const isProcurement = user?.role === "PROCUREMENT_OFFICER";
  const isManager = user?.role === "MANAGER_APPROVER";

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="7" fill="#2563EB" />
          <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <div className="sidebar-logo-text">VendorBridge</div>
        </div>
      </div>

      {/* ── Vendor Navigation ─────────────── */}
      {isVendor && (
        <>
          <p className="sidebar-section-label">Vendor Portal</p>
          <nav className="sidebar-nav" aria-label="Vendor navigation">
            <Link href="/vendor/dashboard" className={`sidebar-link${pathname === "/vendor/dashboard" ? " active" : ""}`}>
              <Icon name="grid" /> Dashboard
            </Link>
            <Link href="/vendor/rfqs" className={`sidebar-link${pathname.startsWith("/vendor/rfqs") ? " active" : ""}`}>
              <Icon name="rfq" /> Assigned RFQs
            </Link>
            <Link href="/vendor/quotations" className={`sidebar-link${pathname.startsWith("/vendor/quotations") ? " active" : ""}`}>
              <Icon name="quotation" /> My Quotations
            </Link>
            <Link href="/vendor/profile" className={`sidebar-link${pathname === "/vendor/profile" ? " active" : ""}`}>
              <Icon name="profile" /> My Profile
            </Link>
          </nav>
        </>
      )}

      {/* ── Internal User Navigation ───────── */}
      {!isVendor && (
        <>
          <p className="sidebar-section-label">Main</p>
          <nav className="sidebar-nav" aria-label="Main navigation">
            <Link href="/dashboard" className={`sidebar-link${pathname === "/dashboard" ? " active" : ""}`}>
              <Icon name="grid" /> Dashboard
            </Link>
          </nav>
        </>
      )}

      {/* ── Procurement Section ─────────────── */}
      {(isProcurement || isManager || isAdmin) && (
        <>
          <p className="sidebar-section-label" style={{ marginTop: ".75rem" }}>Procurement</p>
          <nav className="sidebar-nav" aria-label="Procurement navigation">
            <Link href="/rfqs" className={`sidebar-link${pathname.startsWith("/rfqs") ? " active" : ""}`}>
              <Icon name="rfq" /> RFQs
            </Link>
            <Link href="/approvals" className={`sidebar-link${pathname.startsWith("/approvals") ? " active" : ""}`}>
              <Icon name="checkCircle" /> Approvals
            </Link>
            <Link href="/purchase-orders" className={`sidebar-link${pathname.startsWith("/purchase-orders") ? " active" : ""}`}>
              <Icon name="fileText" /> Purchase Orders
            </Link>
            <Link href="/invoices" className={`sidebar-link${pathname.startsWith("/invoices") ? " active" : ""}`}>
              <Icon name="receipt" /> Invoices
            </Link>
            <Link href="/reports" className={`sidebar-link${pathname.startsWith("/reports") ? " active" : ""}`}>
              <Icon name="barChart" /> Reports
            </Link>
          </nav>
        </>
      )}

      {/* ── Admin Section ───────────────────── */}
      {isAdmin && (
        <>
          <p className="sidebar-section-label" style={{ marginTop: ".75rem" }}>Administration</p>
          <nav className="sidebar-nav" aria-label="Admin navigation">
            <Link href="/admin/users" className={`sidebar-link${pathname.startsWith("/admin/users") ? " active" : ""}`}>
              <Icon name="users" /> Users
            </Link>
            <Link href="/admin/vendors" className={`sidebar-link${pathname.startsWith("/admin/vendors") ? " active" : ""}`}>
              <Icon name="briefcase" /> Vendors
            </Link>
            <Link href="/admin/categories" className={`sidebar-link${pathname.startsWith("/admin/categories") ? " active" : ""}`}>
              <Icon name="folder" /> Categories
            </Link>
            <Link href="/admin/logs" className={`sidebar-link${pathname.startsWith("/admin/logs") ? " active" : ""}`}>
              <Icon name="activity" /> Audit Logs
            </Link>
          </nav>
        </>
      )}

      <div className="sidebar-footer">
        <div className="sidebar-avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sidebar-user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user ? `${user.firstName} ${user.lastName}` : "Loading…"}
          </div>
          <div className="sidebar-user-role">{user ? roleLabel[user.role] ?? user.role : ""}</div>
        </div>
        <button
          id="sidebar-logout"
          onClick={logout}
          title="Sign out"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", padding: "4px", borderRadius: "var(--radius-sm)" }}
        >
          <Icon name="logout" />
        </button>
      </div>
    </aside>
  );
}
