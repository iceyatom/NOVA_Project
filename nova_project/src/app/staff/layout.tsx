import type { ReactNode } from "react";
import Link from "next/link";
import SidebarNav from "./dashboard/SidebarNav";
import "./dashboard/staff-dashboard.css";

export default function StaffDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="staffShell">
      <aside className="staffSidebar" aria-label="Staff dashboard navigation">
        <div className="staffSidebarHeader">
          <div className="staffBadge">STAFF</div>
          <div className="staffSidebarTitle">Dashboard</div>

          <Link className="staffSidebarBackLink" href="/staff">
            ← Back to Staff Dev Hub
          </Link>
        </div>

        <SidebarNav />
      </aside>

      <main className="staffMain" role="main">
        <div className="staffMainInner">{children}</div>
      </main>
    </div>
  );
}
