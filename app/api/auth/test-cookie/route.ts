import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get existing test cookie if any
    const existingCookie = cookies().get('auth-test-cookie')?.value;
    
    // Set a new test cookie
    const timestamp = new Date().toISOString();
    cookies().set({
      name: 'auth-test-cookie',
      value: `test-${timestamp}`,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      sameSite: 'lax'
    });
    
    // Return details about cookies
    return NextResponse.json({
      success: true,
      prevCookie: existingCookie || 'none',
      newCookie: `test-${timestamp}`,
      cookieSettings: {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60,
        sameSite: 'lax'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL
      }
    });
  } catch (error) {
    console.error('Error testing cookie:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
} 