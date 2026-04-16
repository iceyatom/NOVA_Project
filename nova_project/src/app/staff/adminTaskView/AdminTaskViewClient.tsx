"use client";

import { useMemo, useState } from "react";
import AdminTaskCard, { EmployeeTask } from "@/app/components/AdminTaskCard";
import { statusPriority } from "@/app/lib/taskStatus";

export type EmployeeTaskGroup = {
  accountId: number;
  employeeName: string;
  employeePosition: string;
  tasks: EmployeeTask[];
};

export default function AdminTaskViewClient({
  taskGroups,
}: {
  taskGroups: EmployeeTaskGroup[];
}) {
  const allTaskIds = useMemo(
    () => taskGroups.flatMap((group) => group.tasks.map((task) => task.id)),
    [taskGroups],
  );

  const [collapsedTaskIds, setCollapsedTaskIds] =
    useState<number[]>(allTaskIds);

  const sortedTaskGroups = useMemo(() => {
    return taskGroups.map((group) => ({
      ...group,
      tasks: [...group.tasks].sort(
        (a, b) => statusPriority(a) - statusPriority(b),
      ),
    }));
  }, [taskGroups]);

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
        currentIds.includes(taskId),
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

  const allTasks = useMemo(
    () => sortedTaskGroups.flatMap((group) => group.tasks),
    [sortedTaskGroups],
  );

  const areAllCollapsed =
    allTaskIds.length > 0 && collapsedTaskIds.length === allTaskIds.length;

  return (
    <div>
      <div className="staffTitle">Employee Task Monitor</div>
      <div className="staffSubtitle">
        Admin-only view for monitoring employee task progress, deadlines, and
        completion states.
      </div>

      <div className="staffTaskSummaryRow">
        <div className="staffCard staffTaskSummaryCard">
          <div className="staffCardLabel">Total Tasks</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {allTasks.length}
          </div>
          <div className="staffCardHint">Tasks assigned in total.</div>
        </div>

        <div className="staffCard staffTaskSummaryCard">
          <div className="staffCardLabel">Late</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {
              allTasks.filter(
                (task) =>
                  task.currentStatus !== "completed" &&
                  new Date(task.expiresAt.replace("-", "")) < new Date(),
              ).length
            }
          </div>
          <div className="staffCardHint">Tasks past deadline.</div>
        </div>

        <div className="staffCard staffTaskSummaryCard">
          <div className="staffCardLabel">Not Started</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {
              allTasks.filter((task) => task.currentStatus === "not-started")
                .length
            }
          </div>
          <div className="staffCardHint">Tasks not yet started.</div>
        </div>

        <div className="staffCard staffTaskSummaryCard">
          <div className="staffCardLabel">In Progress</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {
              allTasks.filter((task) => task.currentStatus === "in-progress")
                .length
            }
          </div>
          <div className="staffCardHint">Tasks currently in progress.</div>
        </div>

        <div className="staffCard staffTaskSummaryCard">
          <div className="staffCardLabel">Completed</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {
              allTasks.filter((task) => task.currentStatus === "completed")
                .length
            }
          </div>
          <div className="staffCardHint">Tasks marked complete.</div>
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
          disabled={allTaskIds.length === 0}
        >
          <span
            className={`staffActionButtonIcon ${
              areAllCollapsed ? "collapsed" : ""
            }`}
          >
            ▼
          </span>
          {areAllCollapsed ? "Expand All" : "Collapse All"}
        </button>
      </div>

      <div className="staffTaskGroups">
        {sortedTaskGroups.map((group) => {
          const employeeTaskIds = group.tasks.map((task) => task.id);
          const areEmployeeTasksCollapsed =
            employeeTaskIds.length > 0 &&
            employeeTaskIds.every((taskId) =>
              collapsedTaskIds.includes(taskId),
            );

          return (
            <div key={group.accountId} className="staffEmployeeGroup">
              <div className="staffEmployeeGroupHeader">
                <div>
                  <div className="staffEmployeeGroupTitle">
                    {group.employeeName}
                  </div>
                  <div className="staffEmployeeGroupSubtitle">
                    {group.employeePosition}
                  </div>
                </div>

                <button
                  type="button"
                  className="staffActionButton employeeSectionButton"
                  onClick={() => toggleEmployeeCollapse(employeeTaskIds)}
                  disabled={employeeTaskIds.length === 0}
                >
                  <span
                    className={`staffActionButtonIcon ${
                      areEmployeeTasksCollapsed ? "collapsed" : ""
                    }`}
                  >
                    ▼
                  </span>
                  {areEmployeeTasksCollapsed
                    ? "Expand Section"
                    : "Collapse Section"}
                </button>
              </div>

              {group.tasks.length === 0 ? (
                <div className="staffCardHint">No tasks assigned.</div>
              ) : (
                <div className="staffEmployeeTaskGrid">
                  {group.tasks.map((task) => (
                    <AdminTaskCard
                      key={task.id}
                      task={task}
                      isCollapsed={collapsedTaskIds.includes(task.id)}
                      onToggleCollapse={() => toggleTaskCollapse(task.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
