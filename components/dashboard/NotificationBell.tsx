"use client";
import { useState, useEffect, useRef } from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

function BellIcon({ unread }: { unread: number }) {
  return (
    <div style={{ position: "relative" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 && (
        <span style={{
          position: "absolute", top: -5, right: -5,
          background: "#EF4444", color: "white",
          borderRadius: "999px", fontSize: "0.625rem", fontWeight: 700,
          minWidth: 16, height: 16, display: "flex", alignItems: "center",
          justifyContent: "center", padding: "0 3px", lineHeight: 1,
        }}>
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=8");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PUT" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        id="notification-bell-btn"
        onClick={() => { setOpen((o) => !o); fetchNotifications(); }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--gray-500)", padding: "6px", borderRadius: "var(--radius)",
          display: "flex", alignItems: "center",
          transition: "background .15s",
        }}
        title="Notifications"
      >
        <BellIcon unread={unreadCount} />
      </button>

      {open && (
        <div className="notif-dropdown" style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "white", border: "1px solid var(--gray-200)",
          borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)",
          width: 340, zIndex: 200, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "0.875rem 1rem", borderBottom: "1px solid var(--gray-100)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--gray-800)" }}>
              Notifications {unreadCount > 0 && (
                <span style={{
                  marginLeft: 6, background: "var(--blue-600)", color: "white",
                  borderRadius: 999, fontSize: "0.65rem", padding: "1px 7px", fontWeight: 700,
                }}>{unreadCount}</span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{ background: "none", border: "none", cursor: "pointer",
                  color: "var(--blue-600)", fontSize: "0.78rem", fontWeight: 500 }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--gray-400)", fontSize: "0.85rem" }}>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid var(--gray-100)",
                    background: n.read ? "white" : "var(--blue-50)",
                    cursor: n.read ? "default" : "pointer",
                    transition: "background .15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: n.read ? 500 : 600, fontSize: "0.8125rem", color: "var(--gray-800)" }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--gray-400)", whiteSpace: "nowrap" }}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--gray-500)", margin: 0, lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                  {!n.read && (
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: "var(--blue-600)", float: "right", marginTop: -14,
                    }} />
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div style={{
              padding: "0.625rem 1rem", borderTop: "1px solid var(--gray-100)",
              textAlign: "center",
            }}>
              <span style={{ fontSize: "0.78rem", color: "var(--gray-400)" }}>
                Showing last {notifications.length} notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
