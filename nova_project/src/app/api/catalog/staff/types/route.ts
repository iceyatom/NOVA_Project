import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");

  if (!category || !subcategory) {
    return NextResponse.json({ types: [] });
  }

  const items = await prisma.catalogItem.findMany({
    where: {
      category3: category,
      category2: subcategory,
      category1: {
        not: null,
      },
    },
    distinct: ["category1"],
    select: {
      category1: true,
    },
    orderBy: {
      category1: "asc",
    },
  });

  return NextResponse.json({
    types: items
      .map((item) => item.category1)
      .filter((type): type is string => Boolean(type)),
  });
}
