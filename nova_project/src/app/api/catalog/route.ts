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

export async function GET(request: NextRequest) {
    const upstreamBase = process.env.NEXT_PUBLIC_API_URL;
  if (!upstreamBase) {
    return NextResponse.json(
      { success: false, error: "NEXT_PUBLIC_API_URL is not set" },
      { status: 500 },
    );
  }

  const url = new URL(request.url);

  // Pass through the same query params your UI already uses
  const limit = url.searchParams.get("limit") ?? "20";
  const offset = url.searchParams.get("offset") ?? "0";
  const q = url.searchParams.get("q") ?? "";
  const categories = url.searchParams.get("categories") ?? "";
  const priceBuckets = url.searchParams.get("priceBuckets") ?? "";

  // Build the upstream URL: <base>/catalog?... (base already includes /prod)
  const upstreamUrl = new URL(`${upstreamBase}/catalog`);
  upstreamUrl.searchParams.set("limit", limit);
  upstreamUrl.searchParams.set("offset", offset);
  if (q) upstreamUrl.searchParams.set("q", q);
  if (categories) upstreamUrl.searchParams.set("categories", categories);
  if (priceBuckets) upstreamUrl.searchParams.set("priceBuckets", priceBuckets);

  try {
    const r = await fetch(upstreamUrl.toString(), { cache: "no-store" });
    const body = await r.text();

    // Return exactly what API Gateway returns
    return new NextResponse(body, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Upstream Lambda request failed", details: msg },
      { status: 502 },
    );
  } 
}