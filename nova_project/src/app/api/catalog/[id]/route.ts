// src/app/api/catalog/[id]/route.ts
// API endpoint to fetch a single catalog item by ID
// Provides comprehensive error handling and validation

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// Sanitize and validate ID parameter
function validateItemId(id: string): { valid: boolean; itemId?: number; error?: string } {
  // Remove any whitespace
  const trimmed = id.trim();
  
  // Check if empty
  if (!trimmed) {
    return { valid: false, error: "Item ID cannot be empty" };
  }
  
  // Check for invalid characters
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: "Item ID must contain only numeric digits" };
  }
  
  // Parse to number
  const itemId = parseInt(trimmed, 10);
  
  // Check for valid range
  if (itemId <= 0 || itemId > Number.MAX_SAFE_INTEGER) {
    return { valid: false, error: "Item ID must be a positive number within valid range" };
  }
  
  return { valid: true, itemId };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate and sanitize ID
    const validation = validateItemId(id);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_ID",
          message: validation.error,
        },
        { status: 400 },
      );
    }

    const itemId = validation.itemId!;

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
      console.info(`Catalog item not found: ID ${itemId}`);
      return NextResponse.json(
        {
          success: false,
          error: "NOT_FOUND",
          message: `Catalog item with ID ${itemId} not found.`,
        },
        { status: 404 },
      );
    }

    // Validate data integrity
    if (!item.sku || !item.itemName) {
      console.error(`Corrupted catalog item: ID ${itemId} missing required fields`);
      return NextResponse.json(
        {
          success: false,
          error: "CORRUPTED_DATA",
          message: "Item data is incomplete or corrupted",
        },
        { status: 500 },
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
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    const isTimeoutError = message.toLowerCase().includes("timeout");
    const isDatabaseError = message.toLowerCase().includes("prisma") || message.toLowerCase().includes("database");
    
    console.error("Catalog Item API Error:", {
      error: message,
      type: isTimeoutError ? "TIMEOUT" : isDatabaseError ? "DATABASE_ERROR" : "SERVER_ERROR",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: isTimeoutError ? "TIMEOUT" : "DATABASE_ERROR",
        message: "Unable to retrieve catalog item. Please try again later.",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}
