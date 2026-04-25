// src/lib/db.ts
// Single Prisma client shared across the app.
//
// Both dev and production use a standard MySQL connection URL.
// In production we build it from DB_HOST/DB_USER/DB_PASSWORD/DB_NAME env vars.
// In development we use DATABASE_URL from .env (local Docker MySQL).

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

  // Strip any protocol prefix the user may have accidentally included.
  const cleanHost =
    /^https?:\/\//i.test(host) || /^mysql:\/\//i.test(host)
      ? new URL(host).hostname
      : host.split("/")[0].split(":")[0];

  // SSL with relaxed cert validation: traffic is encrypted, but we don't ship
  // the RDS CA bundle on Vercel. For a class project this is fine.
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

export const prisma: PrismaClient = global.__db__ ?? createClient();

if (process.env.NODE_ENV !== "production") {
  global.__db__ = prisma;
}

// Kept for backwards compat with the diagnostic /api/health/db route.
export async function getPrisma(): Promise<PrismaClient> {
  return prisma;
}

export function hasProdConfig(): boolean {
  return Boolean(
    process.env.DB_HOST &&
      process.env.DB_USER &&
      process.env.DB_PASSWORD &&
      process.env.DB_NAME,
  );
}
