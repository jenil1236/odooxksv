import { getSession } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";

async function getStats() {
  const [totalUsers, totalVendors, admins] = await Promise.all([
    prisma.user.count({ where: { role: { not: Role.VENDOR } } }),
    prisma.user.count({ where: { role: Role.VENDOR } }),
    prisma.user.count({ where: { role: Role.ADMIN } }),
  ]);
  return { totalUsers, totalVendors, admins };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === Role.VENDOR) redirect("/vendor/profile");

  const stats = await getStats();

  const roleLabel: Record<string, string> = {
    ADMIN: "Admin",
    PROCUREMENT_OFFICER: "Procurement Officer",
    MANAGER_APPROVER: "Manager / Approver",
    VENDOR: "Vendor",
  };

  return (
    <>
      <div className="page-content">
        <div className="page-header">
          <p className="page-title">Overview</p>
          <p className="page-desc">Your VendorBridge procurement platform at a glance.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 14v-1a4 4 0 00-8 0v1" /><circle cx="7" cy="6" r="3" />
                <path d="M14 14v-1a3 3 0 00-2-2.83" /><path d="M11 3.13a3 3 0 010 5.74" />
              </svg>
            </div>
            <p className="stat-value">{stats.totalUsers}</p>
            <p className="stat-label">Organization Users</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="5" width="14" height="10" rx="1.5" />
                <path d="M5 5V3.5A1.5 1.5 0 016.5 2h3A1.5 1.5 0 0111 3.5V5" />
              </svg>
            </div>
            <p className="stat-value">{stats.totalVendors}</p>
            <p className="stat-label">Registered Vendors</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--green-50)", color: "#15803D" }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="7" />
                <path d="M5 8l2 2 4-4" />
              </svg>
            </div>
            <p className="stat-value">{stats.admins}</p>
            <p className="stat-label">Administrators</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <p className="card-title">Getting Started</p>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { step: "1", title: "Account created", desc: "Your admin account and organization are set up.", done: true },
                { step: "2", title: "Add team members", desc: "Go to Administration → Users to add Procurement Officers or Managers.", done: session.role === "ADMIN" },
                { step: "3", title: "Register vendors", desc: "Go to Administration → Vendors to onboard vendor partners.", done: false },
              ].map((item) => (
                <div key={item.step} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: item.done ? "var(--green-50)" : "var(--gray-100)",
                    color: item.done ? "#15803D" : "var(--gray-400)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: ".75rem", fontWeight: 700,
                  }}>
                    {item.done ? "✓" : item.step}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: ".875rem", color: "var(--gray-800)" }}>{item.title}</p>
                    <p style={{ fontSize: ".8125rem", color: "var(--gray-500)", marginTop: ".125rem" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
