import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENABLE_DB_PERF_LOGS = process.env.ENABLE_DB_PERF_LOGS === "true";

const DEFAULT_LIMIT = 20;
const ALLOWED_LIMITS = new Set([20, 50, 100]);
const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 500;

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
const LEGACY_PRICE_BUCKETS = new Map<string, { min?: number; max?: number }>([
  ["under-50", { max: 50 }],
  ["50-99", { min: 50, max: 100 }],
  ["100-249", { min: 100, max: 250 }],
  ["250-plus", { min: 250, max: DEFAULT_MAX_PRICE }],
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

function parseNonNegativeNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function parseCsv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

type PriceRange = {
  min: number | null;
  max: number | null;
};

type CatalogQuery = {
  id: number | null;
  limit: number;
  offset: number;
  q: string;
  categories: string[];
  priceRange: PriceRange;
  categoriesCsv: string;
  priceBucketsCsv: string;
  minPriceRaw: string;
  maxPriceRaw: string;
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

function normalizePriceRange(
  minPrice: number | null,
  maxPrice: number | null,
): PriceRange {
  const resolvedMin = minPrice ?? DEFAULT_MIN_PRICE;
  const resolvedMax = maxPrice ?? DEFAULT_MAX_PRICE;
  const min = Math.max(DEFAULT_MIN_PRICE, Math.min(resolvedMin, resolvedMax));
  const max = Math.min(DEFAULT_MAX_PRICE, Math.max(resolvedMin, resolvedMax));

  return {
    min: min > DEFAULT_MIN_PRICE ? min : null,
    max: max < DEFAULT_MAX_PRICE ? max : null,
  };
}

function getLegacyPriceRange(priceBuckets: string[]): PriceRange {
  const bucket = priceBuckets[0];
  const range = bucket ? LEGACY_PRICE_BUCKETS.get(bucket) : null;

  return {
    min: range?.min ?? null,
    max: range?.max ?? null,
  };
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
  const minPriceRaw = sp.get("minPrice") ?? "";
  const maxPriceRaw = sp.get("maxPrice") ?? "";

  const categories = parseCsv(categoriesCsv);
  const priceBuckets = parseCsv(priceBucketsCsv);

  const explicitMinPrice = parseNonNegativeNumber(minPriceRaw);
  const explicitMaxPrice = parseNonNegativeNumber(maxPriceRaw);
  const priceRange =
    explicitMinPrice !== null || explicitMaxPrice !== null
      ? normalizePriceRange(explicitMinPrice, explicitMaxPrice)
      : getLegacyPriceRange(priceBuckets);

  return {
    id,
    limit,
    offset: safeOffset,
    q,
    categories,
    priceRange,
    categoriesCsv,
    priceBucketsCsv,
    minPriceRaw,
    maxPriceRaw,
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

  if (q.priceRange.min !== null || q.priceRange.max !== null) {
    whereFilters.push({
      price: {
        ...(q.priceRange.min !== null ? { gte: q.priceRange.min } : {}),
        ...(q.priceRange.max !== null ? { lte: q.priceRange.max } : {}),
      },
    });
  }

  return whereFilters.length > 0 ? { AND: whereFilters } : undefined;
}

async function tryPrisma(q: CatalogQuery): Promise<NextResponse> {
  const startTime = Date.now();
  const where = buildPrismaWhere(q);

  // List view: only select fields used by ItemCard component
  const listSelect = {
    id: true,
    itemName: true,
    category1: true,
    category2: true,
    category3: true,
    description: true,
    price: true,
    quantityInStock: true,
  };

  // Detail view: full item shape for edit/detail experiences
  const detailSelect = {
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
      select: detailSelect,
    });

    const durationMs = Date.now() - startTime;
    logPerformance({
      route: "/api/catalog",
      dataSourceMode: "prisma",
      durationMs,
      rowCount: item ? 1 : 0,
      limit: q.limit,
      offset: q.offset,
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
      select: listSelect,
      orderBy: { id: "asc" },
      take: q.limit,
      skip: q.offset,
      where,
    }),
  ]);

  const durationMs = Date.now() - startTime;
  const responseJson = shapeResponse({
    data: catalogItems as unknown[],
    totalCount,
    limit: q.limit,
    offset: q.offset,
  });

  logPerformance({
    route: "/api/catalog",
    dataSourceMode: "prisma",
    durationMs,
    rowCount: catalogItems.length,
    limit: q.limit,
    offset: q.offset,
    responseSize: JSON.stringify(responseJson).length,
  });

  const response = NextResponse.json(responseJson, { status: 200 });
  return withNoCache(response);
}

async function tryLambda(q: CatalogQuery): Promise<NextResponse> {
  const startTime = Date.now();
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

  if (q.q) {
    upstreamUrl.searchParams.set("q", q.q);
  }

  if (q.categoriesCsv) {
    upstreamUrl.searchParams.set("categories", q.categoriesCsv);
  }

  if (q.minPriceRaw) {
    upstreamUrl.searchParams.set("minPrice", q.minPriceRaw);
  }

  if (q.maxPriceRaw) {
    upstreamUrl.searchParams.set("maxPrice", q.maxPriceRaw);
  }

  if (!q.minPriceRaw && !q.maxPriceRaw && q.priceBucketsCsv) {
    upstreamUrl.searchParams.set("priceBuckets", q.priceBucketsCsv);
  }

  const r = await fetch(upstreamUrl.toString(), { cache: "no-store" });
  const text = await r.text();

  let parsed: unknown = null;

  try {
    parsed = text ? (JSON.parse(text) as unknown) : null;
  } catch {
    const durationMs = Date.now() - startTime;
    logPerformance({
      route: "/api/catalog",
      dataSourceMode: "lambda",
      durationMs,
      rowCount: 0,
      limit: q.limit,
      offset: q.offset,
    });

    const passthrough = new NextResponse(text, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("content-type") ?? "text/plain",
      },
    });
    return withNoCache(passthrough);
  }

  const normalized = normalizeLambdaPayload(parsed, q.limit, q.offset);
  const durationMs = Date.now() - startTime;

  logPerformance({
    route: "/api/catalog",
    dataSourceMode: "lambda",
    durationMs,
    rowCount: Array.isArray(normalized.data)
      ? (normalized.data as unknown[]).length
      : normalized.data
        ? 1
        : 0,
    limit: q.limit,
    offset: q.offset,
    responseSize: JSON.stringify(normalized).length,
  });

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

type CatalogUpdateInput = {
  sku: string | null;
  itemName: string;
  price: number;
  category1: string | null;
  category2: string | null;
  category3: string | null;
  description: string | null;
  quantityInStock: number;
  unitOfMeasure: string | null;
  storageLocation: string | null;
  storageConditions: string | null;
  expirationDate: Date | null;
  dateAcquired: Date | null;
  reorderLevel: number;
  unitCost: number;
};

function normalizeOptionalString(
  value: unknown,
  fieldName: string,
): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "n/a") return null;
  return trimmed;
}

function normalizeRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function normalizeNonNegativeNumber(value: unknown, fieldName: string): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative number.`);
  }

  return parsed;
}

function normalizeNonNegativeInteger(
  value: unknown,
  fieldName: string,
): number {
  const parsed = normalizeNonNegativeNumber(value, fieldName);
  return Math.trunc(parsed);
}

function normalizeNullableDate(value: unknown, fieldName: string): Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a date string.`);
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "n/a") return null;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid date.`);
  }

  return parsed;
}

function parseCatalogUpdatePayload(raw: unknown): CatalogUpdateInput {
  if (!isRecord(raw)) {
    throw new Error("Request body must be a JSON object.");
  }

  return {
    sku: normalizeOptionalString(raw.sku, "sku"),
    itemName: normalizeRequiredString(raw.itemName, "itemName"),
    price: normalizeNonNegativeNumber(raw.price, "price"),
    category1: normalizeOptionalString(raw.category1, "category1"),
    category2: normalizeOptionalString(raw.category2, "category2"),
    category3: normalizeOptionalString(raw.category3, "category3"),
    description: normalizeOptionalString(raw.description, "description"),
    quantityInStock: normalizeNonNegativeInteger(
      raw.quantityInStock,
      "quantityInStock",
    ),
    unitOfMeasure: normalizeOptionalString(raw.unitOfMeasure, "unitOfMeasure"),
    storageLocation: normalizeOptionalString(
      raw.storageLocation,
      "storageLocation",
    ),
    storageConditions: normalizeOptionalString(
      raw.storageConditions,
      "storageConditions",
    ),
    expirationDate: normalizeNullableDate(raw.expirationDate, "expirationDate"),
    dateAcquired: normalizeNullableDate(raw.dateAcquired, "dateAcquired"),
    reorderLevel: normalizeNonNegativeInteger(raw.reorderLevel, "reorderLevel"),
    unitCost: normalizeNonNegativeNumber(raw.unitCost, "unitCost"),
  };
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
      const msg =
        error instanceof Error ? error.message : "Unknown Prisma error";
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
      const msg =
        error instanceof Error ? error.message : "Unknown Lambda error";
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

          console.error(
            "Catalog API Lambda also failed in auto mode:",
            lambdaError,
          );

          return errorResponse(
            "Both Prisma and Lambda catalog requests failed.",
            `Prisma: ${prismaMsg} | Lambda: ${lambdaMsg}`,
            502,
            q.limit,
            q.offset,
          );
        }
      }

      const msg =
        error instanceof Error ? error.message : "Unknown Prisma error";
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
      const msg =
        error instanceof Error ? error.message : "Unknown Lambda error";
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

export async function PATCH(request: NextRequest) {
  const q = parseCatalogQuery(request);

  if (!q.id) {
    return errorResponse(
      "A valid id query parameter is required.",
      undefined,
      400,
    );
  }

  let payload: CatalogUpdateInput;

  try {
    const body = (await request.json()) as unknown;
    payload = parseCatalogUpdatePayload(body);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Invalid JSON request body.";
    return errorResponse("Invalid update payload.", msg, 400);
  }

  const mode = getDataSourceMode();

  if (mode === "lambda") {
    return errorResponse(
      "Catalog updates are only supported with Prisma data source.",
      "Set CATALOG_DATA_SOURCE to prisma or auto with DATABASE_URL configured.",
      501,
    );
  }

  if (!hasPrismaConfig()) {
    return errorResponse(
      "DATABASE_URL is required to update catalog items.",
      undefined,
      500,
    );
  }

  try {
    const updatedItem = await prisma.catalogItem.update({
      where: { id: q.id },
      data: payload,
    });

    return withNoCache(
      NextResponse.json(
        {
          success: true,
          data: updatedItem,
        },
        { status: 200 },
      ),
    );
  } catch (error: unknown) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? ((error as { code: string }).code ?? "")
        : "";

    if (code === "P2025") {
      return errorResponse("Catalog item not found.", undefined, 404);
    }

    const msg = error instanceof Error ? error.message : "Unknown Prisma error";
    return errorResponse("Catalog update failed.", msg, 500);
  }
}
