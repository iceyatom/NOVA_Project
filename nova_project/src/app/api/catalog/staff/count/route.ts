// src/app/api/catalog/staff/count/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const count = await prisma.catalogItem.count();
  return NextResponse.json({ count });
}
