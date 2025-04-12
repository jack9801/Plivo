import { PrismaClient, Prisma } from '@prisma/client';

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
  (process.env.VERCEL && process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' && typeof window === 'undefined');

// Use a consistent type for both configurations
const prodConfig: Prisma.PrismaClientOptions = {
  log: ['error'] as Prisma.LogLevel[],
  errorFormat: 'minimal' as Prisma.ErrorFormat,
};

const devConfig: Prisma.PrismaClientOptions = {
  log: (process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']) as Prisma.LogLevel[],
  errorFormat: 'pretty' as Prisma.ErrorFormat, // Add errorFormat for dev too
};

// Create a reliable prisma client
let prismaInstance: PrismaClient;

if (!global.prisma) {
  console.log('Creating new PrismaClient instance');
  global.prisma = new PrismaClient(
    process.env.NODE_ENV === 'production' ? prodConfig : devConfig
  );
}

prismaInstance = global.prisma;

export const prisma = prismaInstance;

// Helper function to check database connection
export async function checkDatabaseConnection() {
  try {
    if (isStaticGeneration) {
      console.log('Static generation detected, skipping database connection check');
      return true;
    }
    
    console.log('Checking database connection...');
    await prisma.$connect();
    console.log('Database connection successful');
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