import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENABLE_DB_PERF_LOGS = process.env.ENABLE_DB_PERF_LOGS === "true";

const DEFAULT_LIMIT = 20;
const MAX_PAGE_SIZE = 100;

function logPerformance(args: {
  route: string;
  dataSourceMode: string;
  durationMs: number;
  rowCount: number;
  limit: number;
  offset: number;
  responseSize?: number;
}) {
  if (!ENABLE_DB_PERF_LOGS) return;

  const {
    route,
    dataSourceMode,
    durationMs,
    rowCount,
    limit,
    offset,
    responseSize,
  } = args;
  console.log(
    `[DB_PERF] route=${route} dataSource=${dataSourceMode} duration=${durationMs.toFixed(2)}ms ` +
      `rowCount=${rowCount} limit=${limit} offset=${offset}` +
      (responseSize !== undefined ? ` responseSize=${responseSize}` : ""),
  );
}

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
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
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
  const pageSize = Math.min(
    pageSizeRaw === "all" ? 1000 : parsePositiveInt(pageSizeRaw, DEFAULT_LIMIT),
    MAX_PAGE_SIZE,
  );

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
    const tokens = q.query.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      and.push({
        OR: [
          {
            itemName: {
              contains: token,
            },
          },
          {
            sku: {
              contains: token,
            },
          },
        ],
      });
    }
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
  const startTime = Date.now();
  const where = buildPrismaWhere(q);
  const orderBy = buildPrismaOrderBy(q);

  // Narrow select for staff inventory list view
  const staffListSelect = {
    id: true,
    sku: true,
    itemName: true,
    category1: true,
    quantityInStock: true,
    price: true,
    updatedAt: true,
  };

  const [totalCount, items] = await prisma.$transaction([
    prisma.catalogItem.count({ where }),
    prisma.catalogItem.findMany({
      where,
      orderBy,
      skip: q.offset,
      take: q.limit,
      select: staffListSelect,
    }),
  ]);

  const durationMs = Date.now() - startTime;
  const responseData = {
    success: true,
    data: items,
    totalCount,
    limit: q.limit,
    offset: q.offset,
  };

  logPerformance({
    route: "/api/catalog/staff",
    dataSourceMode: "prisma",
    durationMs,
    rowCount: items.length,
    limit: q.limit,
    offset: q.offset,
    responseSize: JSON.stringify(responseData).length,
  });

  return withNoCache(NextResponse.json(responseData, { status: 200 }));
}

async function tryLambda(q: StaffQuery): Promise<NextResponse> {
  const startTime = Date.now();
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

  if (q.sortBy) {
    upstreamUrl.searchParams.set("sortBy", q.sortBy);
    upstreamUrl.searchParams.set("sortOrder", q.sortOrder);
  }

  // map staff category/subcategory/type onto Lambda categories filter
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
    const durationMs = Date.now() - startTime;
    logPerformance({
      route: "/api/catalog/staff",
      dataSourceMode: "lambda",
      durationMs,
      rowCount: 0,
      limit: q.limit,
      offset: q.offset,
    });

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

  const totalCount =
    parsed &&
    typeof parsed === "object" &&
    typeof (parsed as Record<string, unknown>).totalCount === "number"
      ? ((parsed as Record<string, unknown>).totalCount as number)
      : data.length;

  const durationMs = Date.now() - startTime;
  const responseData = {
    success: true,
    data,
    totalCount,
    limit: q.limit,
    offset: q.offset,
  };

  logPerformance({
    route: "/api/catalog/staff",
    dataSourceMode: "lambda",
    durationMs,
    rowCount: data.length,
    limit: q.limit,
    offset: q.offset,
    responseSize: JSON.stringify(responseData).length,
  });

  return withNoCache(NextResponse.json(responseData, { status: r.status }));
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
