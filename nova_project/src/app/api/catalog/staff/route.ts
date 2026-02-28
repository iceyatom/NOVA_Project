// src/app/api/catalog/staff/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageSize = Number(searchParams.get("pageSize")) || 20;
  const offset = Number(searchParams.get("offset")) || 0;

  const catalogItems = await prisma.catalogItem.findMany({
    take: pageSize,
    skip: offset,
  });

  return NextResponse.json(catalogItems);
}
