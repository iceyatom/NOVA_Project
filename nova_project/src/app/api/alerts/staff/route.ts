import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaffSession } from "@/lib/auth/staffAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALERT_TITLE_MAX_LENGTH = 120;
const ALERT_DESCRIPTION_MAX_LENGTH = 500;
const DEFAULT_ALERT_LIMIT = 5;
const MAX_ALERT_LIMIT = 20;

type CreateAlertPayload = {
  title?: unknown;
  description?: unknown;
  sendToAdmin?: unknown;
  sendToStaff?: unknown;
};

type DismissAlertPayload = {
  alertId?: unknown;
};

function withNoCache(response: NextResponse): NextResponse {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function badRequest(message: string): NextResponse {
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

function parsePositiveInt(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const requestedLimit = Number.parseInt(
      request.nextUrl.searchParams.get("limit") ?? "",
      10,
    );
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, MAX_ALERT_LIMIT)
        : DEFAULT_ALERT_LIMIT;

    const baseWhere = {
      accounts: {
        some: {
          id: auth.account.id,
        },
      },
    } as const;

    const [count, alerts] = await Promise.all([
      prisma.alert.count({
        where: baseWhere,
      }),
      prisma.alert.findMany({
        where: baseWhere,
        orderBy: [{ creationTime: "desc" }],
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          creationTime: true,
        },
      }),
    ]);

    const mappedAlerts = alerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      description: alert.description,
      type: alert.type,
      creationTime: alert.creationTime.toISOString(),
    }));

    return withNoCache(
      NextResponse.json(
        {
          success: true,
          count,
          alerts: mappedAlerts,
        },
        { status: 200 },
      ),
    );
  } catch (error) {
    console.error("GET /api/alerts/staff failed", error);
    return withNoCache(
      NextResponse.json(
        {
          success: false,
          error: "Failed to load alerts.",
        },
        { status: 500 },
      ),
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN"]);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = (await request.json()) as CreateAlertPayload;

    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const description =
      typeof payload.description === "string" ? payload.description.trim() : "";
    const sendToAdmin = payload.sendToAdmin === true;
    const sendToStaff = payload.sendToStaff === true;

    if (!title) {
      return badRequest("Announcement title is required.");
    }

    if (title.length > ALERT_TITLE_MAX_LENGTH) {
      return badRequest(
        `Announcement title must be ${ALERT_TITLE_MAX_LENGTH} characters or fewer.`,
      );
    }

    if (!description) {
      return badRequest("Announcement description is required.");
    }

    if (description.length > ALERT_DESCRIPTION_MAX_LENGTH) {
      return badRequest(
        `Announcement description must be ${ALERT_DESCRIPTION_MAX_LENGTH} characters or fewer.`,
      );
    }

    if (!sendToAdmin && !sendToStaff) {
      return badRequest("Select at least one recipient type.");
    }

    const recipientRoles: string[] = [];
    if (sendToAdmin) recipientRoles.push("ADMIN");
    if (sendToStaff) recipientRoles.push("STAFF");

    const recipientAccounts = await prisma.account.findMany({
      where: {
        deletedAt: null,
        role: {
          in: recipientRoles,
        },
      },
      select: {
        id: true,
      },
    });

    if (recipientAccounts.length === 0) {
      return withNoCache(
        NextResponse.json(
          {
            success: false,
            error: "No recipient accounts found for the selected audience.",
          },
          { status: 404 },
        ),
      );
    }

    const createdAlert = await prisma.alert.create({
      data: {
        title,
        description,
        type: "ANNOUNCEMENT",
        accounts: {
          connect: recipientAccounts.map((account) => ({ id: account.id })),
        },
      },
      select: {
        id: true,
      },
    });

    return withNoCache(
      NextResponse.json(
        {
          success: true,
          alertId: createdAlert.id,
          recipientCount: recipientAccounts.length,
        },
        { status: 201 },
      ),
    );
  } catch (error) {
    console.error("POST /api/alerts/staff failed", error);
    return withNoCache(
      NextResponse.json(
        {
          success: false,
          error: "Failed to create announcement.",
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
    let payload: DismissAlertPayload;
    try {
      payload = (await request.json()) as DismissAlertPayload;
    } catch {
      return badRequest("Invalid JSON body.");
    }

    const alertId = parsePositiveInt(payload.alertId);
    if (!alertId) {
      return badRequest("A valid alertId is required.");
    }

    const dismissResult = await prisma.$transaction(async (tx) => {
      const alert = await tx.alert.findFirst({
        where: {
          id: alertId,
          accounts: {
            some: {
              id: auth.account.id,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!alert) {
        return { kind: "not_found" as const };
      }

      const updatedAlert = await tx.alert.update({
        where: {
          id: alertId,
        },
        data: {
          accounts: {
            disconnect: {
              id: auth.account.id,
            },
          },
        },
        select: {
          id: true,
          _count: {
            select: {
              accounts: true,
            },
          },
        },
      });

      if (updatedAlert._count.accounts === 0) {
        await tx.alert.delete({
          where: {
            id: alertId,
          },
          select: {
            id: true,
          },
        });
        return { kind: "dismissed" as const, deletedAlert: true };
      }

      return { kind: "dismissed" as const, deletedAlert: false };
    });

    if (dismissResult.kind === "not_found") {
      return withNoCache(
        NextResponse.json(
          {
            success: false,
            error: "Alert was not found.",
          },
          { status: 404 },
        ),
      );
    }

    return withNoCache(
      NextResponse.json(
        {
          success: true,
          alertId,
          deletedAlert: dismissResult.deletedAlert,
        },
        { status: 200 },
      ),
    );
  } catch (error) {
    console.error("DELETE /api/alerts/staff failed", error);
    return withNoCache(
      NextResponse.json(
        {
          success: false,
          error: "Failed to dismiss alert.",
        },
        { status: 500 },
      ),
    );
  }
}
