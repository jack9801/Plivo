import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Collect environment information safely
    const envInfo = {
      nodeEnv: process.env.NODE_ENV || 'not set',
      demoMode: process.env.DEMO_MODE || 'not set',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set',
      dbUrlExists: !!process.env.DATABASE_URL,
      runtimeEnv: typeof window === 'undefined' ? 'server' : 'client',
      serverTime: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
    };

    // Return environment info
    return NextResponse.json({
      status: "ok",
      environment: envInfo
    });
  } catch (error) {
    console.error("Error in env-check:", error);
    return NextResponse.json({
      status: "error",
      message: (error as Error).message
    }, { status: 500 });
  }
} 