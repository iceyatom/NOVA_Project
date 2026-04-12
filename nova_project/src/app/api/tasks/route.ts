import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── POST /api/tasks ─────────────────────────────────────────────────────────
// Body: { title, description?, assignedToAccountId }
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      title?: unknown;
      description?: unknown;
      assignedToAccountId?: unknown;
    };

    const title =
      typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : undefined;
    const assignedToAccountId =
      typeof body.assignedToAccountId === "number"
        ? body.assignedToAccountId
        : Number(body.assignedToAccountId);

    if (!title) {
      return NextResponse.json(
        { success: false, error: "title is required." },
        { status: 400 },
      );
    }
    if (!Number.isInteger(assignedToAccountId) || assignedToAccountId <= 0) {
      return NextResponse.json(
        { success: false, error: "assignedToAccountId must be a valid account id." },
        { status: 400 },
      );
    }

    // Expiry = end of current calendar day (23:59:59)
    const now = new Date();
    const expiresAt = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        assignedToAccountId,
        expiresAt,
      },
    });

    return NextResponse.json({ success: true, taskId: task.id });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create task." },
      { status: 500 },
    );
  }
}

// ─── GET /api/tasks?email=... ─────────────────────────────────────────────────
// Returns non-expired tasks assigned to the given account email
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "email query param is required." },
        { status: 400 },
      );
    }

    const account = await prisma.account.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!account) {
      return NextResponse.json({ success: true, tasks: [] });
    }

    const now = new Date();
    const tasks = await prisma.task.findMany({
      where: {
        assignedToAccountId: account.id,
        expiresAt: { gte: now },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, description: true, expiresAt: true, createdAt: true },
    });

    return NextResponse.json({ success: true, tasks });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks." },
      { status: 500 },
    );
  }
}
