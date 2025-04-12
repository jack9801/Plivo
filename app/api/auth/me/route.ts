import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get the auth cookie
    const cookieStore = cookies();
    const token = cookieStore.get("__clerk_db_jwt")?.value;

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