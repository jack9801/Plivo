import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";

// Demo users for login
const DEMO_USERS = [
  {
    id: "demo-user-1",
    email: "demo@example.com",
    name: "Demo User",
    role: "ADMIN"
  },
  {
    id: "demo-user-2",
    email: "admin@example.com",
    name: "Demo Admin",
    role: "ADMIN"
  }
];

// POST /api/auth/demo - Handle demo login
export async function POST(request: NextRequest) {
  try {
    // Only allow this endpoint if demo mode is enabled
    if (process.env.DEMO_MODE !== 'true') {
      return NextResponse.json(
        { error: "Demo mode is not enabled" },
        { status: 403 }
      );
    }

    const { email, password } = await request.json();
    
    // In demo mode, any email is accepted with any password
    // You can implement specific demo credentials if desired
    const demoUser = DEMO_USERS.find(user => user.email === email) || {
      id: `demo-user-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: "USER"
    };

    // Create a JWT token for the demo user
    const token = await createToken({ 
      userId: demoUser.id, 
      email: demoUser.email
    });
    
    // Create demo organization if it doesn't exist
    const demoOrg = {
      id: "demo-admin-org",
      name: "Demo Organization",
      slug: "demo-org",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Return success with token and user data
    return NextResponse.json({
      success: true,
      token,
      user: demoUser,
      organization: demoOrg,
      message: "Demo login successful",
      demoMode: true
    });
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json(
      { error: "Failed to process demo login" },
      { status: 500 }
    );
  }
} 