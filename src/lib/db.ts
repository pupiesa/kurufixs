// lib/db.ts
import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across HMR/edge reloads to avoid exhausting pool
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });

// Cache on global in all envs; module cache should handle prod, but this is safe
globalForPrisma.prisma ??= prisma;

export default prisma;
