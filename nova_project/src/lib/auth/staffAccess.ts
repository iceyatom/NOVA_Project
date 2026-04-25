import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export type StaffRole = "ADMIN" | "STAFF";

export type ActiveSessionAccount = {
  id: number;
  email: string;
  displayName: string | null;
  role: string;
  status: string;
  deletedAt: Date | null;
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

function authErrorResponse(status: 401 | 403): NextResponse {
  return withNoCache(
    NextResponse.json(
      {
        success: false,
        error: status === 401 ? "Unauthorized." : "Forbidden.",
      },
      { status },
    ),
  );
}

export function normalizeRole(value: string): string {
  return value.trim().toUpperCase();
}

export function isStaffRole(value: string): value is StaffRole {
  return value === "ADMIN" || value === "STAFF";
}

export async function getActiveSessionAccount(): Promise<ActiveSessionAccount | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      account: {
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          status: true,
          deletedAt: true,
        },
      },
    },
  });

  if (
    !session ||
    session.expiresAt < new Date() ||
    !session.account ||
    session.account.deletedAt ||
    session.account.status.toLowerCase() !== "active"
  ) {
    return null;
  }

  return session.account;
}

export async function requireStaffSession(
  allowedRoles: ReadonlyArray<StaffRole> = ["ADMIN", "STAFF"],
): Promise<
  | { ok: true; account: ActiveSessionAccount; normalizedRole: StaffRole }
  | { ok: false; response: NextResponse }
> {
  const account = await getActiveSessionAccount();

  if (!account) {
    return {
      ok: false,
      response: authErrorResponse(401),
    };
  }

  const normalizedRole = normalizeRole(account.role);
  if (!isStaffRole(normalizedRole) || !allowedRoles.includes(normalizedRole)) {
    return {
      ok: false,
      response: authErrorResponse(403),
    };
  }

  return {
    ok: true,
    account,
    normalizedRole,
  };
}
