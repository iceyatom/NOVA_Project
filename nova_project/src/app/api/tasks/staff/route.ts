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
