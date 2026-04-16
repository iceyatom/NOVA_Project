"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminTaskCard, { EmployeeTask } from "@/app/components/AdminTaskCard";
import { statusPriority } from "@/app/lib/taskStatus";

export type EmployeeTaskGroup = {
  accountId: number;
  employeeName: string;
  employeePosition: string;
  tasks: EmployeeTask[];
};

function toDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AdminTaskViewClient({
  taskGroups,
}: {
  taskGroups: EmployeeTaskGroup[];
}) {
  const router = useRouter();

  const allTaskIds = useMemo(
    () => taskGroups.flatMap((group) => group.tasks.map((task) => task.id)),
    [taskGroups],
  );

  const [collapsedTaskIds, setCollapsedTaskIds] =
    useState<number[]>(allTaskIds);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskTitle, setCreateTaskTitle] = useState("");
  const [createTaskDescription, setCreateTaskDescription] = useState("");
  const [createTaskAssigneeId, setCreateTaskAssigneeId] = useState("");
  const [createTaskDueAt, setCreateTaskDueAt] = useState("");
  const [createTaskError, setCreateTaskError] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const sortedTaskGroups = useMemo(() => {
    return taskGroups.map((group) => ({
      ...group,
      tasks: [...group.tasks].sort(
        (a, b) => statusPriority(a) - statusPriority(b),
      ),
    }));
  }, [taskGroups]);

  const allTasks = useMemo(
    () => sortedTaskGroups.flatMap((group) => group.tasks),
    [sortedTaskGroups],
  );

  const assigneeOptions = useMemo(
    () =>
      taskGroups.map((group) => ({
        accountId: group.accountId,
        label: `${group.employeeName} (${group.employeePosition})`,
      })),
    [taskGroups],
  );

  const areAllCollapsed =
    allTaskIds.length > 0 && collapsedTaskIds.length === allTaskIds.length;

  useEffect(() => {
    if (!isCreateTaskOpen) return;

    const defaultDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setCreateTaskTitle("");
    setCreateTaskDescription("");
    setCreateTaskAssigneeId(
      assigneeOptions.length > 0 ? String(assigneeOptions[0].accountId) : "",
    );
    setCreateTaskDueAt(toDateTimeLocalValue(defaultDueAt));
    setCreateTaskError(null);
  }, [isCreateTaskOpen, assigneeOptions]);

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
      const areAllCollapsedNow = currentIds.length === allTaskIds.length;

      if (areAllCollapsedNow) {
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

  function openCreateTaskModal() {
    setIsCreateTaskOpen(true);
  }

  function closeCreateTaskModal() {
    if (isCreatingTask) return;
    setIsCreateTaskOpen(false);
  }

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = createTaskTitle.trim();
    const description = createTaskDescription.trim();
    const assignedToAccountId = Number.parseInt(createTaskAssigneeId, 10);
    const expiresAt = new Date(createTaskDueAt);

    if (!title) {
      setCreateTaskError("Task title is required.");
      return;
    }

    if (!description) {
      setCreateTaskError("Task description is required.");
      return;
    }

    if (!Number.isFinite(assignedToAccountId)) {
      setCreateTaskError("Assigned employee is required.");
      return;
    }

    if (!createTaskDueAt || Number.isNaN(expiresAt.getTime())) {
      setCreateTaskError("Valid due date is required.");
      return;
    }

    setCreateTaskError(null);
    setIsCreatingTask(true);

    try {
      const response = await fetch("/api/tasks/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          assignedToAccountId,
          expiresAt: expiresAt.toISOString(),
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
            : `Create task failed (HTTP ${response.status}).`;
        throw new Error(message);
      }

      setIsCreateTaskOpen(false);
      router.refresh();
    } catch (createError) {
      setCreateTaskError(
        createError instanceof Error
          ? createError.message
          : "Failed to create task.",
      );
    } finally {
      setIsCreatingTask(false);
    }
  }

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

        <div className="staffTaskLegendActions">
          <button
            type="button"
            className="staffActionButton createTaskButton"
            onClick={openCreateTaskModal}
          >
            Create Task +
          </button>

          <button
            type="button"
            className="staffActionButton"
            onClick={toggleCollapseAll}
            disabled={allTaskIds.length === 0}
          >
            {areAllCollapsed ? "Expand All" : "Collapse All"}
            <span
              className={`staffActionButtonIcon ${
                areAllCollapsed ? "collapsed" : ""
              }`}
            >
              {"\u25BE"}
            </span>
          </button>
        </div>
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
                  {areEmployeeTasksCollapsed
                    ? "Expand Section"
                    : "Collapse Section"}
                  <span
                    className={`staffActionButtonIcon ${
                      areEmployeeTasksCollapsed ? "collapsed" : ""
                    }`}
                  >
                    {"\u25BE"}
                  </span>
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

      {isCreateTaskOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create New Task"
          className="item-category-modal"
          onClick={closeCreateTaskModal}
        >
          <div
            className="item-category-modal__content category-mgmt-edit-modal__content staffTaskCreateModal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Create New Task</div>

            <form
              className="item-category-form"
              onSubmit={(event) => void handleCreateTask(event)}
              noValidate
            >
              <label className="item-category-form__field">
                <span className="item-category-form__label">Task Title</span>
                <input
                  className="item-search-page__search-input"
                  type="text"
                  value={createTaskTitle}
                  onChange={(event) => setCreateTaskTitle(event.target.value)}
                  placeholder="Enter task title"
                  disabled={isCreatingTask}
                />
              </label>

              <div className="staffTaskCreateForm__row">
                <label className="item-category-form__field">
                  <span className="item-category-form__label">
                    Assigned Employee
                  </span>
                  <select
                    className="item-search-page__select"
                    value={createTaskAssigneeId}
                    onChange={(event) =>
                      setCreateTaskAssigneeId(event.target.value)
                    }
                    disabled={isCreatingTask || assigneeOptions.length === 0}
                  >
                    {assigneeOptions.length === 0 ? (
                      <option value="">No employees available</option>
                    ) : (
                      assigneeOptions.map((option) => (
                        <option
                          key={option.accountId}
                          value={String(option.accountId)}
                        >
                          {option.label}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label className="item-category-form__field">
                  <span className="item-category-form__label">Due Date</span>
                  <input
                    className="item-search-page__search-input"
                    type="datetime-local"
                    value={createTaskDueAt}
                    onChange={(event) => setCreateTaskDueAt(event.target.value)}
                    disabled={isCreatingTask}
                  />
                </label>
              </div>

              <label className="item-category-form__field">
                <span className="item-category-form__label">Description</span>
                <textarea
                  className="item-search-page__search-input staffTaskCreateForm__textarea"
                  value={createTaskDescription}
                  onChange={(event) =>
                    setCreateTaskDescription(event.target.value)
                  }
                  placeholder="Add task details"
                  disabled={isCreatingTask}
                />
              </label>

              {createTaskError ? (
                <div className="item-category-form__status item-category-form__status--error">
                  {createTaskError}
                </div>
              ) : null}

              <div className="item-category-form__actions category-mgmt-edit-modal__actions">
                <button
                  type="button"
                  onClick={closeCreateTaskModal}
                  className="staff-dev-pill"
                  disabled={isCreatingTask}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="staff-dev-pill staff-dev-pill--ready"
                  disabled={isCreatingTask || assigneeOptions.length === 0}
                >
                  {isCreatingTask ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
