import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/passwordHash";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_PAGE_SIZE = 100;
const ACCOUNT_NOTES_MAX_LENGTH = 500;
const ALERT_TITLE_MAX_LENGTH = 120;
const ALERT_DESCRIPTION_MAX_LENGTH = 500;

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
  notes: string | null;
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
  accountIds?: unknown;
  displayName?: unknown;
  email?: unknown;
  password?: unknown;
  phone?: unknown;
  notes?: unknown;
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

function normalizeNotes(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value);
}

function isStrongPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value)
  );
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

function parseRoleFilter(value: string | null): AccountRole | null {
  if (!value) {
    return null;
  }

  return parseAccountRole(normalizeRole(value));
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

function clampText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function accountDisplayLabel(
  displayName: string | null,
  email: string,
): string {
  const trimmedDisplayName = displayName?.trim() ?? "";
  if (trimmedDisplayName.length > 0) {
    return `${trimmedDisplayName} (${email})`;
  }

  return email;
}

function permissionAlertTitle(changedCount: number): string {
  if (changedCount <= 1) {
    return "Account permission change";
  }

  return `Bulk account permission change (${changedCount})`;
}

async function createPermissionChangeAlertBestEffort(
  tx: Prisma.TransactionClient,
  title: string,
  description: string,
  adminAccountIds: number[],
): Promise<void> {
  if (adminAccountIds.length === 0) {
    return;
  }

  const accountConnections = adminAccountIds.map((id) => ({ id }));

  try {
    await tx.alert.create({
      data: {
        title,
        description,
        type: "PERMISSION_CHANGE",
        accounts: {
          connect: accountConnections,
        },
      },
      select: {
        id: true,
      },
    });
    return;
  } catch (permissionAlertError) {
    // If DB enum migration is behind, fall back so role updates still succeed.
    console.error(
      "[accounts/staff] permission change alert create failed; falling back to ANNOUNCEMENT",
      permissionAlertError,
    );
  }

  try {
    await tx.alert.create({
      data: {
        title,
        description,
        type: "ANNOUNCEMENT",
        accounts: {
          connect: accountConnections,
        },
      },
      select: {
        id: true,
      },
    });
  } catch (fallbackAlertError) {
    console.error(
      "[accounts/staff] fallback announcement alert create failed",
      fallbackAlertError,
    );
  }
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
    sorted.sort((left, right) => left.id - right.id);
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
    const roleFilter = parseRoleFilter(
      request.nextUrl.searchParams.get("role"),
    );

    const allAccounts = await prisma.account.findMany({
      where: {
        deletedAt: null,
        ...(roleFilter ? { role: roleFilter } : {}),
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        notes: true,
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
      roleFilter,
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
    const hasDisplayName = typeof body.displayName === "string";
    const hasEmail = typeof body.email === "string";
    const hasPassword = typeof body.password === "string";
    const hasPhone = typeof body.phone === "string";
    const hasNotes = typeof body.notes === "string";
    const hasRole = typeof body.role === "string";
    const bulkAccountIdsRaw = Array.isArray(body.accountIds)
      ? body.accountIds
      : null;
    const isBulkRoleUpdate = bulkAccountIdsRaw !== null;
    const incomingEmail = hasEmail ? normalizeEmail(body.email as string) : "";
    const incomingPassword =
      hasPassword && typeof body.password === "string" ? body.password : "";
    const incomingPhone = hasPhone ? normalizePhone(body.phone as string) : "";
    const incomingRole = hasRole ? normalizeRole(body.role as string) : "";
    const displayName = hasDisplayName
      ? normalizeDisplayName(body.displayName as string)
      : null;
    const incomingNotes = hasNotes
      ? normalizeNotes(body.notes as string)
      : null;

    if (isBulkRoleUpdate) {
      if (hasDisplayName || hasEmail || hasPassword || hasPhone || hasNotes) {
        return jsonResponse(
          {
            success: false,
            error: "Bulk update currently supports role changes only.",
          },
          400,
        );
      }

      const nextBulkRole = hasRole ? parseAccountRole(incomingRole) : null;
      if (!nextBulkRole) {
        return jsonResponse(
          { success: false, error: "Role must be ADMIN, STAFF, or CUSTOMER." },
          400,
        );
      }

      const bulkAccountIds = Array.from(
        new Set(
          (bulkAccountIdsRaw ?? [])
            .map((value) => parsePositiveInt(value))
            .filter((value): value is number => value !== null),
        ),
      );

      if (bulkAccountIds.length === 0) {
        return jsonResponse(
          { success: false, error: "Provide at least one account id." },
          400,
        );
      }

      const existingAccounts = await prisma.account.findMany({
        where: {
          id: {
            in: bulkAccountIds,
          },
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
        },
      });

      if (existingAccounts.length !== bulkAccountIds.length) {
        return jsonResponse(
          {
            success: false,
            error: "One or more accounts were not found.",
          },
          404,
        );
      }

      const changedAccounts = existingAccounts.filter(
        (account) => normalizeRole(account.role) !== nextBulkRole,
      );

      if (changedAccounts.length === 0) {
        return jsonResponse({
          success: true,
          message: "No role changes were applied.",
          updatedCount: 0,
        });
      }

      const changedAccountIds = changedAccounts.map((account) => account.id);
      const changeParts = changedAccounts.map((account) => {
        const currentRole = normalizeRole(account.role);
        return `${accountDisplayLabel(account.displayName, account.email)}: ${currentRole} -> ${nextBulkRole}`;
      });

      const alertTitle = clampText(
        permissionAlertTitle(changedAccounts.length),
        ALERT_TITLE_MAX_LENGTH,
      );
      const alertDescription = clampText(
        `Account role updates applied: ${changeParts.join("; ")}`,
        ALERT_DESCRIPTION_MAX_LENGTH,
      );

      await prisma.$transaction(async (tx) => {
        await tx.account.updateMany({
          where: {
            id: {
              in: changedAccountIds,
            },
          },
          data: {
            role: nextBulkRole,
          },
        });

        const adminAccounts = await tx.account.findMany({
          where: {
            deletedAt: null,
            role: "ADMIN",
          },
          select: {
            id: true,
          },
        });

        if (adminAccounts.length > 0) {
          await createPermissionChangeAlertBestEffort(
            tx,
            alertTitle,
            alertDescription,
            adminAccounts.map((account) => account.id),
          );
        }
      });

      return jsonResponse({
        success: true,
        message: "Selected accounts updated successfully.",
        updatedCount: changedAccounts.length,
      });
    }

    if (!accountId) {
      return jsonResponse(
        { success: false, error: "A valid account id is required." },
        400,
      );
    }

    if (
      !hasDisplayName &&
      !hasEmail &&
      !hasPassword &&
      !hasPhone &&
      !hasNotes &&
      !hasRole
    ) {
      return jsonResponse(
        { success: false, error: "Provide at least one field to update." },
        400,
      );
    }

    if (hasEmail && (!incomingEmail || !isValidEmail(incomingEmail))) {
      return jsonResponse(
        { success: false, error: "A valid email address is required." },
        400,
      );
    }

    if (
      hasPassword &&
      incomingPassword &&
      !isStrongPassword(incomingPassword)
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
        },
        400,
      );
    }

    if (hasPhone && incomingPhone && !isValidPhone(incomingPhone)) {
      const phoneDigitsLength = getPhoneDigitsLength(incomingPhone);
      const phoneError =
        phoneDigitsLength > 10
          ? "Phone number is too long. Use exactly 10 digits."
          : "Phone number is too short. Use exactly 10 digits.";
      return jsonResponse({ success: false, error: phoneError }, 400);
    }

    if (
      hasNotes &&
      incomingNotes &&
      incomingNotes.length > ACCOUNT_NOTES_MAX_LENGTH
    ) {
      return jsonResponse(
        {
          success: false,
          error: `Notes must be ${ACCOUNT_NOTES_MAX_LENGTH} characters or fewer.`,
        },
        400,
      );
    }

    const nextRole = hasRole ? parseAccountRole(incomingRole) : null;
    if (hasRole && !nextRole) {
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

    if (hasEmail && incomingEmail !== existingAccount.email) {
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

    const updateData: {
      displayName?: string | null;
      email?: string;
      passwordHash?: string;
      phone?: string | null;
      notes?: string | null;
      role?: AccountRole;
    } = {};
    if (hasDisplayName) {
      updateData.displayName = displayName;
    }
    if (hasEmail) {
      updateData.email = incomingEmail;
    }
    if (hasPassword && incomingPassword) {
      updateData.passwordHash = await hashPassword(incomingPassword);
    }
    if (hasPhone) {
      updateData.phone = incomingPhone || null;
    }
    if (hasNotes) {
      updateData.notes = incomingNotes;
    }
    if (hasRole && nextRole) {
      updateData.role = nextRole;
    }
    const previousRole = normalizeRole(existingAccount.role);
    const shouldCreatePermissionAlert =
      hasRole && nextRole !== null && previousRole !== nextRole;

    const updatedAccount = await prisma.$transaction(async (tx) => {
      const updated = await tx.account.update({
        where: { id: accountId },
        data: updateData,
        select: {
          id: true,
          displayName: true,
          email: true,
          phone: true,
          notes: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (shouldCreatePermissionAlert && nextRole) {
        const adminAccounts = await tx.account.findMany({
          where: {
            deletedAt: null,
            role: "ADMIN",
          },
          select: {
            id: true,
          },
        });

        if (adminAccounts.length > 0) {
          await createPermissionChangeAlertBestEffort(
            tx,
            clampText(permissionAlertTitle(1), ALERT_TITLE_MAX_LENGTH),
            clampText(
              `Account role changed for ${accountDisplayLabel(updated.displayName, updated.email)}: ${previousRole} -> ${nextRole}.`,
              ALERT_DESCRIPTION_MAX_LENGTH,
            ),
            adminAccounts.map((account) => account.id),
          );
        }
      }

      return updated;
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
