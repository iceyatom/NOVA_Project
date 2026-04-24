import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const prisma = await getPrisma();
  const rows = await prisma.$queryRaw<{ ok: number | string | bigint }[]>`
    SELECT 1 AS ok
  `;

  return NextResponse.json(
    rows.map((row) => ({
      ok: Number(row.ok),
    })),
  );
}
