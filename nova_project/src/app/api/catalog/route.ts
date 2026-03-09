import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const ALLOWED_LIMITS = new Set([20, 50, 100]);
const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 500;
const LEGACY_PRICE_BUCKETS = new Map<string, { min?: number; max?: number }>([
  ["under-50", { max: 50 }],
  ["50-99", { min: 50, max: 100 }],
  ["100-249", { min: 100, max: 250 }],
  ["250-plus", { min: 250, max: DEFAULT_MAX_PRICE }],
]);

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
  data: unknown[];
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
  data: unknown[];
  totalCount: number;
  limit: number;
  offset: number;
}): CatalogResponse {
  return {
    success: true,
    data: args.data,
    count: args.data.length,
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

  const dataRaw =
    getArray(raw, "data") ??
    getArray(raw, "items") ??
    (Array.isArray(raw) ? (raw as unknown[]) : []);

  const pageStart = Math.max(0, offset);
  const pageEnd = pageStart + limit;
  const data = dataRaw.slice(pageStart, pageEnd);

  const totalCount =
    getNumber(raw, "totalCount") ??
    getNumber(raw, "total") ??
    getNumber(raw, "total_count") ??
    dataRaw.length;

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

  return shapeResponse({ data, totalCount, limit, offset });
}

async function tryRdsFirst(q: CatalogQuery): Promise<NextResponse> {
  const whereFilters: Record<string, unknown>[] = [];

  if (q.q) {
    whereFilters.push({
      itemName: { contains: q.q },
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

  const where =
    whereFilters.length > 0
      ? {
          AND: whereFilters,
        }
      : undefined;

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

async function fallbackToLambda(q: CatalogQuery): Promise<NextResponse> {
  const upstreamBase = process.env.NEXT_PUBLIC_API_URL;

  if (!upstreamBase) {
    return NextResponse.json(
      { success: false, error: "NEXT_PUBLIC_API_URL is not set" },
      { status: 500 },
    );
  }

  const upstreamUrl = new URL(`${upstreamBase}/catalog`);
  upstreamUrl.searchParams.set("limit", String(q.limit));
  upstreamUrl.searchParams.set("offset", String(q.offset));

  if (q.q) upstreamUrl.searchParams.set("q", q.q);
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

  try {
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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Upstream Lambda request failed", details: msg },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest) {
  const q = parseCatalogQuery(request);

  try {
    return await tryRdsFirst(q);
  } catch (error: unknown) {
    console.error("Catalog API RDS failed, falling back to Lambda:", error);
    return await fallbackToLambda(q);
  }
}
