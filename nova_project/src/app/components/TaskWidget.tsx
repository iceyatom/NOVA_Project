"use client";

import React, { useState } from "react";
import { EmployeeTask } from "./AdminTaskCard";
import PopUpContainer from "./PopUpContainer";
import EmployeeTaskCard from "./EmployeeTaskCard";
import { statusPriority } from "../staff/adminTaskView/page";

function getTasks(account: string) {
  // Search task model in database for the account and return tasks 
  ;

  // Get the first 5 or so tasks from the database 
  ;

  // This is mock data 
  const tasks: EmployeeTask[] = [
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
    }
  ];

  return tasks;
}

export default function TaskWidget(account: string) {
  const [tasks, setTasks] = useState(() =>
    getTasks(account).sort((a, b) => statusPriority(a) - statusPriority(b)).slice(0, 5)
  );
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<EmployeeTask | null>(null);

  const updateTask = (updatedTask: EmployeeTask) => {
    setTasks(prev =>
      prev
        .map(t => (t.id === updatedTask.id ? updatedTask : t))
        .sort((a, b) => statusPriority(a) - statusPriority(b))
        .slice(0, 5)
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

  if (tasks.length !== 0) {
    taskList = <div>
      {tasks.map((task) => (
        <div className="employeeCardHint"
          onClick={() => openPopup(task)}
          key={task.id}>
          <EmployeeTaskCard
            task={task}
            isSummary={true}
          />
        </div>
      ))}
    </div>;
  }

  return <div className="staffCard col4">
    <div className="staffCardLabel">Upcoming Task{s}</div>
    {taskList}
    {selectedTask && (
      <PopUpContainer isOpen={isPopupOpen} onClose={closePopup}>
        <EmployeeTaskCard
          task={selectedTask}
          isSummary={false}
          onTaskUpdate={updateTask}
        />
      </PopUpContainer>
    )}
  </div>;
}