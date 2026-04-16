import { prisma } from "@/lib/db";
import { EmployeeTask, TaskStatus } from "@/app/components/AdminTaskCard";
import AdminTaskViewClient, {
  EmployeeTaskGroup,
} from "@/app/staff/adminTaskView/AdminTaskViewClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatCardDate(date: Date): string {
  return date
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

function roleToPosition(role: string): string {
  const normalized = role.trim().toUpperCase();

  if (normalized === "ADMIN") return "Administrator";
  if (normalized === "STAFF") return "Staff";
  return role;
}

function inferTaskStatus(task: {
  completedAt: Date | null;
  createdAt: Date;
  expiresAt: Date;
}): TaskStatus {
  if (task.completedAt) return "completed";

  const now = new Date();
  const durationMs = task.expiresAt.getTime() - task.createdAt.getTime();
  const halfwayPointMs = task.createdAt.getTime() + durationMs / 2;

  if (now.getTime() >= halfwayPointMs) return "in-progress";
  return "not-started";
}

export default async function StaffTaskViewPage() {
  const accounts = await prisma.account.findMany({
    where: {
      deletedAt: null,
      role: {
        in: ["ADMIN", "STAFF"],
      },
    },
    orderBy: [{ role: "asc" }, { displayName: "asc" }, { email: "asc" }],
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      tasks: {
        orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          description: true,
          assignedToAccountId: true,
          createdAt: true,
          completedAt: true,
          expiresAt: true,
        },
      },
    },
  });

  const taskGroups: EmployeeTaskGroup[] = accounts.map((account) => {
    const employeeName = account.displayName?.trim() || account.email;
    const employeePosition = roleToPosition(account.role);

    const tasks: EmployeeTask[] = account.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description ?? "",
      assignedToAccountId: task.assignedToAccountId,
      employeeName,
      employeePosition,
      createdAt: formatCardDate(task.createdAt),
      completedAt: task.completedAt
        ? formatCardDate(task.completedAt)
        : undefined,
      expiresAt: formatCardDate(task.expiresAt),
      currentStatus: inferTaskStatus(task),
    }));

    return {
      accountId: account.id,
      employeeName,
      employeePosition,
      tasks,
    };
  });

  return <AdminTaskViewClient taskGroups={taskGroups} />;
}
