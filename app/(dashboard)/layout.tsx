import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { getSession } from "@/lib/jwt";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const user = session ? {
    name: session.firstName || session.email.split("@")[0],
    role: session.role
  } : undefined;

  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="dashboard-main">
        <TopBar user={user} />
        {children}
      </main>
    </div>
  );
}
