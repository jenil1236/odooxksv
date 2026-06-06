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

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
];
const adminItems = [
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/vendors", label: "Vendors", icon: "briefcase" },
];

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
    logout: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 14H2a1 1 0 01-1-1V3a1 1 0 011-1h4" />
        <polyline points="11,11 15,8 11,5" /><line x1="15" y1="8" x2="6" y2="8" />
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

      <p className="sidebar-section-label">Main</p>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link${pathname === item.href ? " active" : ""}`}
          >
            <Icon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>

      {user?.role === "ADMIN" && (
        <>
          <p className="sidebar-section-label" style={{ marginTop: ".75rem" }}>Administration</p>
          <nav className="sidebar-nav" aria-label="Admin navigation">
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link${pathname.startsWith(item.href) ? " active" : ""}`}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            ))}
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
