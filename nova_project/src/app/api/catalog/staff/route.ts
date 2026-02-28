// src/app/api/catalog/staff/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageSize = Number(searchParams.get("pageSize")) || 20;
  const offset = Number(searchParams.get("offset")) || 0;
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");
  const type = searchParams.get("type");
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";

  const orderBy =
    sortBy === "sku"
      ? { sku: sortOrder }
      : sortBy === "name"
        ? { itemName: sortOrder }
        : sortBy === "category"
          ? { category1: sortOrder }
          : sortBy === "price"
            ? { price: sortOrder }
            : sortBy === "stock"
              ? { quantityInStock: sortOrder }
              : sortBy === "lastModified"
                ? { updatedAt: sortOrder }
                : undefined;

  const catalogItems = await prisma.catalogItem.findMany({
    where: {
      ...(category ? { category3: category } : {}),
      ...(subcategory ? { category2: subcategory } : {}),
      ...(type ? { category1: type } : {}),
    },
    orderBy,
    take: pageSize,
    skip: offset,
  });

  return NextResponse.json(catalogItems);
}
