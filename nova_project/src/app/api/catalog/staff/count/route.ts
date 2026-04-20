import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaffSession } from "@/lib/auth/staffAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DataSourceMode = "auto" | "prisma" | "lambda";

function getDataSourceMode(): DataSourceMode {
  const raw = (process.env.CATALOG_DATA_SOURCE ?? "auto").trim().toLowerCase();
  if (raw === "prisma" || raw === "lambda" || raw === "auto") return raw;
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

function withNoCache(resp: NextResponse) {
  resp.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  resp.headers.set("Pragma", "no-cache");
  resp.headers.set("Expires", "0");
  return resp;
}

function parseQuery(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  return {
    category: sp.get("category") || "all",
    subcategory: sp.get("subcategory") || "all",
    type: sp.get("type") || "all",
    query: (sp.get("query") || "").trim(),
  };
}

function buildWhere(q: ReturnType<typeof parseQuery>) {
  const and: Record<string, unknown>[] = [];

  if (q.query) {
    const tokens = q.query.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      and.push({
        OR: [{ itemName: { contains: token } }, { sku: { contains: token } }],
      });
    }
  }

  if (q.category !== "all") and.push({ category3: q.category });
  if (q.subcategory !== "all") and.push({ category2: q.subcategory });
  if (q.type !== "all") and.push({ category1: q.type });

  return and.length > 0 ? { AND: and } : undefined;
}

async function tryPrisma(q: ReturnType<typeof parseQuery>) {
  const count = await prisma.catalogItem.count({ where: buildWhere(q) });
  return withNoCache(NextResponse.json({ count }, { status: 200 }));
}

async function tryLambda(q: ReturnType<typeof parseQuery>) {
  const base = getLambdaBaseUrl();
  const normalizedBase = base.endsWith("/catalog")
    ? base
    : `${base.replace(/\/$/, "")}/catalog`;

  const url = new URL(normalizedBase);
  url.searchParams.set("limit", "1");
  url.searchParams.set("offset", "0");

  if (q.query) url.searchParams.set("q", q.query);

  const filters: string[] = [];
  if (q.category !== "all") filters.push(q.category);
  if (q.subcategory !== "all") filters.push(q.subcategory);
  if (q.type !== "all") filters.push(q.type);
  if (filters.length > 0) {
    url.searchParams.set("categories", filters.join(","));
  }

  const r = await fetch(url.toString(), { cache: "no-store" });
  const payload = await r.json().catch(() => ({}));

  const count =
    payload &&
    typeof payload === "object" &&
    typeof payload.totalCount === "number"
      ? payload.totalCount
      : 0;

  return withNoCache(NextResponse.json({ count }, { status: 200 }));
}

export async function GET(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  const q = parseQuery(request);
  const mode = getDataSourceMode();

  if (mode === "prisma" && hasPrismaConfig()) return tryPrisma(q);
  if (mode === "lambda" && hasLambdaConfig()) return tryLambda(q);

  if (hasPrismaConfig()) {
    try {
      return await tryPrisma(q);
    } catch {
      if (hasLambdaConfig()) return tryLambda(q);
    }
  }

  if (hasLambdaConfig()) return tryLambda(q);

  return withNoCache(NextResponse.json({ count: 0 }, { status: 200 }));
}
