import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const ALLOWED_LIMITS = new Set([20, 50, 100]);

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLimit = parsePositiveInt(searchParams.get("limit"));
    const limit =
      requestedLimit && ALLOWED_LIMITS.has(requestedLimit)
        ? requestedLimit
        : DEFAULT_LIMIT;

    const page = parsePositiveInt(searchParams.get("page"));
    const offset =
      parsePositiveInt(searchParams.get("offset")) ??
      (page ? (page - 1) * limit : 0);
    const safeOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;

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
    };

    const [totalCount, catalogItems] = await prisma.$transaction([
      prisma.catalogItem.count(),
      prisma.catalogItem.findMany({
        select,
        orderBy: {
          id: "asc",
        },
        take: limit,
        skip: safeOffset,
      }),
    ]);

    // Return the catalog items as JSON
    const response = NextResponse.json(
      {
        success: true,
        data: catalogItems,
        count: catalogItems.length,
        totalCount,
        limit,
        offset: safeOffset,
      },
      { status: 200 },
    );

    // Add anti-caching headers
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error: unknown) {
    // Handle database errors gracefully
    console.error("Catalog API Error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve catalog items. Please try again later.",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}
