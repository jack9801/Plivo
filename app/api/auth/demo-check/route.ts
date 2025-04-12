import { NextRequest, NextResponse } from "next/server";

// GET /api/auth/demo-check - Check if demo mode is enabled
export async function GET(request: NextRequest) {
  return NextResponse.json({
    demoMode: process.env.DEMO_MODE === 'true',
    message: process.env.DEMO_MODE === 'true' 
      ? 'Demo mode is enabled' 
      : 'Demo mode is not enabled'
  });
} 