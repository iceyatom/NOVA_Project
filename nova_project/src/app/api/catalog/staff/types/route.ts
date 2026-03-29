import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");

  if (!category || !subcategory) {
    return NextResponse.json({ types: [] });
  }

  const items = await prisma.category1.findMany({
    where: {
      category2: {
        name: subcategory,
        category3: {
          name: category,
        },
      },
    },
    select: {
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json({
    types: items.map((item) => item.name),
  });
}
