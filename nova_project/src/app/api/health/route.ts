// app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const startTime = Date.now();

type DbResult = {
  ok: boolean;
  dbName: string | null;
  serverTime: string | null;
  name?: string;
  code?: string;
  message?: string;
};

type S3Result =
  | { ok: true; skipped?: boolean }
  | { ok: false; name?: string; code?: string; message?: string };

type TimeoutResult = { ok: false; code: string; message: string };

async function checkDb() {
  try {
    const [ping] = await prisma.$queryRaw<{ ok: number | string | bigint }[]>`
      SELECT 1 AS ok
    `;
    const [meta] = await prisma.$queryRaw<{ db: string | null; now: Date }[]>`
      SELECT DATABASE() AS db, NOW() AS now
    `;

    // Coerce any type (number, string, bigint) safely to a boolean
    const okVal = ping ? ping.ok : 0;
    const ok = Number(okVal) === 1;

    return {
      ok,
      dbName: meta && meta.db ? meta.db : null,
      serverTime: meta && meta.now ? new Date(meta.now).toISOString() : null,
    } satisfies DbResult;
  } catch (e) {
    const err = e as Partial<Error> & { code?: string };
    console.error("DB health error:", e);
    return {
      ok: false,
      dbName: null,
      serverTime: null,
      name: err && err.name ? err.name : "Error",
      code: err && err.code ? err.code : "UNKNOWN",
      message: err && err.message ? err.message : "Unknown DB error",
    } satisfies DbResult;
  }
}

async function checkS3() {
  if (!process.env.AWS_REGION || !process.env.S3_BUCKET) {
    return { ok: true, skipped: true };
  }
  try {
    const s3 = new S3Client({ region: process.env.AWS_REGION });
    await s3.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET }));
    return { ok: true };
  } catch (e) {
    const err = e as Partial<Error> & { code?: string };
    return {
      ok: false,
      name: err?.name,
      code: err?.code,
      message: err?.message,
    } satisfies S3Result;
  }
}

export async function GET() {
  const timeoutMs = 4000;
  const timeoutResult: TimeoutResult = {
    ok: false,
    code: "TIMEOUT",
    message: "Health check timed out",
  };

  const withTimeout = <T extends { ok: boolean }>(p: Promise<T>) =>
    Promise.race<T | TimeoutResult>([
      p,
      new Promise<TimeoutResult>((resolve) =>
        setTimeout(() => resolve(timeoutResult), timeoutMs),
      ),
    ]);

  const [db, s3] = await Promise.all([
    withTimeout(checkDb()),
    withTimeout(checkS3()),
  ]);
  const ok = !!db.ok && !!s3.ok;

  const body = {
    ok,
    status: ok ? "ok" : "error",
    components: { db, s3 },
    version: process.env.APP_VERSION ?? "dev",
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    // helpful message your Home Page can show directly
    message: ok ? "✅ AWS Connection Successful" : "❌ Health check failed",
  };

  const res = NextResponse.json(body, { status: 200 });
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  console.log("ENV check DATABASE_URL present:", !!process.env.DATABASE_URL);
  return res;
}
