// src/lib/db.ts
// Single Prisma client shared across the app.
//
// Both dev and production use a standard MySQL connection URL.
// In production we build it from DB_HOST/DB_USER/DB_PASSWORD/DB_NAME env vars.
// In development we use DATABASE_URL from .env (local Docker MySQL).
//
// The PrismaClient is instantiated LAZILY on first access. This is critical
// for Next.js / Vercel: env vars are not always available during build-time
// page-data collection, so eagerly throwing here would break the build.

import { PrismaClient } from "@prisma/client";

declare global {
  var __db__: PrismaClient | undefined;
}

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function buildProdDatabaseUrl(): string {
  const host = (process.env.DB_HOST ?? "").trim();
  const port = (process.env.DB_PORT ?? "3306").trim();
  const user = process.env.DB_USER ?? "";
  const password = process.env.DB_PASSWORD ?? "";
  const name = process.env.DB_NAME ?? "";

  if (!host || !user || !password || !name) {
    throw new Error(
      "Missing production DB config. Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in Vercel.",
    );
  }

  const cleanHost =
    /^https?:\/\//i.test(host) || /^mysql:\/\//i.test(host)
      ? new URL(host).hostname
      : host.split("/")[0].split(":")[0];

  return (
    `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}` +
    `@${cleanHost}:${port}/${encodeURIComponent(name)}` +
    `?sslaccept=accept_invalid_certs` +
    `&connection_limit=5` +
    `&pool_timeout=10` +
    `&connect_timeout=15`
  );
}

function createClient(): PrismaClient {
  const url = isProd() ? buildProdDatabaseUrl() : process.env.DATABASE_URL;

  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Lazy singleton. The actual PrismaClient is only created when something
// touches `prisma.somemethod(...)` — never at import time.
function getOrCreateClient(): PrismaClient {
  if (global.__db__) return global.__db__;
  const client = createClient();
  if (process.env.NODE_ENV !== "production") {
    global.__db__ = client;
  } else {
    // In production we still want to cache across requests within the same
    // serverless instance, so reuse the same global slot.
    global.__db__ = client;
  }
  return client;
}

// Public API — drop-in replacement for `import { prisma } from "@/lib/db"`.
// Every property/method access goes through the proxy, which lazily
// instantiates the underlying PrismaClient on first use.
type AnyFn = (...args: unknown[]) => unknown;

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getOrCreateClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return (value as AnyFn).bind(client);
    }
    return value;
  },
}) as PrismaClient;

// Backwards-compat helper used by the diagnostic /api/health/db route.
export async function getPrisma(): Promise<PrismaClient> {
  return getOrCreateClient();
}

export function hasProdConfig(): boolean {
  return Boolean(
    process.env.DB_HOST &&
      process.env.DB_USER &&
      process.env.DB_PASSWORD &&
      process.env.DB_NAME,
  );
}
