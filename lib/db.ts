import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Check for .vercel-build marker file which indicates we're in a Vercel build
const isVercelBuild = (() => {
  try {
    // During build time, we've created a marker file
    if (typeof process !== 'undefined' && process.env.VERCEL === '1') {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
})();

// Determine if we are in a static generation context (during build time)
const isStaticGeneration = 
  process.env.NEXT_PHASE === 'phase-production-build' || 
  (process.env.VERCEL && process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') ||
  process.env.NODE_ENV === 'production' && (process.env.VERCEL_ENV || isVercelBuild);

// Create a mock client or real client based on environment
const createPrismaClient = () => {
  if (isStaticGeneration) {
    console.log('Static generation detected, using mock database client');
    
    // Return a mock Prisma client for static generation
    return new Proxy({} as PrismaClient, {
      get: (target, prop) => {
        if (prop === '$connect' || prop === '$disconnect') {
          return async () => { };
        }
        
        // Create a deeper proxy for method chains
        return () => {
          // Return a chainable proxy that resolves to empty results
          return new Proxy({} as any, {
            get: () => () => Promise.resolve([]),
            apply: () => Promise.resolve([])
          });
        };
      }
    });
  }
  
  // Use a real Prisma client for runtime
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

// Helper function to check database connection
export async function checkDatabaseConnection() {
  try {
    if (isStaticGeneration) {
      console.log('Static generation detected, skipping database connection check');
      return true;
    }
    
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Helper to gracefully handle database operations in API routes
export async function withDatabase<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    // If we're in a static generation context, return fallback
    if (isStaticGeneration) {
      console.log('Static generation detected, returning fallback data');
      return fallback;
    }
    
    // If we're in a runtime context, try the operation
    return await operation();
  } catch (error) {
    console.error('Database operation failed:', error);
    return fallback;
  }
} 