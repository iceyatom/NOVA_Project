// src/lib/db.ts
// Single Prisma client shared across the app.
//
// Development:  uses DATABASE_URL from .env (local Docker MySQL) — no change.
// Production:   uses Vercel OIDC → STS → RDS IAM token → RDS Proxy → MySQL.
//               No static AWS keys needed on Vercel.

import { PrismaClient } from "@prisma/client";
import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

// ─── Global cache types ───────────────────────────────────────────────────────
declare global {
  var __db__: PrismaClient | undefined;
  var __dbPromise__: Promise<PrismaClient> | undefined;
  var __dbProd__: PrismaClient | undefined;
  var __dbProdPromise__: Promise<PrismaClient> | undefined;
  var __dbProdExpiresAt__: number | undefined;
}

// IAM auth tokens last 15 min. Refresh at 13 min to stay safely under the limit.
const PROD_TTL_MS = 13 * 60 * 1000;

// RDS Proxy handles connection pooling on the AWS side, so a small per-Lambda
// pool is fine. connection_limit=1 (the old value) serialized every request.
const PROD_CONN_LIMIT = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function getHost(): string {
  const raw = (process.env.DB_HOST ?? "").trim();
  if (!raw) throw new Error("DB_HOST env var is required in production.");
  // Strip protocol prefix if someone accidentally includes it.
  if (/^https?:\/\//i.test(raw) || /^mysql:\/\//i.test(raw)) {
    return new URL(raw).hostname;
  }
  return raw.split("/")[0].split(":")[0];
}

function getPort(): number {
  const p = Number((process.env.DB_PORT ?? "3306").trim());
  if (!Number.isInteger(p) || p <= 0 || p > 65535) {
    throw new Error("DB_PORT must be a valid TCP port number.");
  }
  return p;
}

export function hasProdConfig(): boolean {
  return Boolean(
    process.env.AWS_REGION &&
      process.env.AWS_ROLE_ARN &&
      process.env.DB_HOST &&
      process.env.DB_USER &&
      process.env.DB_NAME,
  );
}

// ─── Production client (OIDC → IAM token → RDS Proxy) ────────────────────────
async function createProdClient(): Promise<PrismaClient> {
  const hostname = getHost();
  const port = getPort();
  const dbName = encodeURIComponent(process.env.DB_NAME!);
  const dbUser = encodeURIComponent(process.env.DB_USER!);

  // Step 1: Exchange Vercel OIDC token for temporary AWS credentials via STS,
  //         then use those creds to mint a short-lived RDS IAM auth token.
  let token: string;
  try {
    const signer = new Signer({
      region: process.env.AWS_REGION!,
      hostname,
      port,
      username: process.env.DB_USER!,
      credentials: awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN! }),
    });
    token = await signer.getAuthToken();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `RDS IAM token mint failed (OIDC → STS → RDS-Signer). ` +
        `Check: AWS_ROLE_ARN trust policy has correct aud + sub, ` +
        `VercelRDSConnectPolicy resource ARN uses prx-... (Proxy ID not DB ID), ` +
        `and AWS_REGION matches the region your Proxy lives in. Error: ${msg}`,
    );
  }

  // Step 2: Build the Prisma connection URL using the IAM token as the password.
  const url =
    `mysql://${dbUser}:${encodeURIComponent(token)}` +
    `@${hostname}:${port}/${dbName}` +
    `?sslaccept=accept_invalid_certs` +
    `&connection_limit=${PROD_CONN_LIMIT}` +
    `&pool_timeout=10`;

  return new PrismaClient({
    datasources: { db: { url } },
    log: ["warn", "error"],
  });
}

// ─── Dev client (plain DATABASE_URL) ─────────────────────────────────────────
function createDevClient(): PrismaClient {
  return new PrismaClient({
    datasources: process.env.DATABASE_URL
      ? { db: { url: process.env.DATABASE_URL } }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// ─── getPrisma() — lazy singleton, safe for serverless ───────────────────────
export async function getPrisma(): Promise<PrismaClient> {
  if (isProd()) {
    if (!hasProdConfig()) {
      throw new Error(
        "Missing production DB config. Ensure AWS_REGION, AWS_ROLE_ARN, " +
          "DB_HOST, DB_USER, DB_NAME are set in Vercel Environment Variables.",
      );
    }

    const now = Date.now();

    // Fast path: cached client still within IAM token TTL.
    if (global.__dbProd__ && global.__dbProdExpiresAt__ && global.__dbProdExpiresAt__ > now) {
      return global.__dbProd__;
    }

    // Stale client: disconnect in background, start fresh.
    if (global.__dbProd__ && global.__dbProdExpiresAt__ && global.__dbProdExpiresAt__ <= now) {
      const stale = global.__dbProd__;
      global.__dbProd__ = undefined;
      global.__dbProdPromise__ = undefined;
      global.__dbProdExpiresAt__ = undefined;
      void stale.$disconnect().catch(() => {});
    }

    // In-flight: reuse the pending promise so concurrent requests don't each
    // kick off their own OIDC → STS roundtrip.
    if (!global.__dbProdPromise__) {
      global.__dbProdPromise__ = createProdClient().catch((err) => {
        global.__dbProdPromise__ = undefined; // allow retry on next request
        throw err;
      });
    }

    const client = await global.__dbProdPromise__;
    global.__dbProd__ = client;
    global.__dbProdExpiresAt__ = now + PROD_TTL_MS;
    return client;
  }

  // Development: simple singleton, hot-reload safe.
  if (global.__db__) return global.__db__;

  if (!global.__dbPromise__) {
    global.__dbPromise__ = Promise.resolve(createDevClient());
  }

  const client = await global.__dbPromise__;
  global.__db__ = client;
  return client;
}

// ─── prisma export ────────────────────────────────────────────────────────────
// Drop-in replacement for the old `prisma` export from this file.
// Every existing `import { prisma } from "@/lib/db"` continues to work with
// zero changes to any other file.

type AnyFn = (...args: unknown[]) => unknown;

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === "$transaction") {
      return async (input: unknown, ...rest: unknown[]) => {
        const client = await getPrisma();
        const fn = client.$transaction.bind(client) as AnyFn;
        return fn(input, ...rest);
      };
    }

    if (typeof prop !== "string") return undefined;

    if (prop.startsWith("$")) {
      return (...args: unknown[]) =>
        getPrisma().then((client) => {
          const fn = (client as unknown as Record<string, AnyFn>)[prop].bind(client);
          return fn(...args);
        });
    }

    // Model proxy: catalogItem, account, etc.
    return new Proxy({} as Record<string, AnyFn>, {
      get(_t, method) {
        if (typeof method !== "string") return undefined;
        return (...args: unknown[]) =>
          getPrisma().then((client) => {
            const model = (client as unknown as Record<string, Record<string, AnyFn>>)[prop];
            const fn = model[method].bind(model);
            return fn(...args);
          });
      },
    });
  },
});
