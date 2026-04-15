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
}: {
  task: EmployeeTask;
  isSummary: boolean;
  onTaskUpdate?: (task: EmployeeTask) => void;
}) {
  const [status, setStatus] = useState(task.currentStatus);
  const [completedAt, setCompletedAt] = useState(task.completedAt);
  const [oldTask, setOldTask] = useState(task);
  const [currentTask, setCurrentTask] = useState(task);

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
  }, [task]);

  useEffect(() => {
    function updateEmployeeTask(task: EmployeeTask) {
      const employeeTask: EmployeeTask = {
        id: task.id,
        title: task.title,
        description: task.description,
        assignedToAccountId: task.assignedToAccountId,
        employeeName: task.employeeName,
        employeePosition: task.employeePosition,
        createdAt: task.createdAt,
        completedAt: completedAt,
        expiresAt: task.expiresAt,
        currentStatus: status,
      };
      return employeeTask;
    }

    if (status === "completed") {
      setCompletedAt(getDate());
    } else {
      setCompletedAt(undefined);
    }
    setCurrentTask(updateEmployeeTask(task));
  }, [status, task, completedAt]);

  function setTaskStatus(status: string) {
    setStatus(stringToTaskStatus(status));
  }

  function updateTask() {
    const completedAtNow = status === "completed" ? getDate() : undefined;
    setCompletedAt(completedAtNow);

    if (JSON.stringify(currentTask) === JSON.stringify(oldTask)) {
      return;
    }

    // Send payload to the database here
    console.log("Payload sent to database! Payload: ", currentTask); // Remove these console logs if not needed
    // Database logic here

    // Once the database confirms success, update the task
    const databaseConfirm = Math.random() < 0.5; // Replace with actual database confirmation

    if (databaseConfirm) {
      console.log("Database task update confirmation successful!"); // Remove these console logs if not needed
      setOldTask(currentTask);
      onTaskUpdate?.(currentTask);
    } else {
      console.log("Database task update confirmation failed!"); // Remove these console logs if not needed
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
                defaultValue={status}
                onChange={(e) => setTaskStatus(e.target.value)}
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <button
              className="staff-dev-pill"
              disabled={JSON.stringify(currentTask) === JSON.stringify(oldTask)}
              onClick={updateTask}
            >
              Save
            </button>
          </div>
        </>
      )}
    </div>
  );
}
