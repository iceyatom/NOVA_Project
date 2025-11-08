import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.$queryRaw`SELECT NOW() as now`;
    return NextResponse.json({ ok: true, time: result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
