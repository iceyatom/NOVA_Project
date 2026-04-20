import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaffSession } from "@/lib/auth/staffAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALERT_DESCRIPTION_MAX_LENGTH = 500;

type CreateAlertPayload = {
  title?: unknown;
  description?: unknown;
  sendToAdmin?: unknown;
  sendToStaff?: unknown;
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
