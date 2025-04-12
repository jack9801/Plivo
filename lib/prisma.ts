import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Ensure Prisma Client is properly initialized on Vercel
export function ensurePrismaClientInitialized() {
  try {
    // Force Prisma Client to be generated if needed 
    if (!prisma) {
      throw new Error("Prisma Client is not initialized");
    }
    return true;
  } catch (e) {
    console.error("Failed to initialize Prisma Client:", e);
    return false;
  }
} 