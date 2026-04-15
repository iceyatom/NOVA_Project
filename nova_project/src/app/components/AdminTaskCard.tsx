import { useState } from "react";

export type TaskStatus = "not-started" | "in-progress" | "completed";

export function stringToTaskStatus(status: string): TaskStatus {
  switch (status) {
    case "not-started":
      return "not-started";
    case "in-progress":
      return "in-progress";
    case "completed":
      return "completed";
    default:
      throw new Error(`Invalid status: ${status}`);
  }
}

export type EmployeeTask = {
  id: number;
  title: string;
  description: string;
  assignedToAccountId: number;
  employeeName: string;
  employeePosition: string;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;
  currentStatus: TaskStatus;
};

export function getStatusLabel(status: TaskStatus) {
  switch (status) {
    case "completed":
      return "Completed";
    case "in-progress":
      return "In Progress";
    case "not-started":
      return "Not Started";
    default:
      return "Late";
  }
}

export default function AdminTaskCard({
  task,
  isCollapsed,
  onToggleCollapse,
}: {
  task: EmployeeTask;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const expiredStatus =
    task.currentStatus === "not-started" &&
    new Date(task.expiresAt.replace("-", "")) < new Date()
      ? "expired"
      : task.currentStatus;

  return (
    <div
      className={`staffTaskCard ${expiredStatus} ${
        isCollapsed ? "isCollapsed" : ""
      }`}
    >
      <div className="staffTaskCardHeader">
        <div className="staffTaskCardHeaderLeft">
          <div className="staffTaskTitle">{task.title}</div>
          <div className="staffTaskEmployeeRole">
            {task.employeeName} • {task.employeePosition}
          </div>
        </div>

        <div className="staffTaskCardHeaderRight">
          <button
            type="button"
            className="staffTaskCollapseButton"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand task" : "Collapse task"}
          >
            <span
              className={`staffTaskCollapseIcon ${
                isCollapsed ? "collapsed" : ""
              }`}
            >
              ▾
            </span>
            {isCollapsed ? "Expand" : "Collapse"}
          </button>

          <div className={`staffTaskStatusBadge ${expiredStatus}`}>
            {task.currentStatus === "not-started" &&
            new Date(task.expiresAt.replace("-", "")) < new Date()
              ? "Late"
              : getStatusLabel(task.currentStatus)}
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="staffTaskDivider" />

          <div className="staffTaskBody">
            <div className="staffTaskRow">
              <span className="staffTaskLabel">Assigned Employee:</span>
              <span className="staffTaskValue">{task.employeeName}</span>
            </div>

            <div className="staffTaskRow">
              <span className="staffTaskLabel">Assigned Account ID:</span>
              <span className="staffTaskValue">{task.assignedToAccountId}</span>
            </div>

            <div className="staffTaskRow">
              <span className="staffTaskLabel">Created At:</span>
              <span className="staffTaskValue">{task.createdAt}</span>
            </div>

            <div className="staffTaskRow">
              <span className="staffTaskLabel">Expires At:</span>
              <span className="staffTaskValue">{task.expiresAt}</span>
            </div>

            <div className="staffTaskRow">
              <span className="staffTaskLabel">Expiration Status:</span>
              <span className="staffTaskValue">
                {new Date(task.expiresAt.replace("-", "")) < new Date()
                  ? "Expired"
                  : "Active"}
              </span>
            </div>

            <div className="staffTaskRow">
              <span className="staffTaskLabel">Current Status:</span>
              <span className="staffTaskValue">
                {getStatusLabel(task.currentStatus)}
              </span>
            </div>

            <div className="staffTaskRow">
              <span className="staffTaskLabel">Completed At:</span>
              <span className="staffTaskValue">
                {task.currentStatus === "completed" ? task.completedAt : "—"}
              </span>
            </div>

            <div className="staffTaskDescriptionBlock">
              <span className="staffTaskLabel">Description:</span>

              <div
                className={
                  descriptionExpanded
                    ? "staffTaskDescriptionText"
                    : "staffTaskDescriptionTextShort"
                }
              >
                {task.description}
              </div>

              {task.description.length > 120 && (
                <button
                  type="button"
                  className="staffTaskExpandButton"
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                >
                  {descriptionExpanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
