import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json({ subcategories: [] });
  }

  const items = await prisma.catalogItem.findMany({
    where: {
      category3: category,
      category2: {
        not: null,
      },
    },
    distinct: ["category2"],
    select: {
      category2: true,
    },
    orderBy: {
      category2: "asc",
    },
  });

  return NextResponse.json({
    subcategories: items
      .map((item) => item.category2)
      .filter((subcategory): subcategory is string => Boolean(subcategory)),
  });
}
