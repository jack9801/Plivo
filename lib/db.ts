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
  (process.env.VERCEL && process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') ||
  process.env.NODE_ENV === 'production' && (process.env.VERCEL_ENV || isVercelBuild);

// Use a consistent type for both configurations
const prodConfig: Prisma.PrismaClientOptions = {
  log: ['error'] as Prisma.LogLevel[],
  errorFormat: 'minimal' as Prisma.ErrorFormat,
};

const devConfig: Prisma.PrismaClientOptions = {
  log: (process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']) as Prisma.LogLevel[],
  errorFormat: 'pretty' as Prisma.ErrorFormat, // Add errorFormat for dev too
};

// Connection options with proper typing
const connectionOptions = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;

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
  
  try {
    // Use a real Prisma client for runtime
    console.log('Creating Prisma client for runtime with DATABASE_URL:', 
      process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, process.env.DATABASE_URL.indexOf('@')) + '****' : 
        'undefined');
    
    return new PrismaClient(connectionOptions);
  } catch (e) {
    console.error('Error creating Prisma client:', e);
    throw e;
  }
};

// Create or reuse the prisma client
export const prisma = global.prisma || createPrismaClient();

// Only set the global prisma client in development to prevent memory leaks
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

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