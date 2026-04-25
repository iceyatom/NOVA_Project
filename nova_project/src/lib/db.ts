// Creates a single (singleton) PrismaClient instance shared across the app.
// Prevents multiple DB connections caused by Next.js hot reloads in dev.

import { PrismaClient } from "@prisma/client";

// Attach PrismaClient to Node.js global object so it persists across reloads.
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Reuse existing instance if available; otherwise create a new one.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"] // keep logs concise in dev
        : ["error"], // production: critical errors only
  });

// Cache the instance in development to avoid re-instantiation.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Example use:
// import { prisma } from '@/lib/db'
// const items = await prisma.catalogItem.findMany()
