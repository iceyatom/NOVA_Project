// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const startTime = Date.now();

async function checkDb() {
  try {
    const [ping] = await prisma.$queryRaw<{ ok: any }[]>`SELECT 1 AS ok`;
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
    };
  } catch (e: any) {
    console.error('DB health error:', e);
    return {
      ok: false,
      name: e && e.name ? e.name : 'Error',
      code: e && e.code ? e.code : 'UNKNOWN',
      message: e && e.message ? e.message : 'Unknown DB error',
    };
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
  } catch (e: any) {
    return {
      ok: false,
      name: e?.name,
      code: e?.code,
      message: e?.message,
    };
  }
}

export async function GET() {
  const timeoutMs = 4000;
  const withTimeout = <T,>(p: Promise<T>) =>
    Promise.race<T>([
      p,
      new Promise<T>((resolve) =>
        setTimeout(
          () => resolve(<any>{ ok: false, code: 'TIMEOUT', message: 'Health check timed out' }),
          timeoutMs
        )
      ),
    ]);

  const [db, s3] = await Promise.all([withTimeout(checkDb()), withTimeout(checkS3())]);
  const ok = !!db.ok && !!s3.ok;

  const body = {
    ok,
    status: ok ? 'ok' : 'error',
    components: { db, s3 },
    version: process.env.APP_VERSION ?? 'dev',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    // helpful message your Home Page can show directly
    message: ok ? '✅ AWS Connection Successful' : '❌ Health check failed',
  };

  const res = NextResponse.json(body, { status: 200 });
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  console.log('ENV check DATABASE_URL present:', !!process.env.DATABASE_URL);
  return res;
}
