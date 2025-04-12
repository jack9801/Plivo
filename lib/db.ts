import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

// Helper function to check database connection
export async function checkDatabaseConnection() {
  try {
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
    // Check if we're in a static generation context (during build)
    const isStaticGeneration = 
      process.env.NEXT_PHASE === 'phase-production-build' || 
      process.env.VERCEL_ENV === 'production';
    
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