import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_PAGE_SIZE = 100;

type SortColumn = "displayName" | "email" | "role" | "createdAt" | "lastLogin";
type SortOrder = "asc" | "desc";

type AccountRow = {
  id: number;
  displayName: string | null;
  email: string;
  role: string;
  createdAt: Date;
  lastLoginAt: Date | null;
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
    if (sortBy === "displayName") {
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

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return jsonResponse({ success: false, error: "Unauthorized." }, 401);
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
      return jsonResponse({ success: false, error: "Unauthorized." }, 401);
    }

    const normalizedRole = session.account.role.trim().toUpperCase();
    if (normalizedRole !== "ADMIN" && normalizedRole !== "STAFF") {
      return jsonResponse({ success: false, error: "Forbidden." }, 403);
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
