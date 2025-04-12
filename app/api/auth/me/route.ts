import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get auth cookie
    const authCookie = cookies().get('__clerk_db_jwt')?.value;
    
    if (!authCookie) {
      return NextResponse.json({
        authenticated: false,
        user: null
      });
    }
    
    // Verify token
    const payload = verifyToken(authCookie);
    if (!payload) {
      return NextResponse.json({
        authenticated: false,
        user: null
      });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      // Token is valid but user no longer exists
      cookies().delete('__clerk_db_jwt');
      return NextResponse.json({
        authenticated: false,
        user: null
      });
    }
    
    return NextResponse.json({
      authenticated: true,
      user
    });
  } catch (error) {
    console.error("Error checking authentication:", error);
    return NextResponse.json({
      authenticated: false,
      user: null,
      error: "Failed to check authentication"
    }, { status: 500 });
  }
} 