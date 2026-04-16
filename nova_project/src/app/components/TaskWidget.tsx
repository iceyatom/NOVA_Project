"use client";

import React, { useEffect, useState } from "react";
import { EmployeeTask } from "./AdminTaskCard";
import PopUpContainer from "./PopUpContainer";
import EmployeeTaskCard from "./EmployeeTaskCard";

type TaskWidgetResponse = {
  success?: boolean;
  error?: unknown;
  tasks?: EmployeeTask[];
};

const MAX_TASKS = 5;

export default function TaskWidget({ accountId }: { accountId: number }) {
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<EmployeeTask | null>(null);

  useEffect(() => {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      setTasks([]);
      setLoadError(null);
      return;
    }

    const abortController = new AbortController();
    let cancelled = false;

    async function loadTasks() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(
          `/api/tasks/staff?accountId=${accountId}&limit=${MAX_TASKS}`,
          {
            cache: "no-store",
            signal: abortController.signal,
          },
        );
        const payload = (await response.json()) as TaskWidgetResponse;

        if (!response.ok || payload.success === false) {
          const message =
            typeof payload.error === "string"
              ? payload.error
              : `Failed to load tasks (HTTP ${response.status}).`;
          throw new Error(message);
        }

        if (!Array.isArray(payload.tasks)) {
          throw new Error("Task response was malformed.");
        }

        if (cancelled) return;
        setTasks(payload.tasks.slice(0, MAX_TASKS));
      } catch (error) {
        if (cancelled) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setTasks([]);
        setLoadError(
          error instanceof Error ? error.message : "Failed to load tasks.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTasks();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [accountId]);

  const updateTask = (updatedTask: EmployeeTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    );
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  function openPopup(task: EmployeeTask) {
    setSelectedTask(task);
    setIsPopupOpen(true);
  }

  function closePopup() {
    setIsPopupOpen(false);
    setSelectedTask(null);
  }

  const s = tasks.length === 1 ? "" : "s";
  let taskList = <div className="staffCardHint">No tasks found.</div>;

  if (isLoading) {
    taskList = <div className="staffCardHint">Loading tasks...</div>;
  } else if (loadError) {
    taskList = <div className="staffCardHint">{loadError}</div>;
  } else if (tasks.length !== 0) {
    taskList = (
      <div>
        {tasks.map((task) => (
          <div
            className="employeeCardHint"
            onClick={() => openPopup(task)}
            key={task.id}
          >
            <EmployeeTaskCard task={task} isSummary={true} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="staffCard col4">
      <div className="staffCardLabel">Upcoming Task{s}</div>
      {taskList}
      {selectedTask && (
        <PopUpContainer isOpen={isPopupOpen} onClose={closePopup}>
          <EmployeeTaskCard
            task={selectedTask}
            isSummary={false}
            onTaskUpdate={updateTask}
            onTaskSave={closePopup}
          />
        </PopUpContainer>
      )}
    </div>
  );
}
