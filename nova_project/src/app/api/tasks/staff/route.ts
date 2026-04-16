import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function POST(request: NextRequest) {
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
          completedAt: true,
          assignedToAccountId: true,
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
