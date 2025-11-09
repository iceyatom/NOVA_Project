import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Query catalog items from the database
    const catalogItems = await prisma.catalogItem.findMany({
      select: {
        id: true,
        itemName: true,
        category: true,
        description: true,
        price: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    // Return the catalog items as JSON
    const response = NextResponse.json(
      {
        success: true,
        data: catalogItems,
        count: catalogItems.length,
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
