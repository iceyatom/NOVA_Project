// src/app/api/health/db/route.ts
// Staged DB health check showing env config + actual MySQL query timing.

import { NextResponse } from "next/server";
import { getPrisma, hasProdConfig } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const stages: Record<string, { ok: boolean; ms?: number; error?: string; detail?: unknown }> = {};
  const start = Date.now();

  // Stage 1: env config
  const t1 = Date.now();
  const envOk = process.env.NODE_ENV === "production"
    ? hasProdConfig()
    : Boolean(process.env.DATABASE_URL);
  stages.env = {
    ok: envOk,
    ms: Date.now() - t1,
    detail: {
      NODE_ENV: process.env.NODE_ENV,
      DB_HOST: !!process.env.DB_HOST,
      DB_USER: !!process.env.DB_USER,
      DB_PASSWORD: !!process.env.DB_PASSWORD,
      DB_NAME: !!process.env.DB_NAME,
      DB_PORT: process.env.DB_PORT ?? "(default 3306)",
      DATABASE_URL: !!process.env.DATABASE_URL,
    },
  };

  if (!envOk) {
    return NextResponse.json(
      { ok: false, stages, totalMs: Date.now() - start },
      { status: 500 },
    );
  }

  // Stage 2: actual DB query through Prisma
  const t2 = Date.now();
  try {
    const prisma = await getPrisma();
    const result = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;
    stages.query = { ok: true, ms: Date.now() - t2, detail: { now: result?.[0]?.now } };
  } catch (err) {
    stages.query = {
      ok: false,
      ms: Date.now() - t2,
      error: err instanceof Error ? err.message : String(err),
    };
    return NextResponse.json(
      { ok: false, stages, totalMs: Date.now() - start },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, stages, totalMs: Date.now() - start });
}
