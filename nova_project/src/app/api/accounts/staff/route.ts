import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_PAGE_SIZE = 100;

type SortColumn =
  | "id"
  | "displayName"
  | "email"
  | "role"
  | "createdAt"
  | "lastLogin";
type SortOrder = "asc" | "desc";
type StaffRole = "ADMIN" | "STAFF";
type AccountRole = "ADMIN" | "STAFF" | "CUSTOMER";

type AccountRow = {
  id: number;
  displayName: string | null;
  email: string;
  phone: string | null;
  role: string;
  createdAt: Date;
  lastLoginAt: Date | null;
};

type SessionAccount = {
  id: number;
  role: string;
  status: string;
  deletedAt: Date | null;
};

type StaffAccountUpdateBody = {
  accountId?: unknown;
  displayName?: unknown;
  email?: unknown;
  phone?: unknown;
  role?: unknown;
};

type StaffAccountDeleteBody = {
  accountId?: unknown;
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

function jsonResponse(body: unknown, status = 200): NextResponse {
  return withNoCache(NextResponse.json(body, { status }));
}

function parseNonNegativeInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function parseSortColumn(value: string | null): SortColumn | null {
  if (
    value === "id" ||
    value === "displayName" ||
    value === "email" ||
    value === "role" ||
    value === "createdAt" ||
    value === "lastLogin"
  ) {
    return value;
  }

  return null;
}

function parseSortOrder(value: string | null): SortOrder {
  return value === "asc" ? "asc" : "desc";
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeRole(value: string): string {
  return value.trim().toUpperCase();
}

function normalizePhone(value: string): string {
  return value.trim();
}

function normalizeDisplayName(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value);
}

function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, "").length === 10;
}

function getPhoneDigitsLength(value: string): number {
  return value.replace(/\D/g, "").length;
}

function parseAccountRole(value: string): AccountRole | null {
  if (value === "ADMIN" || value === "STAFF" || value === "CUSTOMER") {
    return value;
  }
  return null;
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

function roleRank(value: string): number {
  const normalized = value.trim().toUpperCase();
  if (normalized === "ADMIN") return 3;
  if (normalized === "STAFF") return 2;
  if (normalized === "CUSTOMER") return 1;
  return 0;
}

function compareString(a: string, b: string, sortOrder: SortOrder): number {
  const result = a.localeCompare(b, undefined, { sensitivity: "base" });
  return sortOrder === "asc" ? result : -result;
}

function compareNumber(a: number, b: number, sortOrder: SortOrder): number {
  const result = a - b;
  return sortOrder === "asc" ? result : -result;
}

function compareDate(
  a: Date | null,
  b: Date | null,
  sortOrder: SortOrder,
): number {
  const aValue = a ? a.getTime() : Number.NEGATIVE_INFINITY;
  const bValue = b ? b.getTime() : Number.NEGATIVE_INFINITY;
  return compareNumber(aValue, bValue, sortOrder);
}

function sortAccounts(
  rows: AccountRow[],
  sortBy: SortColumn | null,
  sortOrder: SortOrder,
): AccountRow[] {
  const sorted = [...rows];

  if (!sortBy) {
    sorted.sort((left, right) => {
      if (left.createdAt.getTime() !== right.createdAt.getTime()) {
        return right.createdAt.getTime() - left.createdAt.getTime();
      }
      return right.id - left.id;
    });
    return sorted;
  }

  sorted.sort((left, right) => {
    if (sortBy === "id") {
      const byId = compareNumber(left.id, right.id, sortOrder);
      if (byId !== 0) return byId;
    } else if (sortBy === "displayName") {
      const leftName = left.displayName?.trim() || "";
      const rightName = right.displayName?.trim() || "";
      const byName = compareString(leftName, rightName, sortOrder);
      if (byName !== 0) return byName;
    } else if (sortBy === "email") {
      const byEmail = compareString(left.email, right.email, sortOrder);
      if (byEmail !== 0) return byEmail;
    } else if (sortBy === "role") {
      const byRoleRank = compareNumber(
        roleRank(left.role),
        roleRank(right.role),
        sortOrder,
      );
      if (byRoleRank !== 0) return byRoleRank;
    } else if (sortBy === "createdAt") {
      const byCreatedAt = compareDate(
        left.createdAt,
        right.createdAt,
        sortOrder,
      );
      if (byCreatedAt !== 0) return byCreatedAt;
    } else if (sortBy === "lastLogin") {
      const byLastLogin = compareDate(
        left.lastLoginAt,
        right.lastLoginAt,
        sortOrder,
      );
      if (byLastLogin !== 0) return byLastLogin;
    }

    return left.id - right.id;
  });

  return sorted;
}

async function requireStaffSession(
  allowedRoles: ReadonlyArray<StaffRole>,
): Promise<
  | { ok: true; account: SessionAccount; normalizedRole: StaffRole }
  | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return {
      ok: false,
      response: jsonResponse({ success: false, error: "Unauthorized." }, 401),
    };
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      account: {
        select: {
          id: true,
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
    return {
      ok: false,
      response: jsonResponse({ success: false, error: "Unauthorized." }, 401),
    };
  }

  const normalizedRole = normalizeRole(session.account.role);
  if (normalizedRole !== "ADMIN" && normalizedRole !== "STAFF") {
    return {
      ok: false,
      response: jsonResponse({ success: false, error: "Forbidden." }, 403),
    };
  }

  if (!allowedRoles.includes(normalizedRole)) {
    return {
      ok: false,
      response: jsonResponse({ success: false, error: "Forbidden." }, 403),
    };
  }

  return {
    ok: true,
    account: session.account,
    normalizedRole,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStaffSession(["ADMIN", "STAFF"]);
    if (!auth.ok) {
      return auth.response;
    }

    const pageSize = Math.min(
      parseNonNegativeInt(request.nextUrl.searchParams.get("pageSize"), 20),
      MAX_PAGE_SIZE,
    );
    const offset = parseNonNegativeInt(
      request.nextUrl.searchParams.get("offset"),
      0,
    );
    const limit = pageSize > 0 ? pageSize : DEFAULT_LIMIT;
    const sortBy = parseSortColumn(request.nextUrl.searchParams.get("sortBy"));
    const sortOrder = parseSortOrder(
      request.nextUrl.searchParams.get("sortOrder"),
    );

    const allAccounts = await prisma.account.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    const sortedAccounts = sortAccounts(allAccounts, sortBy, sortOrder);
    const totalCount = sortedAccounts.length;
    const accounts = sortedAccounts.slice(offset, offset + limit);

    return jsonResponse({
      success: true,
      data: accounts,
      totalCount,
      limit,
      offset,
      sortBy,
      sortOrder,
    });
  } catch (error) {
    console.error("[accounts/staff] GET failed", error);
    return jsonResponse(
      {
        success: false,
        error: "Unable to load account list.",
      },
      500,
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireStaffSession(["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    let body: StaffAccountUpdateBody;
    try {
      body = (await request.json()) as StaffAccountUpdateBody;
    } catch {
      return jsonResponse({ success: false, error: "Invalid JSON body." }, 400);
    }

    const accountId = parsePositiveInt(body.accountId);
    const incomingEmail =
      typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const incomingPhone =
      typeof body.phone === "string" ? normalizePhone(body.phone) : "";
    const incomingRole =
      typeof body.role === "string" ? normalizeRole(body.role) : "";
    const displayName =
      typeof body.displayName === "string"
        ? normalizeDisplayName(body.displayName)
        : null;

    if (!accountId) {
      return jsonResponse(
        { success: false, error: "A valid account id is required." },
        400,
      );
    }

    if (!incomingEmail || !isValidEmail(incomingEmail)) {
      return jsonResponse(
        { success: false, error: "A valid email address is required." },
        400,
      );
    }

    if (incomingPhone && !isValidPhone(incomingPhone)) {
      const phoneDigitsLength = getPhoneDigitsLength(incomingPhone);
      const phoneError =
        phoneDigitsLength > 10
          ? "Phone number is too long. Use exactly 10 digits."
          : "Phone number is too short. Use exactly 10 digits.";
      return jsonResponse({ success: false, error: phoneError }, 400);
    }

    const nextRole = parseAccountRole(incomingRole);
    if (!nextRole) {
      return jsonResponse(
        { success: false, error: "Role must be ADMIN, STAFF, or CUSTOMER." },
        400,
      );
    }

    const existingAccount = await prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        email: true,
        role: true,
        deletedAt: true,
      },
    });

    if (!existingAccount || existingAccount.deletedAt) {
      return jsonResponse({ success: false, error: "Account not found." }, 404);
    }

    const existingRole = parseAccountRole(normalizeRole(existingAccount.role));
    if (!existingRole) {
      return jsonResponse(
        { success: false, error: "Target account has an invalid role." },
        400,
      );
    }

    if (incomingEmail !== existingAccount.email) {
      const emailConflict = await prisma.account.findUnique({
        where: { email: incomingEmail },
        select: {
          id: true,
          deletedAt: true,
        },
      });

      if (
        emailConflict &&
        !emailConflict.deletedAt &&
        emailConflict.id !== accountId
      ) {
        return jsonResponse(
          {
            success: false,
            error: "An account with that email already exists.",
          },
          409,
        );
      }
    }

    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        displayName,
        email: incomingEmail,
        phone: incomingPhone || null,
        role: nextRole,
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return jsonResponse({
      success: true,
      message: "Account updated successfully.",
      account: updatedAccount,
    });
  } catch (error) {
    console.error("[accounts/staff] PATCH failed", error);
    return jsonResponse(
      {
        success: false,
        error: "Unable to update account.",
      },
      500,
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireStaffSession(["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    let body: StaffAccountDeleteBody;
    try {
      body = (await request.json()) as StaffAccountDeleteBody;
    } catch {
      return jsonResponse({ success: false, error: "Invalid JSON body." }, 400);
    }

    const accountId = parsePositiveInt(body.accountId);

    if (!accountId) {
      return jsonResponse(
        { success: false, error: "A valid account id is required." },
        400,
      );
    }

    if (accountId === auth.account.id) {
      return jsonResponse(
        { success: false, error: "You cannot delete your own account." },
        400,
      );
    }

    const existingAccount = await prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        role: true,
        deletedAt: true,
      },
    });

    if (!existingAccount || existingAccount.deletedAt) {
      return jsonResponse({ success: false, error: "Account not found." }, 404);
    }

    const existingRole = parseAccountRole(normalizeRole(existingAccount.role));
    if (!existingRole) {
      return jsonResponse(
        { success: false, error: "Target account has an invalid role." },
        400,
      );
    }

    await prisma.$transaction([
      prisma.account.update({
        where: { id: accountId },
        data: {
          status: "deleted",
          deletedAt: new Date(),
        },
      }),
      prisma.session.deleteMany({
        where: {
          accountId,
        },
      }),
    ]);

    return jsonResponse({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error("[accounts/staff] DELETE failed", error);
    return jsonResponse(
      {
        success: false,
        error: "Unable to delete account.",
      },
      500,
    );
  }
}
