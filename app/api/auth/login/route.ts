import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

// POST /api/auth/login - Handle real user login
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Explicitly connect to ensure Prisma client is initialized
    await prisma.$connect();

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // If no user found with that email
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Compare the provided password with the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Find user's organizations (assuming the first one as primary)
    const membership = await prisma.member.findFirst({
      where: { userId: user.id },
      include: { organization: true }
    });

    // Create a JWT token
    const token = await createToken({ 
      userId: user.id, 
      email: user.email,
      ...(membership?.organization ? { organizationId: membership.organization.id } : {}) 
    });

    // Return token and user data
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      },
      organization: membership?.organization || null
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  } finally {
    // Always disconnect to prevent connection issues
    await prisma.$disconnect();
  }
} 