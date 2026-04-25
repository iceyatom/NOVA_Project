import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/staffAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ALERT_TITLE_MAX_LENGTH = 120;
const ALERT_DESCRIPTION_MAX_LENGTH = 500;

type CreateTaskPayload = {
  title?: unknown;
  description?: unknown;
  assignedToAccountId?: unknown;
  expiresAt?: unknown;
};

type ReassignTaskPayload = {
  taskId?: unknown;
  title?: unknown;
  description?: unknown;
  status?: unknown;
  assignedToAccountId?: unknown;
  expiresAt?: unknown;
};

type DeleteTaskPayload = {
  taskId?: unknown;
};

type WidgetTaskStatus = "not-started" | "in-progress" | "completed";

function withNoCache(resp: NextResponse) {
  resp.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  resp.headers.set("Pragma", "no-cache");
  resp.headers.set("Expires", "0");
  return resp;
}

function badRequest(message: string) {
  return withNoCache(
    NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 },
    ),
  );
}

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

function mapDbTaskStatus(status: string): WidgetTaskStatus {
  if (status === "NOT_STARTED") return "not-started";
  if (status === "IN_PROGRESS") return "in-progress";
  if (status === "COMPLETE") return "completed";
  return "not-started";
}

function clampText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function formatAlertDate(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStaffSession(["ADMIN", "STAFF"]);
    if (!auth.ok) {
      return auth.response;
    }

    const accountIdParam = request.nextUrl.searchParams.get("accountId") ?? "";
    const accountId = Number.parseInt(accountIdParam, 10);

    if (!Number.isInteger(accountId) || accountId <= 0) {
      return badRequest("A valid accountId query parameter is required.");
    }

    if (auth.account.id !== accountId) {
      return withNoCache(
        NextResponse.json(
          {
            success: false,
            error: "Forbidden.",
          },
          { status: 403 },
        ),
      );
    }

    const limitParam = request.nextUrl.searchParams.get("limit");
    const requestedLimit = limitParam ? Number.parseInt(limitParam, 10) : 5;
    const taskLimit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 20)
        : 5;

    const tasks = await prisma.task.findMany({
      where: {
        assignedToAccountId: accountId,
      },
      orderBy: [{ createdAt: "asc" }],
      take: taskLimit,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        assignedToAccountId: true,
        createdAt: true,
        completedAt: true,
        expiresAt: true,
        assignedTo: {
          select: {
            email: true,
            displayName: true,
            role: true,
          },
        },
      },
    });

    const mappedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description ?? "",
      assignedToAccountId: task.assignedToAccountId,
      employeeName:
        task.assignedTo.displayName?.trim() || task.assignedTo.email,
      employeePosition: roleToPosition(task.assignedTo.role),
      createdAt: formatCardDate(task.createdAt),
      completedAt: task.completedAt
        ? formatCardDate(task.completedAt)
        : undefined,
      expiresAt: formatCardDate(task.expiresAt),
      expiresAtIso: task.expiresAt.toISOString(),
      currentStatus: mapDbTaskStatus(task.status),
    }));

    return withNoCache(
      NextResponse.json(
        {
          success: true,
          tasks: mappedTasks,
        },
        { status: 200 },
      ),
    );
  } catch (error) {
    console.error("GET /api/tasks/staff failed", error);
    return withNoCache(
      NextResponse.json(
        {
          success: false,
          error: "Failed to fetch tasks.",
        },
        { status: 500 },
      ),
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = (await request.json()) as CreateTaskPayload;

    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const description =
      typeof payload.description === "string" ? payload.description.trim() : "";
    const assignedToAccountId =
      typeof payload.assignedToAccountId === "number"
        ? payload.assignedToAccountId
        : Number.NaN;
    const expiresAtRaw =
      typeof payload.expiresAt === "string" ? payload.expiresAt : "";
    const expiresAt = new Date(expiresAtRaw);

    if (!title) {
      return badRequest("Task title is required.");
    }

    if (!description) {
      return badRequest("Task description is required.");
    }

    if (!Number.isInteger(assignedToAccountId) || assignedToAccountId <= 0) {
      return badRequest("Assigned employee is required.");
    }

    if (!expiresAtRaw || Number.isNaN(expiresAt.getTime())) {
      return badRequest("A valid due date is required.");
    }

    const assignee = await prisma.account.findFirst({
      where: {
        id: assignedToAccountId,
        deletedAt: null,
        role: {
          in: ["ADMIN", "STAFF"],
        },
      },
      select: {
        id: true,
      },
    });

    if (!assignee) {
      return withNoCache(
        NextResponse.json(
          {
            success: false,
            error: "Assigned employee was not found.",
          },
          { status: 404 },
        ),
      );
    }

    const createdTask = await prisma.task.create({
      data: {
        title,
        description,
        assignedToAccountId,
        expiresAt,
      },
      select: {
        id: true,
      },
    });

    return withNoCache(
      NextResponse.json(
        {
          success: true,
          taskId: createdTask.id,
        },
        { status: 201 },
      ),
    );
  } catch (error) {
    console.error("POST /api/tasks/staff failed", error);
    return withNoCache(
      NextResponse.json(
        {
          success: false,
          error: "Failed to create task.",
        },
        { status: 500 },
      ),
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = (await request.json()) as ReassignTaskPayload;

    const taskId =
      typeof payload.taskId === "number" ? payload.taskId : Number.NaN;
    const title =
      typeof payload.title === "string" ? payload.title.trim() : undefined;
    const description =
      typeof payload.description === "string"
        ? payload.description.trim()
        : undefined;
    const assignedToAccountIdRaw =
      typeof payload.assignedToAccountId === "number"
        ? payload.assignedToAccountId
        : undefined;
    const expiresAtRaw =
      typeof payload.expiresAt === "string" ? payload.expiresAt : undefined;
    const nextStatus =
      payload.status === "not-started" ||
      payload.status === "in-progress" ||
      payload.status === "completed"
        ? payload.status
        : undefined;

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return badRequest("Task ID is required.");
    }

    const hasTitle = title !== undefined;
    const hasDescription = description !== undefined;
    const hasAssignee = assignedToAccountIdRaw !== undefined;
    const hasExpiresAt = expiresAtRaw !== undefined;
    const hasStatus = nextStatus !== undefined;

    if (
      !hasTitle &&
      !hasDescription &&
      !hasAssignee &&
      !hasExpiresAt &&
      !hasStatus
    ) {
      return badRequest("At least one task field must be provided.");
    }

    if (hasTitle && !title) {
      return badRequest("Task title is required.");
    }

    if (hasDescription && !description) {
      return badRequest("Task description is required.");
    }

    if (
      hasAssignee &&
      (!Number.isInteger(assignedToAccountIdRaw) || assignedToAccountIdRaw <= 0)
    ) {
      return badRequest("Assigned employee is required.");
    }

    const expiresAt = hasExpiresAt ? new Date(expiresAtRaw) : null;
    if (hasExpiresAt && Number.isNaN(expiresAt?.getTime())) {
      return badRequest("A valid due date is required.");
    }

    if (payload.status !== undefined && !hasStatus) {
      return badRequest(
        "Status must be not-started, in-progress, or completed.",
      );
    }

    const [task, assignee] = await Promise.all([
      prisma.task.findUnique({
        where: {
          id: taskId,
        },
        select: {
          id: true,
          title: true,
          completedAt: true,
          assignedToAccountId: true,
          assignedTo: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
      }),
      hasAssignee
        ? prisma.account.findFirst({
            where: {
              id: assignedToAccountIdRaw,
              deletedAt: null,
              role: {
                in: ["ADMIN", "STAFF"],
              },
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve({ id: -1 }),
    ]);

    if (!task) {
      return withNoCache(
        NextResponse.json(
          {
            success: false,
            error: "Task was not found.",
          },
          { status: 404 },
        ),
      );
    }

    if (hasAssignee && !assignee) {
      return withNoCache(
        NextResponse.json(
          {
            success: false,
            error: "Assigned employee was not found.",
          },
          { status: 404 },
        ),
      );
    }

    const data: {
      title?: string;
      description?: string;
      assignedToAccountId?: number;
      expiresAt?: Date;
      status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";
      completedAt?: Date | null;
    } = {};

    if (hasTitle && title) {
      data.title = title;
    }

    if (hasDescription && description) {
      data.description = description;
    }

    if (hasAssignee) {
      data.assignedToAccountId = assignedToAccountIdRaw;
    }

    if (hasExpiresAt && expiresAt) {
      data.expiresAt = expiresAt;
    }

    if (hasStatus) {
      if (nextStatus === "not-started") {
        data.status = "NOT_STARTED";
        data.completedAt = null;
      } else if (nextStatus === "in-progress") {
        data.status = "IN_PROGRESS";
        data.completedAt = null;
      } else {
        data.status = "COMPLETE";
        data.completedAt = task.completedAt ?? new Date();
      }
    }

    await prisma.task.update({
      where: {
        id: taskId,
      },
      data,
      select: {
        id: true,
      },
    });

    const transitionedToComplete =
      hasStatus && nextStatus === "completed" && task.completedAt === null;

    if (transitionedToComplete) {
      const completionTime = data.completedAt ?? new Date();
      const completerName =
        task.assignedTo.displayName?.trim() || task.assignedTo.email;
      const alertTitle = clampText(
        `${completerName} completed ${task.title}`,
        ALERT_TITLE_MAX_LENGTH,
      );
      const alertDescription = clampText(
        `${completerName} completed task "${task.title}" at ${formatAlertDate(completionTime)}.`,
        ALERT_DESCRIPTION_MAX_LENGTH,
      );

      try {
        const adminAccounts = await prisma.account.findMany({
          where: {
            deletedAt: null,
            role: "ADMIN",
          },
          select: {
            id: true,
          },
        });

        if (adminAccounts.length > 0) {
          const adminConnections = adminAccounts.map((account) => ({
            id: account.id,
          }));

          try {
            await prisma.alert.create({
              data: {
                title: alertTitle,
                description: alertDescription,
                type: "TASK_COMPLETE",
                accounts: {
                  connect: adminConnections,
                },
              },
              select: {
                id: true,
              },
            });
          } catch (taskCompleteAlertError) {
            console.error(
              "TASK_COMPLETE alert create failed; falling back to ANNOUNCEMENT",
              taskCompleteAlertError,
            );
            await prisma.alert.create({
              data: {
                title: alertTitle,
                description: alertDescription,
                type: "ANNOUNCEMENT",
                accounts: {
                  connect: adminConnections,
                },
              },
              select: {
                id: true,
              },
            });
          }
        }
      } catch (alertError) {
        console.error("Failed to create task completion alert", alertError);
      }
    }

    return withNoCache(
      NextResponse.json(
        {
          success: true,
          taskId,
          assignedToAccountId:
            data.assignedToAccountId ?? task.assignedToAccountId,
        },
        { status: 200 },
      ),
    );
  } catch (error) {
    console.error("PATCH /api/tasks/staff failed", error);
    return withNoCache(
      NextResponse.json(
        {
          success: false,
          error: "Failed to update task.",
        },
        { status: 500 },
      ),
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = (await request.json()) as DeleteTaskPayload;
    const taskId =
      typeof payload.taskId === "number" ? payload.taskId : Number.NaN;

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return badRequest("Task ID is required.");
    }

    const result = await prisma.task.deleteMany({
      where: {
        id: taskId,
      },
    });

    if (result.count === 0) {
      return withNoCache(
        NextResponse.json(
          {
            success: false,
            error: "Task was not found.",
          },
          { status: 404 },
        ),
      );
    }

    return withNoCache(
      NextResponse.json(
        {
          success: true,
          taskId,
        },
        { status: 200 },
      ),
    );
  } catch (error) {
    console.error("DELETE /api/tasks/staff failed", error);
    return withNoCache(
      NextResponse.json(
        {
          success: false,
          error: "Failed to delete task.",
        },
        { status: 500 },
      ),
    );
  }
}
