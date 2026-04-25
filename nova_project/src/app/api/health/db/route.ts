// src/app/api/health/db/route.ts
// Staged DB health check — shows exactly which step in the
// Vercel → OIDC → STS → IAM token → RDS Proxy → MySQL chain fails.
// Hit this endpoint after deploying to confirm the connection works.

import { NextResponse } from "next/server";
import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { getPrisma, hasProdConfig } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const stages: Record<string, { ok: boolean; ms?: number; error?: string; detail?: unknown }> = {};
  const start = Date.now();

  // Stage 1: Are all required env vars present?
  const t1 = Date.now();
  const envOk = hasProdConfig();
  stages.env = {
    ok: envOk,
    ms: Date.now() - t1,
    detail: {
      NODE_ENV: process.env.NODE_ENV,
      AWS_REGION: !!process.env.AWS_REGION,
      AWS_ROLE_ARN: !!process.env.AWS_ROLE_ARN,
      DB_HOST: !!process.env.DB_HOST,
      DB_USER: !!process.env.DB_USER,
      DB_NAME: !!process.env.DB_NAME,
      DB_PORT: process.env.DB_PORT ?? "(default 3306)",
    },
  };

  if (!envOk && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, stages, totalMs: Date.now() - start },
      { status: 500 },
    );
  }

  // Stage 2: OIDC → STS → RDS IAM token (production only)
  if (process.env.NODE_ENV === "production") {
    const t2 = Date.now();
    try {
      const host = (process.env.DB_HOST ?? "").split(":")[0];
      const port = Number(process.env.DB_PORT ?? "3306");
      const signer = new Signer({
        region: process.env.AWS_REGION!,
        hostname: host,
        port,
        username: process.env.DB_USER!,
        credentials: awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN! }),
      });
      const token = await signer.getAuthToken();
      stages.iamToken = { ok: true, ms: Date.now() - t2, detail: { tokenLength: token.length } };
    } catch (err) {
      stages.iamToken = {
        ok: false,
        ms: Date.now() - t2,
        error: err instanceof Error ? err.message : String(err),
      };
      return NextResponse.json(
        { ok: false, stages, totalMs: Date.now() - start },
        { status: 500 },
      );
    }
  }

  // Stage 3: Actual DB query through Prisma
  const t3 = Date.now();
  try {
    const prisma = await getPrisma();
    const result = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;
    stages.query = { ok: true, ms: Date.now() - t3, detail: { now: result?.[0]?.now } };
  } catch (err) {
    stages.query = {
      ok: false,
      ms: Date.now() - t3,
      error: err instanceof Error ? err.message : String(err),
    };
    return NextResponse.json(
      { ok: false, stages, totalMs: Date.now() - start },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, stages, totalMs: Date.now() - start });
}
