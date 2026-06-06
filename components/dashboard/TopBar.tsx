"use client";
import { usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/rfqs": "Requests for Quotation",
  "/rfqs/create": "Create RFQ",
  "/admin/users": "Users",
  "/admin/vendors": "Vendors",
  "/admin/categories": "Categories",
  "/admin/logs": "Audit Logs",
  "/vendor/dashboard": "Vendor Dashboard",
  "/vendor/rfqs": "Assigned RFQs",
  "/vendor/quotations": "My Quotations",
  "/vendor/profile": "My Profile",
};

function getTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/rfqs/") && pathname.endsWith("/edit")) return "Edit RFQ";
  if (pathname.startsWith("/rfqs/") && pathname.includes("/quotation")) return "Submit Quotation";
  if (pathname.startsWith("/rfqs/")) return "RFQ Details";
  if (pathname.startsWith("/vendor/rfqs/") && pathname.includes("/quotation")) return "Submit Quotation";
  if (pathname.startsWith("/vendor/rfqs/")) return "RFQ Details";
  return "VendorBridge";
}

export default function TopBar({ user }: { user?: { name: string; role: string } }) {
  const pathname = usePathname();

  const roleLabel: Record<string, string> = {
    ADMIN: "Admin",
    PROCUREMENT_OFFICER: "Procurement Officer",
    MANAGER_APPROVER: "Manager / Approver",
    VENDOR: "Vendor",
  };

  return (
    <header className="topbar">
      <span className="topbar-title">{getTitle(pathname)}</span>
      <div className="topbar-actions" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {user && (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: ".8125rem", color: "var(--gray-500)" }}>
              Welcome back, <strong style={{ color: "var(--gray-800)" }}>{user.name}</strong>
            </span>
            <span className={`badge role-${user.role}`}>
              {roleLabel[user.role] ?? user.role}
            </span>
          </div>
        )}
        <NotificationBell />
      </div>
    </header>
  );
}
