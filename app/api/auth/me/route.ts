import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    let token;
    
    // Check for Authorization Bearer token first
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('Using token from Authorization header');
    }
    
    // If no Authorization header, check cookies
    if (!token) {
      const cookieStore = cookies();
      token = cookieStore.get("__clerk_db_jwt")?.value;
      console.log('Using token from cookies');
    }

    if (!token) {
      return NextResponse.json({ 
        error: "Not authenticated", 
        user: null 
      }, { status: 401 });
    }

    // Verify the token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ 
        error: "Invalid token", 
        user: null 
      }, { status: 401 });
    }

    // Return user info
    const user = {
      id: payload.userId,
      email: payload.email,
      organizationId: payload.organizationId
    };
    
    console.log(`Retrieved user from token: ${user.id}, org: ${user.organizationId || 'none'}`);

    return NextResponse.json({ 
      user,
      isDemo: payload.userId.startsWith('demo-')
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    return NextResponse.json({ 
      error: "Failed to get current user", 
      user: null 
    }, { status: 500 });
  }
} 