import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── POST /api/tasks ─────────────────────────────────────────────────────────
// Body: { description, assignedToAccountId, assignedByEmail }
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      description?: unknown;
      assignedToAccountId?: unknown;
      assignedByEmail?: unknown;
    };

    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const assignedToAccountId =
      typeof body.assignedToAccountId === "number"
        ? body.assignedToAccountId
        : Number(body.assignedToAccountId);
    const assignedByEmail =
      typeof body.assignedByEmail === "string"
        ? body.assignedByEmail.trim().toLowerCase()
        : "";

    if (!description) {
      return NextResponse.json(
        { success: false, error: "description is required." },
        { status: 400 },
      );
    }
    if (!Number.isInteger(assignedToAccountId) || assignedToAccountId <= 0) {
      return NextResponse.json(
        { success: false, error: "assignedToAccountId must be a valid account id." },
        { status: 400 },
      );
    }
    if (!assignedByEmail) {
      return NextResponse.json(
        { success: false, error: "assignedByEmail is required." },
        { status: 400 },
      );
    }

    const assignedBy = await prisma.account.findUnique({
      where: { email: assignedByEmail },
      select: { id: true, role: true },
    });

    if (!assignedBy) {
      return NextResponse.json(
        { success: false, error: "assignedByEmail account not found." },
        { status: 404 },
      );
    }
    if (assignedBy.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only admin accounts can create tasks." },
        { status: 403 },
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const task = await (prisma as any).task.create({
      data: {
        description,
        assignedToAccountId,
        assignedByAccountId: assignedBy.id,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tasks = await (prisma as any).task.findMany({
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
