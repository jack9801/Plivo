import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Add export config to skip pre-rendering this route during build
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if we're in static generation
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        success: true,
        message: "Static build - skipping actual database check",
        staticBuild: true,
        env: {
          isDemoMode: process.env.DEMO_MODE === 'true',
          hasDbUrl: !!process.env.DATABASE_URL,
          hasJwtSecret: !!process.env.JWT_SECRET,
          nodeEnv: process.env.NODE_ENV,
          appUrl: process.env.NEXT_PUBLIC_APP_URL
        }
      });
    }
    
    // Only run this in runtime
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    
    // Check database connection
    return NextResponse.json({
      success: true,
      dbConnected: true,
      result,
      env: {
        isDemoMode: process.env.DEMO_MODE === 'true',
        hasDbUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV,
        appUrl: process.env.NEXT_PUBLIC_APP_URL
      }
    });
  } catch (error) {
    console.error("Error connecting to database:", error);
    return NextResponse.json({
      success: false,
      dbConnected: false,
      error: error instanceof Error ? error.message : "Unknown error",
      env: {
        isDemoMode: process.env.DEMO_MODE === 'true',
        hasDbUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV,
        appUrl: process.env.NEXT_PUBLIC_APP_URL
      }
    });
  }
} 