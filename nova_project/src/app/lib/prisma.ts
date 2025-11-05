// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// This ensures only ONE PrismaClient instance is used during dev (hot reload safe)
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["warn", "error"], // you can add 'query' if you want to debug queries
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
