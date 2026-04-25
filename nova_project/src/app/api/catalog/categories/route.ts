import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category3.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      categories: categories.map((category) => category.name),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown category lookup error";

    return NextResponse.json(
      {
        success: false,
        categories: [],
        error: "Failed to load category options.",
        details: message,
      },
      { status: 500 },
    );
  }
}
