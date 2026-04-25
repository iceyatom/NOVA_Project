import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { deleteFileFromS3 } from "@/lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENABLE_DB_PERF_LOGS = process.env.ENABLE_DB_PERF_LOGS === "true";

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

const DEFAULT_LIMIT = 20;
const ALLOWED_LIMITS = new Set([20, 50, 100]);
const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 800;
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

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getNumber(value: unknown, key: string): number | null {
  if (!isRecord(value)) return null;
  return coerceNumber(value[key]);
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
  // If neither value is provided, return empty range (no filter)
  if (minPrice === null && maxPrice === null) {
    return { min: null, max: null };
  }

  const resolvedMin = minPrice ?? DEFAULT_MIN_PRICE;
  const resolvedMax = maxPrice ?? DEFAULT_MAX_PRICE;
  const min = Math.max(DEFAULT_MIN_PRICE, Math.min(resolvedMin, resolvedMax));
  const max = Math.min(DEFAULT_MAX_PRICE, Math.max(resolvedMin, resolvedMax));

  return {
    min,
    max,
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

function hasActivePriceFilter(q: CatalogQuery): boolean {
  return q.priceRange.min !== null || q.priceRange.max !== null;
}

function itemMatchesPriceFilter(
  item: unknown,
  priceRange: PriceRange,
): boolean {
  if (!isRecord(item)) return false;
  const price = getNumber(item, "price");
  if (price === null) return false;

  if (priceRange.min !== null && price < priceRange.min) {
    return false;
  }
  if (priceRange.max !== null && price > priceRange.max) {
    return false;
  }
  return true;
}

function filterItemsByPrice(
  items: unknown[],
  priceRange: PriceRange,
): unknown[] {
  return items.filter((item) => itemMatchesPriceFilter(item, priceRange));
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
        { category1Ref: { is: { name: { in: q.categories } } } },
        { category2Ref: { is: { name: { in: q.categories } } } },
        { category3Ref: { is: { name: { in: q.categories } } } },
        {
          classifications: {
            some: {
              category1: {
                name: {
                  in: q.categories,
                },
              },
            },
          },
        },
        {
          classifications: {
            some: {
              category1: {
                category2: {
                  name: {
                    in: q.categories,
                  },
                },
              },
            },
          },
        },
        {
          classifications: {
            some: {
              category1: {
                category2: {
                  category3: {
                    name: {
                      in: q.categories,
                    },
                  },
                },
              },
            },
          },
        },
      ],
    });
  }

  if (q.priceRange.min !== null || q.priceRange.max !== null) {
    // Build price filter - use strings for Decimal type to ensure proper comparison
    const priceFilter: Record<string, unknown> = {};
    if (q.priceRange.min !== null) {
      priceFilter.gte = q.priceRange.min.toFixed(2);
    }
    if (q.priceRange.max !== null) {
      priceFilter.lte = q.priceRange.max.toFixed(2);
    }
    whereFilters.push({ price: priceFilter });
    console.log("[Catalog API] Price filter added:", { price: priceFilter });
  }

  const result = whereFilters.length > 0 ? { AND: whereFilters } : undefined;
  console.log("[Catalog API] Final where clause:", JSON.stringify(result));
  return result;
}

async function tryPrisma(q: CatalogQuery): Promise<NextResponse> {
  const startTime = Date.now();
  const where = buildPrismaWhere(q);

  // List view: only select fields used by ItemCard component
  const listSelect = {
    id: true,
    itemName: true,
    category1Ref: {
      select: { name: true },
    },
    category2Ref: {
      select: { name: true },
    },
    category3Ref: {
      select: { name: true },
    },
    description: true,
    price: true,
    quantityInStock: true,
    images: {
      select: {
        id: true,
        s3Key: true,
        sortOrder: true,
        createdAt: true,
      },
      orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
      take: 1,
    },
  };

  // Detail view: full item shape for edit/detail experiences
  const detailSelect = {
    id: true,
    sku: true,
    itemName: true,
    price: true,
    category1Ref: {
      select: { name: true },
    },
    category2Ref: {
      select: { name: true },
    },
    category3Ref: {
      select: { name: true },
    },
    classifications: {
      select: {
        category1: {
          select: {
            name: true,
            category2: {
              select: {
                name: true,
                category3: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc" as const,
      },
    },
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
    images: {
      select: {
        id: true,
        s3Key: true,
        sortOrder: true,
        createdAt: true,
      },
      orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
    },
  } satisfies Prisma.CatalogItemSelect;

  function getImageUrlFromKey(key: string) {
    if (/^https?:\/\//i.test(key)) {
      return key;
    }

    const normalizedKey = key.replace(/^\/+/, "");
    const bucket = process.env.S3_BUCKET_NAME;
    const region = process.env.AWS_REGION;

    if (!bucket) {
      throw new Error(
        "S3_BUCKET_NAME is required to build catalog image URLs.",
      );
    }

    if (!region || region === "us-east-1") {
      return `https://${bucket}.s3.amazonaws.com/${normalizedKey}`;
    }

    return `https://${bucket}.s3.${region}.amazonaws.com/${normalizedKey}`;
  }

  function withCategoryNames<
    T extends {
      category1Ref?: { name: string } | null;
      category2Ref?: { name: string } | null;
      category3Ref?: { name: string } | null;
      classifications?: Array<{
        category1: {
          name: string;
          category2: {
            name: string;
            category3: {
              name: string;
            };
          };
        };
      }> | null;
      images?: Array<{
        id: number;
        s3Key: string;
        sortOrder: number;
        createdAt: Date;
      }> | null;
    },
  >(item: T) {
    const {
      category1Ref,
      category2Ref,
      category3Ref,
      classifications,
      images,
      ...rest
    } = item;

    const resolvedClassifications = Array.isArray(classifications)
      ? classifications.map((entry) => ({
          category3: entry.category1.category2.category3.name,
          category2: entry.category1.category2.name,
          category1: entry.category1.name,
        }))
      : null;

    const fallbackClassification =
      category3Ref?.name || category2Ref?.name || category1Ref?.name
        ? [
            {
              category3: category3Ref?.name ?? null,
              category2: category2Ref?.name ?? null,
              category1: category1Ref?.name ?? null,
            },
          ]
        : [];

    return {
      ...rest,
      category1: category1Ref?.name ?? null,
      category2: category2Ref?.name ?? null,
      category3: category3Ref?.name ?? null,
      ...(resolvedClassifications
        ? {
            classifications:
              resolvedClassifications.length > 0
                ? resolvedClassifications
                : fallbackClassification,
          }
        : {}),
      ...(images
        ? {
            images: images.map((img) => ({
              id: img.id,
              s3Key: img.s3Key,
              sortOrder: img.sortOrder,
              createdAt: img.createdAt,
              url: getImageUrlFromKey(img.s3Key),
            })),
          }
        : {}),
    };
  }

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
        data: item ? withCategoryNames(item) : null,
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
  const catalogItemsWithCategoryNames = catalogItems.map((item) =>
    withCategoryNames(item),
  );
  const responseJson = shapeResponse({
    data: catalogItemsWithCategoryNames as unknown[],
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

function buildLambdaUrl(
  q: CatalogQuery,
  options: {
    limit?: number;
    offset?: number;
    includePriceParams?: boolean;
  } = {},
): string {
  const upstreamBase = getLambdaBaseUrl();

  if (!upstreamBase) {
    throw new Error("Lambda base URL is not configured");
  }

  const normalizedBase = upstreamBase.endsWith("/catalog")
    ? upstreamBase
    : `${upstreamBase.replace(/\/$/, "")}/catalog`;

  const upstreamUrl = new URL(normalizedBase);

  if (q.id) {
    upstreamUrl.searchParams.set("id", String(q.id));
  } else {
    upstreamUrl.searchParams.set("limit", String(options.limit ?? q.limit));
    upstreamUrl.searchParams.set("offset", String(options.offset ?? q.offset));
  }

  if (q.q) {
    upstreamUrl.searchParams.set("q", q.q);
  }

  if (q.categoriesCsv) {
    upstreamUrl.searchParams.set("categories", q.categoriesCsv);
  }

  const includePrice = options.includePriceParams ?? true;
  if (includePrice) {
    if (q.minPriceRaw) {
      upstreamUrl.searchParams.set("minPrice", q.minPriceRaw);
    }

    if (q.maxPriceRaw) {
      upstreamUrl.searchParams.set("maxPrice", q.maxPriceRaw);
    }

    if (!q.minPriceRaw && !q.maxPriceRaw && q.priceBucketsCsv) {
      upstreamUrl.searchParams.set("priceBuckets", q.priceBucketsCsv);
    }
  }

  return upstreamUrl.toString();
}

async function tryLambdaWithServerSidePriceFilter(
  q: CatalogQuery,
): Promise<NextResponse> {
  if (q.id) {
    // For single item lookup, fetch and apply price filter
    const url = buildLambdaUrl(q, { includePriceParams: false });
    const r = await fetch(url, { cache: "no-store" });
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

    // Apply price filter to single item result
    if (
      normalized.success &&
      normalized.data &&
      !Array.isArray(normalized.data)
    ) {
      if (!itemMatchesPriceFilter(normalized.data, q.priceRange)) {
        return NextResponse.json(
          shapeResponse({
            data: [],
            totalCount: 0,
            limit: q.limit,
            offset: q.offset,
          }),
          { status: 200 },
        );
      }
    }

    return withNoCache(NextResponse.json(normalized, { status: r.status }));
  }

  // For collection queries, fetch all pages and apply server-side filtering
  const BATCH_SIZE = 100;
  const allItems: unknown[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const url = buildLambdaUrl(q, {
        limit: BATCH_SIZE,
        offset,
        includePriceParams: false,
      });

      const r = await fetch(url, { cache: "no-store" });
      const text = await r.text();

      let parsed: unknown = null;
      try {
        parsed = text ? (JSON.parse(text) as unknown) : null;
      } catch {
        hasMore = false;
        break;
      }

      const normalized = normalizeLambdaPayload(parsed, BATCH_SIZE, offset);

      if (!normalized.success || !Array.isArray(normalized.data)) {
        hasMore = false;
        break;
      }

      if (normalized.data.length === 0) {
        hasMore = false;
        break;
      }

      allItems.push(...normalized.data);

      // Check if we've fetched all available items
      if (normalized.data.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        offset += BATCH_SIZE;
      }

      // Safety limit to prevent infinite loops (max 10 batches = 1000 items)
      if (allItems.length >= 1000) {
        hasMore = false;
      }
    } catch {
      hasMore = false;
    }
  }

  // Apply server-side price filtering
  const filteredItems = filterItemsByPrice(allItems, q.priceRange);
  const totalCount = filteredItems.length;

  // Extract the requested page slice
  const pageStart = q.offset;
  const pageEnd = q.offset + q.limit;
  const paginatedItems = filteredItems.slice(pageStart, pageEnd);

  return withNoCache(
    NextResponse.json(
      shapeResponse({
        data: paginatedItems,
        totalCount,
        limit: q.limit,
        offset: q.offset,
      }),
      { status: 200 },
    ),
  );
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
  sku: string;
  itemName: string;
  price: number;
  category1: string | null;
  category2: string | null;
  category3: string | null;
  classifications: CatalogClassificationInput[];
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

type CatalogDeleteInput = {
  deleteImagesFromStorage: boolean;
};

class CatalogPayloadValidationError extends Error {}

type CatalogClassificationInput = {
  category1: string | null;
  category2: string | null;
  category3: string | null;
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

function normalizeClassificationInput(
  value: unknown,
  fieldName: string,
): CatalogClassificationInput {
  if (!isRecord(value)) {
    throw new Error(`${fieldName} must be an object.`);
  }

  return {
    category1: normalizeOptionalString(
      value.category1,
      `${fieldName}.category1`,
    ),
    category2: normalizeOptionalString(
      value.category2,
      `${fieldName}.category2`,
    ),
    category3: normalizeOptionalString(
      value.category3,
      `${fieldName}.category3`,
    ),
  };
}

function normalizeClassifications(
  value: unknown,
  fallback: CatalogClassificationInput,
): CatalogClassificationInput[] {
  if (value === undefined) {
    const hasFallback =
      fallback.category3 !== null ||
      fallback.category2 !== null ||
      fallback.category1 !== null;
    return hasFallback ? [fallback] : [];
  }

  if (!Array.isArray(value)) {
    throw new Error("classifications must be an array.");
  }

  return value.map((entry, index) =>
    normalizeClassificationInput(entry, `classifications[${index}]`),
  );
}

function parseCatalogUpdatePayload(raw: unknown): CatalogUpdateInput {
  if (!isRecord(raw)) {
    throw new Error("Request body must be a JSON object.");
  }

  const legacyClassification: CatalogClassificationInput = {
    category1: normalizeOptionalString(raw.category1, "category1"),
    category2: normalizeOptionalString(raw.category2, "category2"),
    category3: normalizeOptionalString(raw.category3, "category3"),
  };

  return {
    sku: normalizeRequiredString(raw.sku, "sku"),
    itemName: normalizeRequiredString(raw.itemName, "itemName"),
    price: normalizeNonNegativeNumber(raw.price, "price"),
    category1: legacyClassification.category1,
    category2: legacyClassification.category2,
    category3: legacyClassification.category3,
    classifications: normalizeClassifications(
      raw.classifications,
      legacyClassification,
    ),
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

async function parseCatalogDeletePayload(
  request: NextRequest,
): Promise<CatalogDeleteInput> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return {
      deleteImagesFromStorage: false,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }

  if (!isRecord(parsed)) {
    throw new Error("Request body must be a JSON object.");
  }

  const deleteImagesFromStorageRaw = parsed.deleteImagesFromStorage;

  if (deleteImagesFromStorageRaw === undefined) {
    return {
      deleteImagesFromStorage: false,
    };
  }

  if (typeof deleteImagesFromStorageRaw !== "boolean") {
    throw new Error("deleteImagesFromStorage must be a boolean.");
  }

  return {
    deleteImagesFromStorage: deleteImagesFromStorageRaw,
  };
}

type ResolvedCategoryIds = {
  category1: number | null;
  category2: number | null;
  category3: number | null;
};

type ResolvedClassificationIds = {
  category1: number;
  category2: number;
  category3: number;
};

async function resolveCategoryIds(
  payload: Pick<CatalogUpdateInput, "category1" | "category2" | "category3">,
): Promise<ResolvedCategoryIds> {
  if (!payload.category3 && (payload.category2 || payload.category1)) {
    throw new CatalogPayloadValidationError(
      "category3 is required when category2/category1 is provided.",
    );
  }

  if (!payload.category2 && payload.category1) {
    throw new CatalogPayloadValidationError(
      "category2 is required when category1 is provided.",
    );
  }

  if (!payload.category3) {
    return { category1: null, category2: null, category3: null };
  }

  const category3 = await prisma.category3.findUnique({
    where: { name: payload.category3 },
    select: { id: true },
  });

  if (!category3) {
    throw new CatalogPayloadValidationError(
      `Unknown category3: ${payload.category3}.`,
    );
  }

  if (!payload.category2) {
    return { category1: null, category2: null, category3: category3.id };
  }

  const category2 = await prisma.category2.findFirst({
    where: {
      name: payload.category2,
      category3Id: category3.id,
    },
    select: { id: true },
  });

  if (!category2) {
    throw new CatalogPayloadValidationError(
      `Unknown category2 "${payload.category2}" under category3 "${payload.category3}".`,
    );
  }

  if (!payload.category1) {
    return {
      category1: null,
      category2: category2.id,
      category3: category3.id,
    };
  }

  const category1 = await prisma.category1.findFirst({
    where: {
      name: payload.category1,
      category2Id: category2.id,
    },
    select: { id: true },
  });

  if (!category1) {
    throw new CatalogPayloadValidationError(
      `Unknown category1 "${payload.category1}" under category2 "${payload.category2}".`,
    );
  }

  return {
    category1: category1.id,
    category2: category2.id,
    category3: category3.id,
  };
}

function isBlankClassificationPath(path: CatalogClassificationInput): boolean {
  return !path.category3 && !path.category2 && !path.category1;
}

async function resolveClassificationPathIds(
  path: CatalogClassificationInput,
): Promise<ResolvedClassificationIds | null> {
  if (isBlankClassificationPath(path)) {
    return null;
  }

  if (!path.category3 || !path.category2 || !path.category1) {
    throw new CatalogPayloadValidationError(
      "Each started classification must include category3, category2, and category1.",
    );
  }

  const resolved = await resolveCategoryIds(path);
  if (!resolved.category1 || !resolved.category2 || !resolved.category3) {
    throw new CatalogPayloadValidationError(
      "Each classification must resolve to a complete category path.",
    );
  }

  return {
    category1: resolved.category1,
    category2: resolved.category2,
    category3: resolved.category3,
  };
}

async function resolveClassificationIds(
  paths: CatalogClassificationInput[],
): Promise<ResolvedClassificationIds[]> {
  const resolvedPaths: ResolvedClassificationIds[] = [];
  const seen = new Set<string>();

  for (const path of paths) {
    const resolved = await resolveClassificationPathIds(path);
    if (!resolved) continue;

    const key = `${resolved.category3}|${resolved.category2}|${resolved.category1}`;
    if (seen.has(key)) continue;
    seen.add(key);
    resolvedPaths.push(resolved);
  }

  return resolvedPaths;
}

async function buildCatalogMutationData(payload: CatalogUpdateInput) {
  const resolvedClassifications = await resolveClassificationIds(
    payload.classifications,
  );
  const primaryCategory = resolvedClassifications[0] ?? null;
  const classificationCategory1Ids = resolvedClassifications.map(
    (classification) => classification.category1,
  );

  return {
    classificationCategory1Ids,
    sku: payload.sku,
    itemName: payload.itemName,
    price: payload.price,
    category1: primaryCategory?.category1 ?? null,
    category2: primaryCategory?.category2 ?? null,
    category3: primaryCategory?.category3 ?? null,
    description: payload.description,
    quantityInStock: payload.quantityInStock,
    unitOfMeasure: payload.unitOfMeasure,
    storageLocation: payload.storageLocation,
    storageConditions: payload.storageConditions,
    expirationDate: payload.expirationDate,
    dateAcquired: payload.dateAcquired,
    reorderLevel: payload.reorderLevel,
    unitCost: payload.unitCost,
  };
}

export async function GET(request: NextRequest) {
  const q = parseCatalogQuery(request);
  const mode = getDataSourceMode();

  // Debug logging for price filter issues
  console.log("[Catalog API] Query:", {
    url: request.url,
    minPriceRaw: q.minPriceRaw,
    maxPriceRaw: q.maxPriceRaw,
    priceRange: q.priceRange,
    mode,
    hasPrisma: hasPrismaConfig(),
    hasLambda: hasLambdaConfig(),
  });

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
      // Use server-side price filtering if price filter is active
      if (hasActivePriceFilter(q)) {
        return await tryLambdaWithServerSidePriceFilter(q);
      }
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
          // Use server-side price filtering if price filter is active
          if (hasActivePriceFilter(q)) {
            return await tryLambdaWithServerSidePriceFilter(q);
          }
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
      // Use server-side price filtering if price filter is active
      if (hasActivePriceFilter(q)) {
        return await tryLambdaWithServerSidePriceFilter(q);
      }
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

export async function POST(request: NextRequest) {
  let payload: CatalogUpdateInput;

  try {
    const body = (await request.json()) as unknown;
    payload = parseCatalogUpdatePayload(body);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Invalid JSON request body.";
    return errorResponse("Invalid create payload.", msg, 400);
  }

  const mode = getDataSourceMode();

  if (mode === "lambda") {
    return errorResponse(
      "Catalog creates are only supported with Prisma data source.",
      "Set CATALOG_DATA_SOURCE to prisma or auto with DATABASE_URL configured.",
      501,
    );
  }

  if (!hasPrismaConfig()) {
    return errorResponse(
      "DATABASE_URL is required to create catalog items.",
      undefined,
      500,
    );
  }

  try {
    const createData = await buildCatalogMutationData(payload);
    const createdItem = await prisma.catalogItem.create({
      data: {
        sku: createData.sku,
        itemName: createData.itemName,
        price: createData.price,
        category1: createData.category1,
        category2: createData.category2,
        category3: createData.category3,
        description: createData.description,
        quantityInStock: createData.quantityInStock,
        unitOfMeasure: createData.unitOfMeasure,
        storageLocation: createData.storageLocation,
        storageConditions: createData.storageConditions,
        expirationDate: createData.expirationDate,
        dateAcquired: createData.dateAcquired,
        reorderLevel: createData.reorderLevel,
        unitCost: createData.unitCost,
        ...(createData.classificationCategory1Ids.length > 0
          ? {
              classifications: {
                create: createData.classificationCategory1Ids.map(
                  (category1Id) => ({
                    category1: {
                      connect: {
                        id: category1Id,
                      },
                    },
                  }),
                ),
              },
            }
          : {}),
      },
    });

    return withNoCache(
      NextResponse.json(
        {
          success: true,
          data: createdItem,
        },
        { status: 201 },
      ),
    );
  } catch (error: unknown) {
    if (error instanceof CatalogPayloadValidationError) {
      return errorResponse("Invalid create payload.", error.message, 400);
    }

    const msg = error instanceof Error ? error.message : "Unknown Prisma error";
    return errorResponse("Catalog create failed.", msg, 500);
  }
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
    const updateData = await buildCatalogMutationData(payload);
    const updatedItem = await prisma.catalogItem.update({
      where: { id: q.id },
      data: {
        sku: updateData.sku,
        itemName: updateData.itemName,
        price: updateData.price,
        category1: updateData.category1,
        category2: updateData.category2,
        category3: updateData.category3,
        description: updateData.description,
        quantityInStock: updateData.quantityInStock,
        unitOfMeasure: updateData.unitOfMeasure,
        storageLocation: updateData.storageLocation,
        storageConditions: updateData.storageConditions,
        expirationDate: updateData.expirationDate,
        dateAcquired: updateData.dateAcquired,
        reorderLevel: updateData.reorderLevel,
        unitCost: updateData.unitCost,
        classifications: {
          deleteMany: {},
          ...(updateData.classificationCategory1Ids.length > 0
            ? {
                create: updateData.classificationCategory1Ids.map(
                  (category1Id) => ({
                    category1: {
                      connect: {
                        id: category1Id,
                      },
                    },
                  }),
                ),
              }
            : {}),
        },
      },
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
    if (error instanceof CatalogPayloadValidationError) {
      return errorResponse("Invalid update payload.", error.message, 400);
    }

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

export async function DELETE(request: NextRequest) {
  const q = parseCatalogQuery(request);
  const catalogItemId = q.id;

  if (catalogItemId === null) {
    return errorResponse(
      "A valid id query parameter is required.",
      undefined,
      400,
    );
  }

  let payload: CatalogDeleteInput;

  try {
    payload = await parseCatalogDeletePayload(request);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Invalid JSON request body.";
    return errorResponse("Invalid delete payload.", msg, 400);
  }

  const mode = getDataSourceMode();

  if (mode === "lambda") {
    return errorResponse(
      "Catalog deletes are only supported with Prisma data source.",
      "Set CATALOG_DATA_SOURCE to prisma or auto with DATABASE_URL configured.",
      501,
    );
  }

  if (!hasPrismaConfig()) {
    return errorResponse(
      "DATABASE_URL is required to delete catalog items.",
      undefined,
      500,
    );
  }

  try {
    const deletionResult = await prisma.$transaction(async (tx) => {
      const catalogItem = await tx.catalogItem.findUnique({
        where: { id: catalogItemId },
        select: {
          id: true,
          images: {
            select: {
              s3Key: true,
            },
          },
        },
      });

      if (!catalogItem) {
        return null;
      }

      const uniqueImageKeys = Array.from(
        new Set(
          catalogItem.images
            .map((image) => image.s3Key.trim())
            .filter((key) => key.length > 0),
        ),
      );

      // Explicitly remove this item's image-link rows before deleting the item.
      // This keeps link cleanup correct even if DB-level cascade behavior changes.
      await tx.catalogItemImage.deleteMany({
        where: { catalogItemId },
      });

      await tx.catalogItem.delete({
        where: { id: catalogItemId },
      });

      return {
        deletedImageCount: catalogItem.images.length,
        uniqueImageKeys,
      };
    });

    if (!deletionResult) {
      return errorResponse("Catalog item not found.", undefined, 404);
    }

    const imageCleanupErrors: string[] = [];

    if (payload.deleteImagesFromStorage) {
      for (const imageKey of deletionResult.uniqueImageKeys) {
        const remainingReferences = await prisma.catalogItemImage.count({
          where: { s3Key: imageKey },
        });

        if (remainingReferences > 0) {
          continue;
        }

        try {
          await deleteFileFromS3(imageKey);
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : "Unknown S3 cleanup error.";
          imageCleanupErrors.push(
            `Failed to delete image from storage (${imageKey}): ${message}`,
          );
        }
      }
    }

    return withNoCache(
      NextResponse.json(
        {
          success: true,
          data: {
            id: q.id,
            deletedImageCount: deletionResult.deletedImageCount,
            storageCleanupErrors: imageCleanupErrors,
          },
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

    if (code === "P2003") {
      return errorResponse(
        "Catalog item cannot be deleted because it is referenced by existing ticket history.",
        "Remove dependent ticket lines before deleting this catalog item.",
        409,
      );
    }

    if (code === "P2025") {
      return errorResponse("Catalog item not found.", undefined, 404);
    }

    const msg = error instanceof Error ? error.message : "Unknown Prisma error";
    return errorResponse("Catalog delete failed.", msg, 500);
  }
}
