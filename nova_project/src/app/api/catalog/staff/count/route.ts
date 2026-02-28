// src/app/api/catalog/staff/count/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");
  const type = searchParams.get("type");

  const count = await prisma.catalogItem.count({
    where: {
      ...(category ? { category3: category } : {}),
      ...(subcategory ? { category2: subcategory } : {}),
      ...(type ? { category1: type } : {}),
    },
  });
  return NextResponse.json({ count });
}
