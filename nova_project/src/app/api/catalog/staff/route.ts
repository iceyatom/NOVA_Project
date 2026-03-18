import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;

type DataSourceMode = "auto" | "prisma" | "lambda";

function getDataSourceMode(): DataSourceMode {
  const raw = (process.env.CATALOG_DATA_SOURCE ?? "auto").trim().toLowerCase();

  if (raw === "prisma" || raw === "lambda" || raw === "auto") {
    return raw;
  }

  return "auto";
}

function getLambdaBaseUrl(): string {
  return (
    process.env.CATALOG_LAMBDA_BASE_URL ||
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).trim();
}

function hasPrismaConfig(): boolean {
  return Boolean((process.env.DATABASE_URL ?? "").trim());
}

function hasLambdaConfig(): boolean {
  return Boolean(getLambdaBaseUrl());
}

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function withNoCache(resp: NextResponse) {
  resp.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  resp.headers.set("Pragma", "no-cache");
  resp.headers.set("Expires", "0");
  return resp;
}

type StaffQuery = {
  limit: number;
  offset: number;
  category: string;
  subcategory: string;
  type: string;
  query: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

function parseStaffQuery(request: NextRequest): StaffQuery {
  const sp = new URL(request.url).searchParams;

  const pageSizeRaw = sp.get("pageSize");
  const pageSize =
    pageSizeRaw === "all" ? 1000 : parsePositiveInt(pageSizeRaw, DEFAULT_LIMIT);

  const offset = parsePositiveInt(sp.get("offset"), 0);
  const category = sp.get("category") || "all";
  const subcategory = sp.get("subcategory") || "all";
  const type = sp.get("type") || "all";
  const query = (sp.get("query") || "").trim();
  const sortBy = sp.get("sortBy") || "";
  const sortOrder = sp.get("sortOrder") === "desc" ? "desc" : "asc";

  return {
    limit: pageSize,
    offset,
    category,
    subcategory,
    type,
    query,
    sortBy,
    sortOrder,
  };
}

function buildPrismaWhere(q: StaffQuery) {
  const and: Record<string, unknown>[] = [];

  if (q.query) {
    and.push({
      OR: [
        {
          itemName: {
            contains: q.query,
          },
        },
        {
          sku: {
            contains: q.query,
          },
        },
      ],
    });
  }

  if (q.category !== "all") {
    and.push({ category3: q.category });
  }

  if (q.subcategory !== "all") {
    and.push({ category2: q.subcategory });
  }

  if (q.type !== "all") {
    and.push({ category1: q.type });
  }

  return and.length > 0 ? { AND: and } : undefined;
}

function buildPrismaOrderBy(q: StaffQuery) {
  switch (q.sortBy) {
    case "sku":
      return { sku: q.sortOrder };
    case "name":
      return { itemName: q.sortOrder };
    case "category":
      return { category1: q.sortOrder };
    case "stock":
      return { quantityInStock: q.sortOrder };
    case "price":
      return { price: q.sortOrder };
    case "lastModified":
      return { updatedAt: q.sortOrder };
    default:
      return { id: "asc" as const };
  }
}

async function tryPrisma(q: StaffQuery): Promise<NextResponse> {
  const where = buildPrismaWhere(q);
  const orderBy = buildPrismaOrderBy(q);

  const items = await prisma.catalogItem.findMany({
    where,
    orderBy,
    skip: q.offset,
    take: q.limit,
  });

  return withNoCache(NextResponse.json(items, { status: 200 }));
}

async function tryLambda(q: StaffQuery): Promise<NextResponse> {
  const upstreamBase = getLambdaBaseUrl();

  if (!upstreamBase) {
    return withNoCache(
      NextResponse.json(
        { success: false, error: "Lambda base URL is not set" },
        { status: 500 },
      ),
    );
  }

  const normalizedBase = upstreamBase.endsWith("/catalog")
    ? upstreamBase
    : `${upstreamBase.replace(/\/$/, "")}/catalog`;

  const upstreamUrl = new URL(normalizedBase);

  upstreamUrl.searchParams.set("limit", String(q.limit));
  upstreamUrl.searchParams.set("offset", String(q.offset));

  if (q.query) {
    upstreamUrl.searchParams.set("q", q.query);
  }

  // map staff category/subcategory/type onto Lambda categories filter
  // most specific wins
  const categoryFilters: string[] = [];
  if (q.category !== "all") categoryFilters.push(q.category);
  if (q.subcategory !== "all") categoryFilters.push(q.subcategory);
  if (q.type !== "all") categoryFilters.push(q.type);

  if (categoryFilters.length > 0) {
    upstreamUrl.searchParams.set("categories", categoryFilters.join(","));
  }

  const r = await fetch(upstreamUrl.toString(), { cache: "no-store" });
  const text = await r.text();

  let parsed: unknown = null;

  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    return withNoCache(
      new NextResponse(text, {
        status: r.status,
        headers: {
          "Content-Type": r.headers.get("content-type") ?? "text/plain",
        },
      }),
    );
  }

  const data =
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as Record<string, unknown>).data)
      ? ((parsed as Record<string, unknown>).data as unknown[])
      : [];

  return withNoCache(NextResponse.json(data, { status: r.status }));
}

function errorResponse(message: string, details?: string, status = 500) {
  return withNoCache(
    NextResponse.json(
      {
        success: false,
        error: message,
        ...(details ? { details } : {}),
      },
      { status },
    ),
  );
}

export async function GET(request: NextRequest) {
  const q = parseStaffQuery(request);
  const mode = getDataSourceMode();

  if (mode === "prisma") {
    if (!hasPrismaConfig()) {
      return errorResponse("DATABASE_URL is not set for prisma mode.");
    }

    try {
      return await tryPrisma(q);
    } catch (error) {
      return errorResponse(
        "Prisma staff catalog query failed.",
        error instanceof Error ? error.message : "Unknown Prisma error",
      );
    }
  }

  if (mode === "lambda") {
    if (!hasLambdaConfig()) {
      return errorResponse("Lambda base URL is not set for lambda mode.");
    }

    try {
      return await tryLambda(q);
    } catch (error) {
      return errorResponse(
        "Lambda staff catalog request failed.",
        error instanceof Error ? error.message : "Unknown Lambda error",
        502,
      );
    }
  }

  if (hasPrismaConfig()) {
    try {
      return await tryPrisma(q);
    } catch (error) {
      console.error("Staff catalog Prisma failed in auto mode:", error);

      if (hasLambdaConfig()) {
        try {
          return await tryLambda(q);
        } catch (lambdaError) {
          return errorResponse(
            "Both Prisma and Lambda staff catalog requests failed.",
            `Prisma: ${
              error instanceof Error ? error.message : "Unknown Prisma error"
            } | Lambda: ${
              lambdaError instanceof Error
                ? lambdaError.message
                : "Unknown Lambda error"
            }`,
            502,
          );
        }
      }

      return errorResponse(
        "Prisma staff catalog query failed.",
        error instanceof Error ? error.message : "Unknown Prisma error",
      );
    }
  }

  if (hasLambdaConfig()) {
    try {
      return await tryLambda(q);
    } catch (error) {
      return errorResponse(
        "Lambda staff catalog request failed.",
        error instanceof Error ? error.message : "Unknown Lambda error",
        502,
      );
    }
  }

  return errorResponse(
    "No staff catalog data source is configured.",
    "Set DATABASE_URL or CATALOG_LAMBDA_BASE_URL.",
  );
}
