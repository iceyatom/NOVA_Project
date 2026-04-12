"use client";

import { useMemo, useState } from "react";
import AdminTaskCard, { EmployeeTask, TaskStatus } from "@/app/components/AdminTaskCard";

const mockTasks: EmployeeTask[] = [
  {
    id: 1,
    title: "Review frog specimen stock",
    description:
      "Review the frog specimen shelf counts, compare them to the internal inventory sheet, and note any differences that may require recounting or adjustment before the next shipment cycle.",
    assignedToAccountId: 101,
    employeeName: "Sarah Chen",
    employeePosition: "Inventory Specialist",
    createdAt: "Apr 5, 2026 - 8:30 AM",
    completedAt: "Apr 6, 2026 - 1:42 PM",
    expiresAt: "Apr 6, 2026 - 3:00 PM",
    currentStatus: "completed",
  },
  {
    id: 2,
    title: "Organize cold storage labels",
    description:
      "Replace old storage labels in cold storage, verify readability, and align shelf naming with the updated category naming convention used by staff inventory records.",
    assignedToAccountId: 101,
    employeeName: "Sarah Chen",
    employeePosition: "Inventory Specialist",
    createdAt: "Apr 6, 2026 - 9:10 AM",
    expiresAt: "Apr 7, 2026 - 11:30 AM",
    currentStatus: "in-progress",
  },
  {
    id: 3,
    title: "Count preserved specimen jars",
    description:
      "Count all preserved specimen jars in storage, compare against the latest shelf report, and flag any missing, damaged, or untagged containers for review.",
    assignedToAccountId: 101,
    employeeName: "Sarah Chen",
    employeePosition: "Inventory Specialist",
    createdAt: "Apr 4, 2026 - 8:00 AM",
    expiresAt: "Apr 12, 2026 - 4:00 PM",
    currentStatus: "not-started",
  },
  {
    id: 4,
    title: "Update aisle inventory labels",
    description:
      "Replace outdated aisle labels, verify category naming consistency, and ensure all shelf markers match the updated storage map used by the inventory team.",
    assignedToAccountId: 101,
    employeeName: "Sarah Chen",
    employeePosition: "Inventory Specialist",
    createdAt: "Apr 6, 2026 - 1:10 PM",
    expiresAt: "Apr 7, 2026 - 4:30 PM",
    currentStatus: "not-started",
  },
  {
    id: 5,
    title: "Package pending biology kits",
    description:
      "Prepare all pending classroom biology kit orders, confirm contents match the printed packing list, and stage the completed packages for outgoing shipment review.",
    assignedToAccountId: 204,
    employeeName: "Marcus Rivera",
    employeePosition: "Shipping Coordinator",
    createdAt: "Apr 4, 2026 - 10:00 AM",
    expiresAt: "Apr 5, 2026 - 4:00 PM",
    currentStatus: "not-started",
  },
  {
    id: 6,
    title: "Inspect outgoing order paperwork",
    description:
      "Check invoices, shipping slips, and order references for the outgoing orders scheduled for pickup today and flag any mismatches for admin review.",
    assignedToAccountId: 204,
    employeeName: "Marcus Rivera",
    employeePosition: "Shipping Coordinator",
    createdAt: "Apr 6, 2026 - 7:45 AM",
    expiresAt: "Apr 6, 2026 - 5:00 PM",
    currentStatus: "not-started",
  },
  {
    id: 7,
    title: "Verify overnight shipment labels",
    description:
      "Review all overnight shipment labels for correct recipient information, verify hazardous handling notes if needed, and separate any packages with damaged paperwork.",
    assignedToAccountId: 204,
    employeeName: "Marcus Rivera",
    employeePosition: "Shipping Coordinator",
    createdAt: "Apr 6, 2026 - 9:00 AM",
    expiresAt: "Apr 6, 2026 - 6:30 PM",
    currentStatus: "in-progress",
  },
  {
    id: 8,
    title: "Confirm delivery pickup window",
    description:
      "Call the carrier, confirm today’s pickup window, note any timing changes, and update the outbound preparation checklist for the afternoon shipment batch.",
    assignedToAccountId: 204,
    employeeName: "Marcus Rivera",
    employeePosition: "Shipping Coordinator",
    createdAt: "Apr 5, 2026 - 11:20 AM",
    completedAt: "Apr 5, 2026 - 1:10 PM",
    expiresAt: "Apr 5, 2026 - 2:30 PM",
    currentStatus: "completed",
  },
  {
    id: 9,
    title: "Clean and restage dissecting trays",
    description:
      "Clean, dry, and restage dissecting trays for the next instructional batch, ensuring tools are sorted properly and damaged trays are separated for replacement review.",
    assignedToAccountId: 309,
    employeeName: "Emily Watson",
    employeePosition: "Lab Support Assistant",
    createdAt: "Apr 6, 2026 - 8:00 AM",
    completedAt: "Apr 6, 2026 - 12:18 PM",
    expiresAt: "Apr 6, 2026 - 2:00 PM",
    currentStatus: "completed",
  },
  {
    id: 10,
    title: "Restock preservation supplies",
    description:
      "Check preservation solution inventory, compare on-hand stock against reorder thresholds, and move backup containers into the main prep area as needed.",
    assignedToAccountId: 309,
    employeeName: "Emily Watson",
    employeePosition: "Lab Support Assistant",
    createdAt: "Apr 6, 2026 - 11:15 AM",
    expiresAt: "Apr 7, 2026 - 1:00 PM",
    currentStatus: "in-progress",
  },
  {
    id: 11,
    title: "Inspect classroom specimen carts",
    description:
      "Inspect specimen carts used for classroom prep, verify tray placement, note missing items, and report any carts that need repairs before the next lab day.",
    assignedToAccountId: 309,
    employeeName: "Emily Watson",
    employeePosition: "Lab Support Assistant",
    createdAt: "Apr 5, 2026 - 2:00 PM",
    expiresAt: "Apr 6, 2026 - 9:30 AM",
    currentStatus: "not-started",
  },
  {
    id: 12,
    title: "Prepare replacement tool bins",
    description:
      "Prepare replacement bins containing commonly requested lab tools, label each bin by station type, and place them in the prep room for quick access.",
    assignedToAccountId: 309,
    employeeName: "Emily Watson",
    employeePosition: "Lab Support Assistant",
    createdAt: "Apr 6, 2026 - 3:15 PM",
    expiresAt: "Apr 7, 2026 - 10:00 AM",
    currentStatus: "not-started",
  },
  {
    id: 13,
    title: "Audit shelf B3 stock",
    description:
      "Audit all items on shelf B3, verify quantities against the warehouse sheet, and separate any damaged or unlabeled units for further review.",
    assignedToAccountId: 412,
    employeeName: "Daniel Brooks",
    employeePosition: "Warehouse Associate",
    createdAt: "Apr 6, 2026 - 8:25 AM",
    expiresAt: "Apr 6, 2026 - 3:45 PM",
    currentStatus: "in-progress",
  },
  {
    id: 14,
    title: "Move incoming boxes to cold storage",
    description:
      "Move all incoming temperature-sensitive boxes to cold storage, confirm correct placement, and update receiving notes with rack positions.",
    assignedToAccountId: 412,
    employeeName: "Daniel Brooks",
    employeePosition: "Warehouse Associate",
    createdAt: "Apr 6, 2026 - 7:15 AM",
    completedAt: "Apr 6, 2026 - 10:05 AM",
    expiresAt: "Apr 6, 2026 - 11:00 AM",
    currentStatus: "completed",
  },
  {
    id: 15,
    title: "Check packing material inventory",
    description:
      "Check the remaining quantities of foam inserts, tape rolls, insulated sleeves, and boxes, then note which materials are nearing reorder levels.",
    assignedToAccountId: 412,
    employeeName: "Daniel Brooks",
    employeePosition: "Warehouse Associate",
    createdAt: "Apr 6, 2026 - 12:40 PM",
    expiresAt: "Apr 7, 2026 - 9:00 AM",
    currentStatus: "not-started",
  },
  {
    id: 16,
    title: "Remove damaged outer cartons",
    description:
      "Remove damaged cartons from the receiving area, inspect contents for transfer if safe, and document carton condition before disposal.",
    assignedToAccountId: 412,
    employeeName: "Daniel Brooks",
    employeePosition: "Warehouse Associate",
    createdAt: "Apr 5, 2026 - 1:35 PM",
    expiresAt: "Apr 5, 2026 - 5:00 PM",
    currentStatus: "not-started",
  },
  {
    id: 17,
    title: "Task 17",
    description:
      "Review the frog specimen shelf counts, compare them to the internal inventory sheet, and note any differences that may require recounting or adjustment before the next shipment cycle.",
    assignedToAccountId: 101,
    employeeName: "Sarah Chen",
    employeePosition: "Inventory Specialist",
    createdAt: "Apr 5, 2026 - 8:30 AM",
    completedAt: "Apr 6, 2026 - 1:42 PM",
    expiresAt: "Apr 12, 2026 - 3:00 PM",
    currentStatus: "in-progress",
  },
  {
    id: 18,
    title: "Task 18",
    description:
      "Review the frog specimen shelf counts, compare them to the internal inventory sheet, and note any differences that may require recounting or adjustment before the next shipment cycle.",
    assignedToAccountId: 101,
    employeeName: "Sarah Chen",
    employeePosition: "Inventory Specialist",
    createdAt: "Apr 5, 2026 - 8:30 AM",
    completedAt: "Apr 6, 2026 - 1:42 PM",
    expiresAt: "Apr 12, 2026 - 3:00 PM",
    currentStatus: "completed",
  },
];

export function statusPriority(task: EmployeeTask) {
  if (new Date(task.expiresAt.replace("-", "")) < new Date()) {
    switch (task.currentStatus) {
      case "not-started":
        return 0;
      case "in-progress":
        return 1;
      case "completed":
        return 5;
    }
  } else {
    switch (task.currentStatus) {
      case "not-started":
        return 2;
      case "in-progress":
        return 3;
      case "completed":
        return 4;
    }
  }
};

function getCompletionStateLabel(task: EmployeeTask) {
  return task.currentStatus === "completed" ? "Completed" : "Not Completed";
}

export default function StaffTaskViewPage() {
  const allTaskIds = useMemo(() => mockTasks.map((task) => task.id), []);

  const [collapsedTaskIds, setCollapsedTaskIds] =
    useState<number[]>(allTaskIds);

  const groupedTasks = useMemo(() => {
    const sortedTasks = [...mockTasks].sort((a, b) => {
      return statusPriority(a) - statusPriority(b);
    });

    const grouped = sortedTasks.reduce<Record<string, EmployeeTask[]>>(
      (acc, task) => {
        if (!acc[task.employeeName]) {
          acc[task.employeeName] = [];
        }

        acc[task.employeeName].push(task);
        return acc;
      },
      {}
    );

    return Object.entries(grouped);
  }, []);

  function toggleTaskCollapse(taskId: number) {
    setCollapsedTaskIds((currentIds) => {
      if (currentIds.includes(taskId)) {
        return currentIds.filter((id) => id !== taskId);
      }

      return [...currentIds, taskId];
    });
  }

  function toggleCollapseAll() {
    setCollapsedTaskIds((currentIds) => {
      const areAllCollapsed = currentIds.length === allTaskIds.length;

      if (areAllCollapsed) {
        return [];
      }

      return allTaskIds;
    });
  }

  function toggleEmployeeCollapse(taskIds: number[]) {
    setCollapsedTaskIds((currentIds) => {
      const areAllEmployeeTasksCollapsed = taskIds.every((taskId) =>
        currentIds.includes(taskId)
      );

      if (areAllEmployeeTasksCollapsed) {
        return currentIds.filter((id) => !taskIds.includes(id));
      }

      const nextIds = new Set(currentIds);

      taskIds.forEach((taskId) => {
        nextIds.add(taskId);
      });

      return Array.from(nextIds);
    });
  }

  const areAllCollapsed = collapsedTaskIds.length === allTaskIds.length;

  return (
    <div>
      <div className="staffTitle">Employee Task Monitor</div>
      <div className="staffSubtitle">
        Admin-only view for monitoring employee task progress, deadlines, and
        completion states.
      </div>

      <div className="staffTaskSummaryRow">
        <div className="staffCard col4">
          <div className="staffCardLabel">Total Tasks</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {mockTasks.length}
          </div>
          <div className="staffCardHint">Tasks assigned in total.</div>
        </div>

        <div className="staffCard col4">
          <div className="staffCardLabel">Completed</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {mockTasks.filter((task) => task.currentStatus === "completed").length}
          </div>
          <div className="staffCardHint">Tasks marked complete.</div>
        </div>

        <div className="staffCard col4">
          <div className="staffCardLabel">Late</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {mockTasks.filter((task) => (!(task.currentStatus === "completed") && new Date(task.expiresAt.replace("-", "")) < new Date())).length}
          </div>
          <div className="staffCardHint">Tasks not completed and past deadline.</div>
        </div>
      </div>

      <div className="staffTaskLegendRow">
        <div className="staffTaskLegend compact">
          <div className="staffTaskLegendItem">
            <span className="staffTaskLegendSwatch expired" />
            Late
          </div>

          <div className="staffTaskLegendItem">
            <span className="staffTaskLegendSwatch not-started" />
            Not Started
          </div>

          <div className="staffTaskLegendItem">
            <span className="staffTaskLegendSwatch in-progress" />
            In Progress
          </div>

          <div className="staffTaskLegendItem">
            <span className="staffTaskLegendSwatch completed" />
            Completed
          </div>
        </div>

        <button
          type="button"
          className="staffActionButton"
          onClick={toggleCollapseAll}
        >
          <span
            className={`staffActionButtonIcon ${areAllCollapsed ? "collapsed" : ""
              }`}
          >
            ▾
          </span>
          {areAllCollapsed ? "Expand All" : "Collapse All"}
        </button>
      </div>

      <div className="staffTaskGroups">
        {groupedTasks.map(([employeeName, tasks]) => {
          const employeeTaskIds = tasks.map((task) => task.id);
          const areEmployeeTasksCollapsed = employeeTaskIds.every((taskId) =>
            collapsedTaskIds.includes(taskId)
          );

          return (
            <div key={employeeName} className="staffEmployeeGroup">
              <div className="staffEmployeeGroupHeader">
                <div>
                  <div className="staffEmployeeGroupTitle">{employeeName}</div>
                  <div className="staffEmployeeGroupSubtitle">
                    {tasks[0].employeePosition}
                  </div>
                </div>

                <button
                  type="button"
                  className="staffActionButton employeeSectionButton"
                  onClick={() => toggleEmployeeCollapse(employeeTaskIds)}
                >
                  <span
                    className={`staffActionButtonIcon ${areEmployeeTasksCollapsed ? "collapsed" : ""
                      }`}
                  >
                    ▾
                  </span>
                  {areEmployeeTasksCollapsed
                    ? "Expand Section"
                    : "Collapse Section"}
                </button>
              </div>

              <div className="staffEmployeeTaskGrid">
                {tasks.map((task) => (
                  <AdminTaskCard
                    key={task.id}
                    task={task}
                    isCollapsed={collapsedTaskIds.includes(task.id)}
                    onToggleCollapse={() => toggleTaskCollapse(task.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}