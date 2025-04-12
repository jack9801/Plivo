import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Try a simple database query
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