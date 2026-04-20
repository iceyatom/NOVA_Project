"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useLoginStatus } from "../LoginStatusContext";
import SidebarNav from "./dashboard/SidebarNav";
import "./dashboard/staff-dashboard.css";

export default function StaffShell({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarLocked, setIsMobileSidebarLocked] = useState(false);
  const { userRole } = useLoginStatus();
  const normalizedRole = userRole.trim().toUpperCase();
  const dashboardBadgeLabel = normalizedRole === "ADMIN" ? "ADMIN" : "STAFF";

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 720px)");

    const syncMobileLockState = (isMobile: boolean) => {
      setIsMobileSidebarLocked(isMobile);
      if (isMobile) {
        setIsSidebarCollapsed(false);
      }
    };

    syncMobileLockState(mobileQuery.matches);
    const onChange = (event: MediaQueryListEvent) => {
      syncMobileLockState(event.matches);
    };

    mobileQuery.addEventListener("change", onChange);
    return () => {
      mobileQuery.removeEventListener("change", onChange);
    };
  }, []);

  const handleToggleSidebar = () => {
    if (isMobileSidebarLocked) {
      return;
    }

    setIsSidebarCollapsed((prev) => !prev);
  };

  const toggleLabel = isSidebarCollapsed
    ? "Expand staff navigation"
    : "Collapse staff navigation";

  return (
    <div
      className={`staffShell ${
        isSidebarCollapsed ? "staffShell--sidebarCollapsed" : ""
      }`}
    >
      <aside
        id="staff-sidebar"
        className={`staffSidebar ${
          isSidebarCollapsed ? "staffSidebar--collapsed" : ""
        }`}
        aria-label="Staff dashboard navigation"
        aria-hidden={isSidebarCollapsed}
      >
        <div className="staffSidebarHeader">
          <div className="staffSidebarHeaderTop">
            {!isMobileSidebarLocked ? (
              <button
                type="button"
                className="staffSidebarToggle"
                onClick={handleToggleSidebar}
                aria-label={toggleLabel}
                aria-controls="staff-sidebar"
                aria-expanded={!isSidebarCollapsed}
              >
                <span className="staffSidebarToggleIcon" aria-hidden="true">
                  <PanelLeftClose size={16} strokeWidth={2} />
                </span>
              </button>
            ) : null}
            <div className="staffBadge">{dashboardBadgeLabel}</div>
          </div>
          <div className="staffSidebarTitle">Dashboard</div>
        </div>

        <SidebarNav />
      </aside>

      <main className="staffMain" role="main">
        <div className="staffMainInner">
          {isSidebarCollapsed && !isMobileSidebarLocked ? (
            <div className="staffMainToggleRow">
              <button
                type="button"
                className="staffSidebarToggle staffSidebarToggle--collapsed"
                onClick={handleToggleSidebar}
                aria-label={toggleLabel}
                aria-controls="staff-sidebar"
                aria-expanded={!isSidebarCollapsed}
              >
                <span className="staffSidebarToggleIcon" aria-hidden="true">
                  <PanelLeftOpen size={16} strokeWidth={2} />
                </span>
              </button>
            </div>
          ) : null}

          {children}
        </div>
      </main>
    </div>
  );
}
