// src/app/api/catalog/[id]/route.ts
// API endpoint to fetch a single catalog item by ID

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = params;

    // Validate ID is a number
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid item ID. ID must be a number.",
        },
        { status: 400 },
      );
    }

    // Query the specific catalog item
    const item = await prisma.catalogItem.findUnique({
      where: { id: itemId },
      select: {
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
        imageUrl: true,
        storageLocation: true,
        storageConditions: true,
        expirationDate: true,
        dateAcquired: true,
        reorderLevel: true,
        unitCost: true,
      },
    });

    // Item not found
    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: `Catalog item with ID ${itemId} not found.`,
        },
        { status: 404 },
      );
    }

    // Return the item as JSON
    const response = NextResponse.json(
      {
        success: true,
        data: item,
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
    console.error("Catalog Item API Error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve catalog item. Please try again later.",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}
