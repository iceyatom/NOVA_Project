import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json({ subcategories: [] });
  }

  const items = await prisma.category2.findMany({
    where: {
      category3: {
        name: category,
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
    subcategories: items.map((item) => item.name),
  });
}
