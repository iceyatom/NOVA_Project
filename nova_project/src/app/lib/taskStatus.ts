import type { EmployeeTask } from "@/app/components/AdminTaskCard";

function parseTaskDate(dateText: string): Date {
  // Existing task cards store dates as display-formatted strings.
  return new Date(dateText.replace("-", ""));
}

export function statusPriority(task: EmployeeTask) {
  if (parseTaskDate(task.expiresAt) < new Date()) {
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
}
