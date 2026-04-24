import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const prisma = await getPrisma();
  try {
    const result = await prisma.$queryRaw`SELECT NOW() as now`;
    return NextResponse.json({ ok: true, time: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
