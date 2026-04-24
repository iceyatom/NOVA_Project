import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/staffAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CategoryLevel = "category3" | "category2" | "category1";

type CreateCategoryPayload = {
  level?: unknown;
  name?: unknown;
  parentCategory3?: unknown;
  parentCategory2?: unknown;
};

type UpdateCategoryPayload = {
  level?: unknown;
  currentName?: unknown;
  newName?: unknown;
  currentParentCategory3?: unknown;
  currentParentCategory2?: unknown;
  newParentCategory3?: unknown;
  newParentCategory2?: unknown;
};

type DeleteCategoryPayload = {
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

async function findCategory2(
  parentCategory3Name: string,
  subcategoryName: string,
) {
  return prisma.category2.findFirst({
    where: {
      name: subcategoryName,
      category3: {
        name: parentCategory3Name,
      },
    },
    select: {
      id: true,
      name: true,
      category3: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

async function findCategory1(
  parentCategory3Name: string,
  parentCategory2Name: string,
  typeName: string,
) {
  return prisma.category1.findFirst({
    where: {
      name: typeName,
      category2: {
        name: parentCategory2Name,
        category3: {
          name: parentCategory3Name,
        },
      },
    },
    select: {
      id: true,
      name: true,
      category2: {
        select: {
          id: true,
          name: true,
          category3: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  if (action === "hierarchy") {
    try {
      const hierarchy = await prisma.category3.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          name: true,
          category2s: {
            orderBy: {
              name: "asc",
            },
            select: {
              name: true,
              category1s: {
                orderBy: {
                  name: "asc",
                },
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      const categories: string[] = [];
      const subcategories: Array<{ name: string; parentCategory3: string }> =
        [];
      const types: Array<{
        name: string;
        parentCategory3: string;
        parentCategory2: string;
      }> = [];

      for (const category of hierarchy) {
        categories.push(category.name);

        for (const subcategory of category.category2s) {
          subcategories.push({
            name: subcategory.name,
            parentCategory3: category.name,
          });

          for (const type of subcategory.category1s) {
            types.push({
              name: type.name,
              parentCategory3: category.name,
              parentCategory2: subcategory.name,
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          categories,
          subcategories,
          types,
        },
      });
    } catch (error) {
      return errorResponse(
        "Failed to load category hierarchy.",
        error instanceof Error ? error.message : "Unknown server error.",
        500,
      );
    }
  }

  if (action !== "dependencies") {
    return errorResponse("Unsupported GET request.", undefined, 405);
  }

  const level = searchParams.get("level");
  if (!isCategoryLevel(level)) {
    return errorResponse("Invalid category level.");
  }

  const name = asTrimmedString(searchParams.get("name"));
  if (!name) {
    return errorResponse("Category name is required.");
  }

  try {
    if (level === "category3") {
      const category = await prisma.category3.findUnique({
        where: { name },
        select: { id: true },
      });

      if (!category) {
        return errorResponse("Category not found.", undefined, 404);
      }

      const [subcategoryCount, typeCount] = await Promise.all([
        prisma.category2.count({
          where: { category3Id: category.id },
        }),
        prisma.category1.count({
          where: {
            category2: {
              category3Id: category.id,
            },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          level,
          subcategoryCount,
          typeCount,
        },
      });
    }

    if (level === "category2") {
      const parentCategory3 = asTrimmedString(
        searchParams.get("parentCategory3"),
      );
      if (!parentCategory3) {
        return errorResponse("Parent Category is required.");
      }

      const subcategory = await findCategory2(parentCategory3, name);
      if (!subcategory) {
        return errorResponse("Subcategory not found.", undefined, 404);
      }

      const typeCount = await prisma.category1.count({
        where: { category2Id: subcategory.id },
      });

      return NextResponse.json({
        success: true,
        data: {
          level,
          typeCount,
        },
      });
    }

    const parentCategory3 = asTrimmedString(
      searchParams.get("parentCategory3"),
    );
    const parentCategory2 = asTrimmedString(
      searchParams.get("parentCategory2"),
    );
    if (!parentCategory3 || !parentCategory2) {
      return errorResponse(
        "Parent Category and Parent Subcategory are required.",
      );
    }

    const typeCategory = await findCategory1(
      parentCategory3,
      parentCategory2,
      name,
    );
    if (!typeCategory) {
      return errorResponse("Type not found.", undefined, 404);
    }

    return NextResponse.json({
      success: true,
      data: {
        level,
        typeCount: 0,
        category: typeCategory.category2.category3.name,
        subcategory: typeCategory.category2.name,
      },
    });
  } catch (error) {
    return errorResponse(
      "Failed to load dependency information.",
      error instanceof Error ? error.message : "Unknown server error.",
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

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

export async function PATCH(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: UpdateCategoryPayload;

  try {
    body = (await request.json()) as UpdateCategoryPayload;
  } catch {
    return errorResponse("Invalid request body.", "Expected JSON payload.");
  }

  if (!isCategoryLevel(body.level)) {
    return errorResponse("Invalid category level.");
  }

  const level = body.level;
  const currentName = asTrimmedString(body.currentName);
  const newName = asTrimmedString(body.newName);

  if (!currentName || !newName) {
    return errorResponse("Current and new category names are required.");
  }

  try {
    if (level === "category3") {
      const current = await prisma.category3.findUnique({
        where: { name: currentName },
        select: { id: true, name: true },
      });
      if (!current) {
        return errorResponse("Category not found.", undefined, 404);
      }

      const updated = await prisma.category3.update({
        where: { id: current.id },
        data: { name: newName },
        select: { id: true, name: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          level,
          name: updated.name,
        },
      });
    }

    if (level === "category2") {
      const currentParentCategory3 = asTrimmedString(
        body.currentParentCategory3,
      );
      const newParentCategory3 = asTrimmedString(body.newParentCategory3);

      if (!currentParentCategory3 || !newParentCategory3) {
        return errorResponse("Parent Category is required.");
      }

      const current = await findCategory2(currentParentCategory3, currentName);
      if (!current) {
        return errorResponse("Subcategory not found.", undefined, 404);
      }

      const targetParent = await prisma.category3.findUnique({
        where: { name: newParentCategory3 },
        select: { id: true, name: true },
      });
      if (!targetParent) {
        return errorResponse(
          "Target Parent Category not found.",
          undefined,
          404,
        );
      }

      const updated = await prisma.category2.update({
        where: { id: current.id },
        data: {
          name: newName,
          category3Id: targetParent.id,
        },
        select: {
          id: true,
          name: true,
          category3: {
            select: { name: true },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          level,
          name: updated.name,
          parentCategory3: updated.category3.name,
        },
      });
    }

    const currentParentCategory3 = asTrimmedString(body.currentParentCategory3);
    const currentParentCategory2 = asTrimmedString(body.currentParentCategory2);
    const newParentCategory3 = asTrimmedString(body.newParentCategory3);
    const newParentCategory2 = asTrimmedString(body.newParentCategory2);

    if (
      !currentParentCategory3 ||
      !currentParentCategory2 ||
      !newParentCategory3 ||
      !newParentCategory2
    ) {
      return errorResponse(
        "Parent Category and Parent Subcategory are required.",
      );
    }

    const current = await findCategory1(
      currentParentCategory3,
      currentParentCategory2,
      currentName,
    );
    if (!current) {
      return errorResponse("Type not found.", undefined, 404);
    }

    const targetParent = await prisma.category2.findFirst({
      where: {
        name: newParentCategory2,
        category3: {
          name: newParentCategory3,
        },
      },
      select: {
        id: true,
        name: true,
        category3: {
          select: { name: true },
        },
      },
    });
    if (!targetParent) {
      return errorResponse(
        "Target Parent Subcategory not found under selected Parent Category.",
        undefined,
        404,
      );
    }

    const updated = await prisma.category1.update({
      where: { id: current.id },
      data: {
        name: newName,
        category2Id: targetParent.id,
      },
      select: {
        id: true,
        name: true,
        category2: {
          select: {
            name: true,
            category3: {
              select: { name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        level,
        name: updated.name,
        parentCategory3: updated.category2.category3.name,
        parentCategory2: updated.category2.name,
      },
    });
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
        "A category with this name already exists under the selected parent.",
        undefined,
        409,
      );
    }

    return errorResponse(
      "Failed to update category.",
      error instanceof Error ? error.message : "Unknown server error.",
      500,
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: DeleteCategoryPayload;

  try {
    body = (await request.json()) as DeleteCategoryPayload;
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
      const current = await prisma.category3.findUnique({
        where: { name },
        select: { id: true, name: true },
      });
      if (!current) {
        return errorResponse("Category not found.", undefined, 404);
      }

      const [subcategoryCount, typeCount] = await Promise.all([
        prisma.category2.count({
          where: { category3Id: current.id },
        }),
        prisma.category1.count({
          where: {
            category2: {
              category3Id: current.id,
            },
          },
        }),
      ]);

      await prisma.category3.delete({
        where: { id: current.id },
      });

      return NextResponse.json({
        success: true,
        data: {
          level,
          name: current.name,
          subcategoryCount,
          typeCount,
        },
      });
    }

    if (level === "category2") {
      const parentCategory3 = asTrimmedString(body.parentCategory3);
      if (!parentCategory3) {
        return errorResponse("Parent Category is required.");
      }

      const current = await findCategory2(parentCategory3, name);
      if (!current) {
        return errorResponse("Subcategory not found.", undefined, 404);
      }

      const typeCount = await prisma.category1.count({
        where: { category2Id: current.id },
      });

      await prisma.category2.delete({
        where: { id: current.id },
      });

      return NextResponse.json({
        success: true,
        data: {
          level,
          name: current.name,
          parentCategory3,
          typeCount,
        },
      });
    }

    const parentCategory3 = asTrimmedString(body.parentCategory3);
    const parentCategory2 = asTrimmedString(body.parentCategory2);
    if (!parentCategory3 || !parentCategory2) {
      return errorResponse(
        "Parent Category and Parent Subcategory are required.",
      );
    }

    const current = await findCategory1(parentCategory3, parentCategory2, name);
    if (!current) {
      return errorResponse("Type not found.", undefined, 404);
    }

    await prisma.category1.delete({
      where: { id: current.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        level,
        name: current.name,
        parentCategory3,
        parentCategory2,
      },
    });
  } catch (error) {
    return errorResponse(
      "Failed to delete category.",
      error instanceof Error ? error.message : "Unknown server error.",
      500,
    );
  }
}
