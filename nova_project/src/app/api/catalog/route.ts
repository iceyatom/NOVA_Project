import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const ALLOWED_LIMITS = new Set([20, 50, 100]);

const PRICE_BUCKETS = new Map<string, { min?: number; max?: number }>([
  ["under-50", { max: 49.99 }],
  ["50-99", { min: 50, max: 99.99 }],
  ["100-249", { min: 100, max: 249.99 }],
  ["250-plus", { min: 250 }],
]);

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

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseCsv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

type CatalogQuery = {
  id: number | null;
  limit: number;
  offset: number;
  q: string;
  categories: string[];
  priceBuckets: string[];
  categoriesCsv: string;
  priceBucketsCsv: string;
};

type CatalogResponse = {
  success: boolean;
  data: unknown[] | unknown | null;
  count: number;
  totalCount: number;
  limit: number;
  offset: number;
  error?: string;
  details?: string;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown, key: string): string | null {
  if (!isRecord(value)) return null;
  const v = value[key];
  return typeof v === "string" ? v : null;
}

function getNumber(value: unknown, key: string): number | null {
  if (!isRecord(value)) return null;
  const v = value[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function getArray(value: unknown, key: string): unknown[] | null {
  if (!isRecord(value)) return null;
  const v = value[key];
  return Array.isArray(v) ? (v as unknown[]) : null;
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

function parseCatalogQuery(request: NextRequest): CatalogQuery {
  const url = new URL(request.url);
  const sp = url.searchParams;

  const id = parsePositiveInt(sp.get("id"));

  const requestedLimit = parsePositiveInt(sp.get("limit"));
  const limit =
    requestedLimit && ALLOWED_LIMITS.has(requestedLimit)
      ? requestedLimit
      : DEFAULT_LIMIT;

  const page = parsePositiveInt(sp.get("page"));
  const offset =
    parsePositiveInt(sp.get("offset")) ?? (page ? (page - 1) * limit : 0);
  const safeOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;

  const q = sp.get("q")?.trim() ?? "";

  const categoriesCsv = sp.get("categories") ?? "";
  const priceBucketsCsv = sp.get("priceBuckets") ?? "";

  const categories = parseCsv(categoriesCsv);
  const priceBuckets = parseCsv(priceBucketsCsv);

  return {
    id,
    limit,
    offset: safeOffset,
    q,
    categories,
    priceBuckets,
    categoriesCsv,
    priceBucketsCsv,
  };
}

function shapeResponse(args: {
  data: unknown[] | unknown | null;
  totalCount: number;
  limit: number;
  offset: number;
}): CatalogResponse {
  const count = Array.isArray(args.data) ? args.data.length : args.data ? 1 : 0;

  return {
    success: true,
    data: args.data,
    count,
    totalCount: args.totalCount,
    limit: args.limit,
    offset: args.offset,
  };
}

function normalizeLambdaPayload(
  raw: unknown,
  limit: number,
  offset: number,
): CatalogResponse {
  const body = getString(raw, "body");

  if (body !== null) {
    try {
      const inner: unknown = JSON.parse(body);
      return normalizeLambdaPayload(inner, limit, offset);
    } catch {
      return {
        success: false,
        data: [],
        count: 0,
        totalCount: 0,
        limit,
        offset,
        error: "Lambda returned an invalid JSON body wrapper.",
      };
    }
  }

  const success = isRecord(raw) && raw["success"] === false ? false : true;

  if (!success) {
    const error =
      isRecord(raw) && typeof raw["error"] === "string"
        ? (raw["error"] as string)
        : "Lambda request failed";

    const details =
      isRecord(raw) && typeof raw["details"] === "string"
        ? (raw["details"] as string)
        : undefined;

    return {
      success: false,
      data: [],
      count: 0,
      totalCount: 0,
      limit,
      offset,
      error,
      details,
    };
  }

  const dataField = isRecord(raw) ? raw["data"] : raw;

  if (Array.isArray(dataField)) {
    const totalCount =
      getNumber(raw, "totalCount") ??
      getNumber(raw, "total") ??
      getNumber(raw, "total_count") ??
      dataField.length;

    return shapeResponse({ data: dataField, totalCount, limit, offset });
  }

  if (dataField && typeof dataField === "object") {
    return shapeResponse({
      data: dataField,
      totalCount: 1,
      limit,
      offset,
    });
  }

  return shapeResponse({
    data: null,
    totalCount: 0,
    limit,
    offset,
  });
}

function buildPrismaWhere(q: CatalogQuery) {
  const whereFilters: Record<string, unknown>[] = [];

  if (q.id) {
    whereFilters.push({ id: q.id });
  }

  if (q.q) {
    whereFilters.push({
      itemName: {
        contains: q.q,
      },
    });
  }

  if (q.categories.length > 0) {
    whereFilters.push({
      OR: [
        { category1: { in: q.categories } },
        { category2: { in: q.categories } },
        { category3: { in: q.categories } },
      ],
    });
  }

  if (q.priceBuckets.length > 0) {
    const ranges = q.priceBuckets
      .map((bucket) => PRICE_BUCKETS.get(bucket))
      .filter(Boolean) as Array<{ min?: number; max?: number }>;

    if (ranges.length > 0) {
      whereFilters.push({
        OR: ranges.map((range) => ({
          price: {
            ...(range.min !== undefined ? { gte: range.min } : {}),
            ...(range.max !== undefined ? { lte: range.max } : {}),
          },
        })),
      });
    }
  }

  return whereFilters.length > 0 ? { AND: whereFilters } : undefined;
}

async function tryPrisma(q: CatalogQuery): Promise<NextResponse> {
  const where = buildPrismaWhere(q);

  const select = {
    id: true,
    sku: true,
    itemName: true,
    price: true,
    category1: true,
    category2: true,
    category3: true,
    description: true,
    quantityInStock: true,
    unitOfMeasure: true,
    storageLocation: true,
    storageConditions: true,
    expirationDate: true,
    dateAcquired: true,
    reorderLevel: true,
    unitCost: true,
    createdAt: true,
    updatedAt: true,
  };

  if (q.id) {
    const item = await prisma.catalogItem.findUnique({
      where: { id: q.id },
      select,
    });

    const response = NextResponse.json(
      shapeResponse({
        data: item,
        totalCount: item ? 1 : 0,
        limit: q.limit,
        offset: q.offset,
      }),
      { status: item ? 200 : 404 },
    );

    return withNoCache(response);
  }

  const [totalCount, catalogItems] = await prisma.$transaction([
    prisma.catalogItem.count({ where }),
    prisma.catalogItem.findMany({
      select,
      orderBy: { id: "asc" },
      take: q.limit,
      skip: q.offset,
      where,
    }),
  ]);

  const response = NextResponse.json(
    shapeResponse({
      data: catalogItems as unknown[],
      totalCount,
      limit: q.limit,
      offset: q.offset,
    }),
    { status: 200 },
  );

  return withNoCache(response);
}

async function tryLambda(q: CatalogQuery): Promise<NextResponse> {
  const upstreamBase = getLambdaBaseUrl();

  if (!upstreamBase) {
    return NextResponse.json(
      { success: false, error: "Lambda base URL is not set" },
      { status: 500 },
    );
  }

  const normalizedBase = upstreamBase.endsWith("/catalog")
    ? upstreamBase
    : `${upstreamBase.replace(/\/$/, "")}/catalog`;

  const upstreamUrl = new URL(normalizedBase);

  if (q.id) {
    upstreamUrl.searchParams.set("id", String(q.id));
  } else {
    upstreamUrl.searchParams.set("limit", String(q.limit));
    upstreamUrl.searchParams.set("offset", String(q.offset));
  }

  if (q.q) upstreamUrl.searchParams.set("q", q.q);
  if (q.categoriesCsv) {
    upstreamUrl.searchParams.set("categories", q.categoriesCsv);
  }
  if (q.priceBucketsCsv) {
    upstreamUrl.searchParams.set("priceBuckets", q.priceBucketsCsv);
  }

  const r = await fetch(upstreamUrl.toString(), { cache: "no-store" });
  const text = await r.text();

  let parsed: unknown = null;

  try {
    parsed = text ? (JSON.parse(text) as unknown) : null;
  } catch {
    const passthrough = new NextResponse(text, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("content-type") ?? "text/plain",
      },
    });
    return withNoCache(passthrough);
  }

  const normalized = normalizeLambdaPayload(parsed, q.limit, q.offset);
  const response = NextResponse.json(normalized, { status: r.status });
  return withNoCache(response);
}

function errorResponse(
  message: string,
  details?: string,
  status = 500,
  limit = DEFAULT_LIMIT,
  offset = 0,
) {
  return withNoCache(
    NextResponse.json(
      {
        success: false,
        data: [],
        count: 0,
        totalCount: 0,
        limit,
        offset,
        error: message,
        ...(details ? { details } : {}),
      },
      { status },
    ),
  );
}

export async function GET(request: NextRequest) {
  const q = parseCatalogQuery(request);
  const mode = getDataSourceMode();

  if (mode === "prisma") {
    if (!hasPrismaConfig()) {
      return errorResponse(
        "CATALOG_DATA_SOURCE=prisma but DATABASE_URL is not set.",
        undefined,
        500,
        q.limit,
        q.offset,
      );
    }

    try {
      return await tryPrisma(q);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown Prisma error";
      console.error("Catalog API Prisma failed:", error);
      return errorResponse(
        "Prisma catalog query failed.",
        msg,
        500,
        q.limit,
        q.offset,
      );
    }
  }

  if (mode === "lambda") {
    if (!hasLambdaConfig()) {
      return errorResponse(
        "CATALOG_DATA_SOURCE=lambda but no Lambda base URL is set.",
        undefined,
        500,
        q.limit,
        q.offset,
      );
    }

    try {
      return await tryLambda(q);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown Lambda error";
      console.error("Catalog API Lambda failed:", error);
      return errorResponse(
        "Lambda catalog request failed.",
        msg,
        502,
        q.limit,
        q.offset,
      );
    }
  }

  if (hasPrismaConfig()) {
    try {
      return await tryPrisma(q);
    } catch (error: unknown) {
      console.error("Catalog API Prisma failed in auto mode:", error);

      if (hasLambdaConfig()) {
        try {
          return await tryLambda(q);
        } catch (lambdaError: unknown) {
          const prismaMsg =
            error instanceof Error ? error.message : "Unknown Prisma error";
          const lambdaMsg =
            lambdaError instanceof Error
              ? lambdaError.message
              : "Unknown Lambda error";

          console.error("Catalog API Lambda also failed in auto mode:", lambdaError);

          return errorResponse(
            "Both Prisma and Lambda catalog requests failed.",
            `Prisma: ${prismaMsg} | Lambda: ${lambdaMsg}`,
            502,
            q.limit,
            q.offset,
          );
        }
      }

      const msg = error instanceof Error ? error.message : "Unknown Prisma error";
      return errorResponse(
        "Prisma catalog query failed.",
        msg,
        500,
        q.limit,
        q.offset,
      );
    }
  }

  if (hasLambdaConfig()) {
    try {
      return await tryLambda(q);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown Lambda error";
      console.error("Catalog API Lambda failed in auto mode:", error);
      return errorResponse(
        "Lambda catalog request failed.",
        msg,
        502,
        q.limit,
        q.offset,
      );
    }
  }

  return errorResponse(
    "No catalog data source is configured.",
    "Set CATALOG_DATA_SOURCE and the matching env vars.",
    500,
    q.limit,
    q.offset,
  );
}