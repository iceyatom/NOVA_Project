import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CategoryLevel = "category3" | "category2" | "category1";

type CreateCategoryPayload = {
  level?: unknown;
  name?: unknown;
  parentCategory3?: unknown;
  parentCategory2?: unknown;
};

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isCategoryLevel(value: unknown): value is CategoryLevel {
  return (
    value === "category3" || value === "category2" || value === "category1"
  );
}

function errorResponse(error: string, details?: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

export async function POST(request: NextRequest) {
  let body: CreateCategoryPayload;

  try {
    body = (await request.json()) as CreateCategoryPayload;
  } catch {
    return errorResponse("Invalid request body.", "Expected JSON payload.");
  }

  if (!isCategoryLevel(body.level)) {
    return errorResponse("Invalid category level.");
  }

  const level = body.level;
  const name = asTrimmedString(body.name);

  if (!name) {
    return errorResponse("Category name is required.");
  }

  try {
    if (level === "category3") {
      const existing = await prisma.category3.findUnique({
        where: { name },
        select: { id: true },
      });

      if (existing) {
        return errorResponse("Category already exists.", undefined, 409);
      }

      const created = await prisma.category3.create({
        data: { name },
        select: { id: true, name: true },
      });

      return NextResponse.json(
        {
          success: true,
          data: { level, ...created },
        },
        { status: 201 },
      );
    }

    const parentCategory3Name = asTrimmedString(body.parentCategory3);
    if (!parentCategory3Name) {
      return errorResponse("Parent Category is required.");
    }

    const parentCategory3 = await prisma.category3.findUnique({
      where: { name: parentCategory3Name },
      select: { id: true, name: true },
    });

    if (!parentCategory3) {
      return errorResponse("Parent Category not found.", undefined, 404);
    }

    if (level === "category2") {
      const existing = await prisma.category2.findFirst({
        where: {
          category3Id: parentCategory3.id,
          name,
        },
        select: { id: true },
      });

      if (existing) {
        return errorResponse(
          "Subcategory already exists under the selected Category.",
          undefined,
          409,
        );
      }

      const created = await prisma.category2.create({
        data: {
          name,
          category3Id: parentCategory3.id,
        },
        select: { id: true, name: true },
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            level,
            ...created,
            parentCategory3: parentCategory3.name,
          },
        },
        { status: 201 },
      );
    }

    const parentCategory2Name = asTrimmedString(body.parentCategory2);
    if (!parentCategory2Name) {
      return errorResponse("Parent Subcategory is required.");
    }

    const parentCategory2 = await prisma.category2.findFirst({
      where: {
        category3Id: parentCategory3.id,
        name: parentCategory2Name,
      },
      select: { id: true, name: true },
    });

    if (!parentCategory2) {
      return errorResponse(
        "Parent Subcategory not found under selected Category.",
        undefined,
        404,
      );
    }

    const existing = await prisma.category1.findFirst({
      where: {
        category2Id: parentCategory2.id,
        name,
      },
      select: { id: true },
    });

    if (existing) {
      return errorResponse(
        "Type already exists under the selected Subcategory.",
        undefined,
        409,
      );
    }

    const created = await prisma.category1.create({
      data: {
        name,
        category2Id: parentCategory2.id,
      },
      select: { id: true, name: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          level,
          ...created,
          parentCategory3: parentCategory3.name,
          parentCategory2: parentCategory2.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? ((error as { code: string }).code ?? "")
        : "";

    if (code === "P2002") {
      return errorResponse(
        "Category name already exists at this level.",
        undefined,
        409,
      );
    }

    return errorResponse(
      "Failed to create category.",
      error instanceof Error ? error.message : "Unknown server error.",
      500,
    );
  }
}
