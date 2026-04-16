import { useEffect, useState } from "react";
import {
  EmployeeTask,
  getStatusLabel,
  stringToTaskStatus,
} from "./AdminTaskCard";
import "../styles/EmployeeTaskCard.css";

export default function EmployeeTaskCard({
  task,
  isSummary,
  onTaskUpdate,
  onTaskSave,
}: {
  task: EmployeeTask;
  isSummary: boolean;
  onTaskUpdate?: (task: EmployeeTask) => void;
  onTaskSave?: () => void;
}) {
  const [status, setStatus] = useState(task.currentStatus);
  const [completedAt, setCompletedAt] = useState(task.completedAt);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function getDate() {
    return new Date()
      .toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .replace(/,([^,]*)$/, " -$1");
  }

  useEffect(() => {
    setStatus(task.currentStatus);
    setCompletedAt(task.completedAt || undefined);
    setSaveError(null);
  }, [task]);

  function setTaskStatus(status: string) {
    setStatus(stringToTaskStatus(status));
    setSaveError(null);
  }

  async function updateTask() {
    if (status === task.currentStatus || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/tasks/staff", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: task.id,
          status,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: unknown;
      };

      if (!response.ok || payload.success === false) {
        const message =
          typeof payload.error === "string"
            ? payload.error
            : `Task update failed (HTTP ${response.status}).`;
        throw new Error(message);
      }

      const completedAtNow =
        status === "completed" ? (task.completedAt ?? getDate()) : undefined;
      setCompletedAt(completedAtNow);
      const updatedTask: EmployeeTask = {
        ...task,
        currentStatus: status,
        completedAt: completedAtNow,
      };

      onTaskUpdate?.(updatedTask);
      onTaskSave?.();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to update task.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const expiredStatus =
    status === "not-started" &&
    new Date(task.expiresAt.replace("-", "")) < new Date()
      ? "expired"
      : status;

  return (
    <div className={`staffTaskCard ${expiredStatus}`}>
      <div className="staffTaskCardHeader">
        <div className="staffTaskCardHeaderLeft">
          <div className={isSummary ? "staffTaskTitleShort" : "staffTaskTitle"}>
            {task.title}
          </div>
        </div>

        <div className="staffTaskCardHeaderRight">
          <div className={`staffTaskStatusBadge ${expiredStatus}`}>
            {status === "not-started" &&
            new Date(task.expiresAt.replace("-", "")) < new Date()
              ? "Late"
              : getStatusLabel(status)}
          </div>
        </div>
      </div>

      {!isSummary && (
        <>
          <div className="staffTaskDivider" />

          <div className="staffTaskBody">
            <div className="staffTaskDescriptionBlock">
              <span className="staffTaskLabel">Description:</span>
              <div className="staffTaskDescriptionText">{task.description}</div>
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
              <span className="staffTaskLabel">Completed At:</span>
              <span className="staffTaskValue">
                {completedAt === undefined ? "—" : completedAt}
              </span>
            </div>

            <div className="staffTaskRow">
              <span className="staffTaskLabel">Current Status:</span>
              <select
                className="item-search-page__select"
                value={status}
                onChange={(e) => setTaskStatus(e.target.value)}
                disabled={isSaving}
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {saveError && (
              <div className="item-category-form__status item-category-form__status--error">
                {saveError}
              </div>
            )}

            <button
              className="staff-dev-pill"
              disabled={status === task.currentStatus || isSaving}
              onClick={() => void updateTask()}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
