"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import AdminTaskCard, {
  EmployeeTask,
  TaskStatus,
} from "@/app/components/AdminTaskCard";
import { statusPriority } from "@/app/lib/taskStatus";

export type EmployeeTaskGroup = {
  accountId: number;
  employeeName: string;
  employeePosition: string;
  tasks: EmployeeTask[];
};

type PointerDragState = {
  task: EmployeeTask;
  sourceAccountId: number;
  pointerX: number;
  pointerY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  isCollapsed: boolean;
};

type DropAnimationState = {
  task: EmployeeTask;
  width: number;
  isCollapsed: boolean;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  started: boolean;
  targetAccountId: number;
};

type EditTaskInitialState = {
  title: string;
  description: string;
  assignedToAccountId: string;
  dueAt: string;
  status: TaskStatus;
};

type BulkEditInitialState = {
  assigneeId: string;
  dueAt: string;
  assigneeMixed: boolean;
  dueAtMixed: boolean;
};

const MIXED_FIELD_VALUE = "__mixed__";

function toDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDisplayDueDate(rawValue: string): Date | null {
  const normalized = rawValue.replace(" -", " ");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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
  const [editTask, setEditTask] = useState<EmployeeTask | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskAssigneeId, setEditTaskAssigneeId] = useState("");
  const [editTaskDueAt, setEditTaskDueAt] = useState("");
  const [editTaskStatus, setEditTaskStatus] =
    useState<TaskStatus>("not-started");
  const [editTaskInitial, setEditTaskInitial] =
    useState<EditTaskInitialState | null>(null);
  const [editTaskError, setEditTaskError] = useState<string | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkAssigneeId, setBulkAssigneeId] = useState("");
  const [bulkDueAt, setBulkDueAt] = useState("");
  const [bulkEditInitial, setBulkEditInitial] =
    useState<BulkEditInitialState | null>(null);
  const [bulkEditError, setBulkEditError] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirmation, setShowBulkDeleteConfirmation] =
    useState(false);
  const [pointerDrag, setPointerDrag] = useState<PointerDragState | null>(null);
  const [dragOverAccountId, setDragOverAccountId] = useState<number | null>(
    null,
  );
  const [reassignTaskError, setReassignTaskError] = useState<string | null>(
    null,
  );
  const [isReassigningTaskId, setIsReassigningTaskId] = useState<number | null>(
    null,
  );
  const [dropAnimation, setDropAnimation] = useState<DropAnimationState | null>(
    null,
  );
  const employeeGroupRefs = useRef<Map<number, HTMLDivElement>>(new Map());

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

  const selectedTasks = useMemo(() => {
    const selectedIds = new Set(selectedTaskIds);
    return allTasks.filter((task) => selectedIds.has(task.id));
  }, [allTasks, selectedTaskIds]);

  const selectedTaskCount = selectedTasks.length;

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

  useEffect(() => {
    const validTaskIds = new Set(allTaskIds);
    setSelectedTaskIds((currentIds) =>
      currentIds.filter((taskId) => validTaskIds.has(taskId)),
    );
  }, [allTaskIds]);

  useEffect(() => {
    if (!isBulkEditOpen) return;
    if (selectedTaskCount > 0) return;
    setIsBulkEditOpen(false);
    setShowBulkDeleteConfirmation(false);
    setBulkEditInitial(null);
    setBulkEditError(null);
  }, [isBulkEditOpen, selectedTaskCount]);

  useEffect(() => {
    if (!isBulkEditOpen || selectedTaskCount === 0) return;

    const assigneeIds = Array.from(
      new Set(selectedTasks.map((task) => task.assignedToAccountId)),
    );
    const dueAtValues = Array.from(
      new Set(
        selectedTasks
          .map((task) => {
            const sourceDate = task.expiresAtIso
              ? new Date(task.expiresAtIso)
              : parseDisplayDueDate(task.expiresAt);

            if (!sourceDate || Number.isNaN(sourceDate.getTime())) {
              return "";
            }

            return toDateTimeLocalValue(sourceDate);
          })
          .filter((value) => value.length > 0),
      ),
    );

    const assigneeMixed = assigneeIds.length !== 1;
    const dueAtMixed = dueAtValues.length !== 1;
    const nextAssigneeId = assigneeMixed
      ? MIXED_FIELD_VALUE
      : String(assigneeIds[0]);
    const nextDueAt = dueAtMixed ? "" : dueAtValues[0];

    setBulkAssigneeId(nextAssigneeId);
    setBulkDueAt(nextDueAt);
    setBulkEditInitial({
      assigneeId: nextAssigneeId,
      dueAt: nextDueAt,
      assigneeMixed,
      dueAtMixed,
    });
    setBulkEditError(null);
  }, [isBulkEditOpen, selectedTaskCount, selectedTasks]);

  useEffect(() => {
    if (!editTask) return;

    setEditTaskTitle(editTask.title);
    setEditTaskDescription(editTask.description);
    setEditTaskAssigneeId(String(editTask.assignedToAccountId));
    const sourceDueAt = editTask.expiresAtIso
      ? new Date(editTask.expiresAtIso)
      : parseDisplayDueDate(editTask.expiresAt);
    const normalizedDueAt = sourceDueAt
      ? toDateTimeLocalValue(sourceDueAt)
      : toDateTimeLocalValue(new Date());

    setEditTaskDueAt(normalizedDueAt);
    setEditTaskStatus(editTask.currentStatus);
    setEditTaskInitial({
      title: editTask.title,
      description: editTask.description,
      assignedToAccountId: String(editTask.assignedToAccountId),
      dueAt: normalizedDueAt,
      status: editTask.currentStatus,
    });
    setEditTaskError(null);
  }, [editTask]);

  const isEditTitleDirty =
    editTaskInitial !== null && editTaskTitle.trim() !== editTaskInitial.title;
  const isEditDescriptionDirty =
    editTaskInitial !== null &&
    editTaskDescription.trim() !== editTaskInitial.description;
  const isEditAssigneeDirty =
    editTaskInitial !== null &&
    editTaskAssigneeId !== editTaskInitial.assignedToAccountId;
  const isEditDueAtDirty =
    editTaskInitial !== null && editTaskDueAt !== editTaskInitial.dueAt;
  const isEditStatusDirty =
    editTaskInitial !== null && editTaskStatus !== editTaskInitial.status;
  const isAnyEditTaskDirty =
    isEditTitleDirty ||
    isEditDescriptionDirty ||
    isEditAssigneeDirty ||
    isEditDueAtDirty ||
    isEditStatusDirty;
  const isBulkAssigneeDirty =
    bulkEditInitial !== null &&
    bulkAssigneeId !== bulkEditInitial.assigneeId &&
    bulkAssigneeId !== MIXED_FIELD_VALUE;
  const isBulkDueAtDirty =
    bulkEditInitial !== null && bulkDueAt !== bulkEditInitial.dueAt;
  const isAnyBulkFieldDirty = isBulkAssigneeDirty || isBulkDueAtDirty;
  const showBulkAssigneeMixed =
    bulkEditInitial?.assigneeMixed === true &&
    bulkAssigneeId === MIXED_FIELD_VALUE;
  const showBulkDueAtMixed =
    bulkEditInitial?.dueAtMixed === true && bulkDueAt.length === 0;
  const isBulkBusy = isBulkSaving || isBulkDeleting;

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

  function toggleSelectMode() {
    setIsSelectMode((currentValue) => {
      const nextValue = !currentValue;
      if (!nextValue) {
        setSelectedTaskIds([]);
        setIsBulkEditOpen(false);
        setShowBulkDeleteConfirmation(false);
      }
      return nextValue;
    });

    setPointerDrag(null);
    setDragOverAccountId(null);
    setReassignTaskError(null);
    setBulkEditError(null);
  }

  function toggleTaskSelection(taskId: number) {
    setSelectedTaskIds((currentIds) => {
      if (currentIds.includes(taskId)) {
        return currentIds.filter((id) => id !== taskId);
      }

      return [...currentIds, taskId];
    });
  }

  function closeCreateTaskModal() {
    if (isCreatingTask) return;
    setIsCreateTaskOpen(false);
  }

  function openBulkEditModal() {
    if (selectedTaskCount === 0) return;
    setIsBulkEditOpen(true);
  }

  function closeBulkEditModal() {
    if (isBulkBusy) return;
    setIsBulkEditOpen(false);
    setShowBulkDeleteConfirmation(false);
    setBulkEditError(null);
  }

  function openEditTaskModal(task: EmployeeTask) {
    setEditTask(task);
  }

  function closeEditTaskModal() {
    if (isEditingTask) return;
    setEditTask(null);
    setEditTaskInitial(null);
    setEditTaskError(null);
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

  async function handleEditTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editTask) return;

    const title = editTaskTitle.trim();
    const description = editTaskDescription.trim();
    const assignedToAccountId = Number.parseInt(editTaskAssigneeId, 10);
    const expiresAt = new Date(editTaskDueAt);

    if (!isAnyEditTaskDirty) {
      return;
    }

    if (!title) {
      setEditTaskError("Task title is required.");
      return;
    }

    if (!description) {
      setEditTaskError("Task description is required.");
      return;
    }

    if (!Number.isFinite(assignedToAccountId)) {
      setEditTaskError("Assigned employee is required.");
      return;
    }

    if (!editTaskDueAt || Number.isNaN(expiresAt.getTime())) {
      setEditTaskError("Valid due date is required.");
      return;
    }

    setEditTaskError(null);
    setIsEditingTask(true);

    try {
      const response = await fetch("/api/tasks/staff", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: editTask.id,
          title,
          description,
          assignedToAccountId,
          expiresAt: expiresAt.toISOString(),
          status: editTaskStatus,
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

      setEditTask(null);
      router.refresh();
    } catch (updateError) {
      setEditTaskError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update task.",
      );
    } finally {
      setIsEditingTask(false);
    }
  }

  async function handleBulkTaskUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const taskIds = [...selectedTaskIds];
    if (taskIds.length === 0) {
      setBulkEditError("Select at least one task.");
      return;
    }

    const updates: {
      assignedToAccountId?: number;
      expiresAt?: string;
    } = {};

    if (isBulkAssigneeDirty) {
      const assignedToAccountId = Number.parseInt(bulkAssigneeId, 10);
      if (!Number.isInteger(assignedToAccountId) || assignedToAccountId <= 0) {
        setBulkEditError("Assigned employee is required.");
        return;
      }
      updates.assignedToAccountId = assignedToAccountId;
    }

    if (isBulkDueAtDirty) {
      if (!bulkDueAt) {
        setBulkEditError("Valid due date is required.");
        return;
      }

      const expiresAt = new Date(bulkDueAt);
      if (Number.isNaN(expiresAt.getTime())) {
        setBulkEditError("Valid due date is required.");
        return;
      }
      updates.expiresAt = expiresAt.toISOString();
    }

    if (Object.keys(updates).length === 0) {
      setBulkEditError("Choose at least one field to update.");
      return;
    }

    setBulkEditError(null);
    setIsBulkSaving(true);

    try {
      for (const taskId of taskIds) {
        const response = await fetch("/api/tasks/staff", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            taskId,
            ...updates,
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
              : `Bulk task update failed (HTTP ${response.status}).`;
          throw new Error(message);
        }
      }

      setIsBulkEditOpen(false);
      setSelectedTaskIds([]);
      router.refresh();
    } catch (updateError) {
      setBulkEditError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update selected tasks.",
      );
    } finally {
      setIsBulkSaving(false);
    }
  }

  function openBulkDeleteConfirmation() {
    if (selectedTaskCount === 0) {
      setBulkEditError("Select at least one task.");
      return;
    }

    setBulkEditError(null);
    setShowBulkDeleteConfirmation(true);
  }

  function closeBulkDeleteConfirmation() {
    if (isBulkBusy) return;
    setShowBulkDeleteConfirmation(false);
  }

  async function confirmBulkTaskDelete() {
    const taskIds = [...selectedTaskIds];
    if (taskIds.length === 0) {
      setBulkEditError("Select at least one task.");
      setShowBulkDeleteConfirmation(false);
      return;
    }

    setBulkEditError(null);
    setIsBulkDeleting(true);

    try {
      for (const taskId of taskIds) {
        const response = await fetch("/api/tasks/staff", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            taskId,
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
              : `Task delete failed (HTTP ${response.status}).`;
          throw new Error(message);
        }
      }

      setShowBulkDeleteConfirmation(false);
      setIsBulkEditOpen(false);
      setSelectedTaskIds([]);
      router.refresh();
    } catch (deleteError) {
      setShowBulkDeleteConfirmation(false);
      setBulkEditError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete selected tasks.",
      );
    } finally {
      setIsBulkDeleting(false);
    }
  }

  function getAccountIdAtPoint(
    clientX: number,
    clientY: number,
  ): number | null {
    for (const [accountId, element] of employeeGroupRefs.current.entries()) {
      const rect = element.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return accountId;
      }
    }
    return null;
  }

  const reassignTask = useCallback(
    async (taskId: number, targetAccountId: number) => {
      setIsReassigningTaskId(taskId);
      setReassignTaskError(null);

      try {
        const response = await fetch("/api/tasks/staff", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            taskId,
            assignedToAccountId: targetAccountId,
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
              : `Task reassignment failed (HTTP ${response.status}).`;
          throw new Error(message);
        }

        router.refresh();
      } catch (reassignError) {
        setReassignTaskError(
          reassignError instanceof Error
            ? reassignError.message
            : "Failed to reassign task.",
        );
      } finally {
        setIsReassigningTaskId(null);
      }
    },
    [router],
  );

  function handleTaskPointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    task: EmployeeTask,
    sourceAccountId: number,
    isCollapsed: boolean,
  ) {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest("button, input, select, textarea, a, label")) {
      return;
    }

    if (isSelectMode) {
      event.preventDefault();
      setReassignTaskError(null);
      toggleTaskSelection(task.id);
      return;
    }

    if (isReassigningTaskId !== null) return;

    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();

    event.preventDefault();
    setReassignTaskError(null);
    setPointerDrag({
      task,
      sourceAccountId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      isCollapsed,
    });
    setDragOverAccountId(sourceAccountId);
  }

  useEffect(() => {
    if (!pointerDrag) return;

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    const handlePointerMove = (event: PointerEvent) => {
      setPointerDrag((current) =>
        current
          ? {
              ...current,
              pointerX: event.clientX,
              pointerY: event.clientY,
            }
          : current,
      );
      setDragOverAccountId(getAccountIdAtPoint(event.clientX, event.clientY));
    };

    const handlePointerUp = (event: PointerEvent) => {
      const targetAccountId = getAccountIdAtPoint(event.clientX, event.clientY);
      const currentDrag = pointerDrag;

      const fromX = Math.round(currentDrag.pointerX - currentDrag.offsetX);
      const fromY = Math.round(currentDrag.pointerY - currentDrag.offsetY);

      setPointerDrag(null);
      setDragOverAccountId(null);

      if (!targetAccountId || isReassigningTaskId !== null) {
        return;
      }

      if (currentDrag.sourceAccountId === targetAccountId) {
        return;
      }

      const targetGroupElement = employeeGroupRefs.current.get(targetAccountId);
      if (!targetGroupElement) {
        void reassignTask(currentDrag.task.id, targetAccountId);
        return;
      }

      const targetRect = targetGroupElement.getBoundingClientRect();
      const toX = Math.round(
        targetRect.left + Math.min(24, Math.max(12, targetRect.width * 0.08)),
      );
      const toY = Math.round(targetRect.top + 74);

      setDropAnimation({
        task: currentDrag.task,
        width: currentDrag.width,
        isCollapsed: currentDrag.isCollapsed,
        fromX,
        fromY,
        toX,
        toY,
        started: false,
        targetAccountId,
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [pointerDrag, isReassigningTaskId, reassignTask]);

  useEffect(() => {
    if (!dropAnimation || dropAnimation.started) return;

    const frame = window.requestAnimationFrame(() => {
      setDropAnimation((current) =>
        current ? { ...current, started: true } : current,
      );
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [dropAnimation]);

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
          {selectedTaskCount > 0 ? (
            <button
              type="button"
              className="staffActionButton editSelectedButton"
              onClick={openBulkEditModal}
            >
              Edit Selected ({selectedTaskCount})
            </button>
          ) : null}

          <button
            type="button"
            className={`staffActionButton selectTasksButton ${
              isSelectMode ? "isActive" : ""
            }`}
            onClick={toggleSelectMode}
            disabled={allTaskIds.length === 0}
          >
            {isSelectMode ? `Select (${selectedTaskCount})` : "Select"}
          </button>

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

      {reassignTaskError ? (
        <div className="item-category-form__status item-category-form__status--error">
          {reassignTaskError}
        </div>
      ) : null}

      <div className="staffTaskGroups">
        {sortedTaskGroups.map((group) => {
          const employeeTaskIds = group.tasks.map((task) => task.id);
          const areEmployeeTasksCollapsed =
            employeeTaskIds.length > 0 &&
            employeeTaskIds.every((taskId) =>
              collapsedTaskIds.includes(taskId),
            );

          return (
            <div
              key={group.accountId}
              ref={(element) => {
                if (element) {
                  employeeGroupRefs.current.set(group.accountId, element);
                  return;
                }
                employeeGroupRefs.current.delete(group.accountId);
              }}
              className={`staffEmployeeGroup ${
                dragOverAccountId === group.accountId ? "isDragOver" : ""
              }`}
            >
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
                      onEditTask={openEditTaskModal}
                      isSelectMode={isSelectMode}
                      isSelected={selectedTaskIds.includes(task.id)}
                      isPointerDragging={pointerDrag?.task.id === task.id}
                      onPointerDown={(event, draggedTask) =>
                        handleTaskPointerDown(
                          event,
                          draggedTask,
                          group.accountId,
                          collapsedTaskIds.includes(task.id),
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pointerDrag ? (
        <div
          className="staffTaskDragOverlay"
          style={{
            width: `${pointerDrag.width}px`,
            transform: `translate(${Math.round(pointerDrag.pointerX - pointerDrag.offsetX)}px, ${Math.round(pointerDrag.pointerY - pointerDrag.offsetY)}px)`,
          }}
        >
          <AdminTaskCard
            task={pointerDrag.task}
            isCollapsed={pointerDrag.isCollapsed}
            onToggleCollapse={() => {}}
          />
        </div>
      ) : null}

      {dropAnimation ? (
        <div
          className={`staffTaskDragOverlay staffTaskDragOverlay--drop ${
            dropAnimation.started ? "isActive" : ""
          }`}
          style={{
            width: `${dropAnimation.width}px`,
            transform: `translate(${dropAnimation.started ? dropAnimation.toX : dropAnimation.fromX}px, ${dropAnimation.started ? dropAnimation.toY : dropAnimation.fromY}px)`,
          }}
          onTransitionEnd={() => {
            if (!dropAnimation.started) return;
            const { task, targetAccountId } = dropAnimation;
            setDropAnimation(null);
            void reassignTask(task.id, targetAccountId);
          }}
        >
          <AdminTaskCard
            task={dropAnimation.task}
            isCollapsed={dropAnimation.isCollapsed}
            onToggleCollapse={() => {}}
          />
        </div>
      ) : null}

      {isBulkEditOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bulk Edit Tasks"
          className="item-category-modal"
          onClick={closeBulkEditModal}
        >
          <div
            className="item-category-modal__content category-mgmt-edit-modal__content staffTaskCreateModal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">
              Edit Selected Tasks
            </div>
            <div className="staffCardHint staffBulkEditSummary">
              {selectedTaskCount} task{selectedTaskCount === 1 ? "" : "s"}{" "}
              selected.
            </div>

            <form
              className="item-category-form"
              onSubmit={(event) => void handleBulkTaskUpdate(event)}
              noValidate
            >
              <div className="staffTaskCreateForm__row">
                <label className="item-category-form__field">
                  <span className="item-category-form__label">
                    Assigned Employee
                  </span>
                  <select
                    className="item-search-page__select"
                    value={bulkAssigneeId}
                    onChange={(event) => setBulkAssigneeId(event.target.value)}
                    disabled={isBulkBusy || assigneeOptions.length === 0}
                  >
                    {showBulkAssigneeMixed ? (
                      <option value={MIXED_FIELD_VALUE}>--</option>
                    ) : null}
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
                  <div
                    className={`staffBulkDateInputWrapper ${
                      showBulkDueAtMixed ? "isMixed" : ""
                    }`}
                  >
                    <input
                      className="item-search-page__search-input"
                      type="datetime-local"
                      value={bulkDueAt}
                      onChange={(event) => setBulkDueAt(event.target.value)}
                      disabled={isBulkBusy}
                    />
                    {showBulkDueAtMixed ? (
                      <span className="staffBulkFieldDash">--</span>
                    ) : null}
                  </div>
                </label>
              </div>

              {showBulkAssigneeMixed || showBulkDueAtMixed ? (
                <div className="staffCardHint">
                  Fields showing -- currently have mixed values.
                </div>
              ) : null}

              {bulkEditError ? (
                <div className="item-category-form__status item-category-form__status--error">
                  {bulkEditError}
                </div>
              ) : null}

              <div className="item-category-form__actions category-mgmt-edit-modal__actions">
                <button
                  type="button"
                  onClick={closeBulkEditModal}
                  className="staff-dev-pill"
                  disabled={isBulkBusy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="staff-dev-pill staff-dev-pill--danger"
                  onClick={openBulkDeleteConfirmation}
                  disabled={isBulkBusy || selectedTaskCount === 0}
                >
                  {isBulkDeleting ? "Deleting..." : "Delete Selected"}
                </button>
                <button
                  type="submit"
                  className={`staff-dev-pill${
                    isAnyBulkFieldDirty ? " staff-dev-pill--ready" : ""
                  }`}
                  disabled={isBulkBusy || !isAnyBulkFieldDirty}
                >
                  {isBulkSaving ? "Saving..." : "Apply Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isBulkEditOpen && showBulkDeleteConfirmation ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Delete Selected Tasks"
          className="item-category-modal"
          onClick={closeBulkDeleteConfirmation}
        >
          <div
            className="item-category-modal__content category-mgmt-confirm-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Confirm Deletion</div>
            <p className="category-mgmt-confirm-modal__message">
              Are you sure you want to delete {selectedTaskCount} selected task
              {selectedTaskCount === 1 ? "" : "s"}?
            </p>
            <div className="category-mgmt-delete-warning">
              <p>This action cannot be undone.</p>
            </div>
            <div className="item-category-form__actions category-mgmt-confirm-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={closeBulkDeleteConfirmation}
                disabled={isBulkDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--danger"
                onClick={() => void confirmBulkTaskDelete()}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editTask ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Task"
          className="item-category-modal"
          onClick={closeEditTaskModal}
        >
          <div
            className="item-category-modal__content category-mgmt-edit-modal__content staffTaskCreateModal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Edit Task</div>

            <form
              className="item-category-form"
              onSubmit={(event) => void handleEditTask(event)}
              noValidate
            >
              <label className="item-category-form__field">
                <span
                  className={`item-category-form__label ${
                    isEditTitleDirty
                      ? "category-mgmt-edit-modal__label--dirty"
                      : ""
                  }`}
                >
                  Task Title
                </span>
                <input
                  className="item-search-page__search-input"
                  type="text"
                  value={editTaskTitle}
                  onChange={(event) => setEditTaskTitle(event.target.value)}
                  placeholder="Enter task title"
                  disabled={isEditingTask}
                />
              </label>

              <div className="staffTaskCreateForm__row">
                <label className="item-category-form__field">
                  <span
                    className={`item-category-form__label ${
                      isEditAssigneeDirty
                        ? "category-mgmt-edit-modal__label--dirty"
                        : ""
                    }`}
                  >
                    Assigned Employee
                  </span>
                  <select
                    className="item-search-page__select"
                    value={editTaskAssigneeId}
                    onChange={(event) =>
                      setEditTaskAssigneeId(event.target.value)
                    }
                    disabled={isEditingTask || assigneeOptions.length === 0}
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
                  <span
                    className={`item-category-form__label ${
                      isEditDueAtDirty
                        ? "category-mgmt-edit-modal__label--dirty"
                        : ""
                    }`}
                  >
                    Due Date
                  </span>
                  <input
                    className="item-search-page__search-input"
                    type="datetime-local"
                    value={editTaskDueAt}
                    onChange={(event) => setEditTaskDueAt(event.target.value)}
                    disabled={isEditingTask}
                  />
                </label>
              </div>

              <label className="item-category-form__field">
                <span
                  className={`item-category-form__label ${
                    isEditStatusDirty
                      ? "category-mgmt-edit-modal__label--dirty"
                      : ""
                  }`}
                >
                  Status
                </span>
                <select
                  className="item-search-page__select"
                  value={editTaskStatus}
                  onChange={(event) =>
                    setEditTaskStatus(event.target.value as TaskStatus)
                  }
                  disabled={isEditingTask}
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label className="item-category-form__field">
                <span
                  className={`item-category-form__label ${
                    isEditDescriptionDirty
                      ? "category-mgmt-edit-modal__label--dirty"
                      : ""
                  }`}
                >
                  Description
                </span>
                <textarea
                  className="item-search-page__search-input staffTaskCreateForm__textarea"
                  value={editTaskDescription}
                  onChange={(event) =>
                    setEditTaskDescription(event.target.value)
                  }
                  placeholder="Add task details"
                  disabled={isEditingTask}
                />
              </label>

              {editTaskError ? (
                <div className="item-category-form__status item-category-form__status--error">
                  {editTaskError}
                </div>
              ) : null}

              <div className="item-category-form__actions category-mgmt-edit-modal__actions">
                <button
                  type="button"
                  onClick={closeEditTaskModal}
                  className="staff-dev-pill"
                  disabled={isEditingTask}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`staff-dev-pill${
                    isAnyEditTaskDirty ? " staff-dev-pill--ready" : ""
                  }`}
                  disabled={isEditingTask || !isAnyEditTaskDirty}
                >
                  {isEditingTask ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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
