import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// Demo user credentials - these will work even without a database connection
const DEMO_USERS = [
  {
    id: 'demo-admin-id',
    email: 'admin@example.com',
    password: 'password123',
    name: 'Admin User',
    role: 'ADMIN'
  },
  {
    id: 'demo-user-id',
    email: 'user@example.com',
    password: 'password123',
    name: 'Demo User',
    role: 'USER'
  }
];

export async function POST(request: Request) {
  try {
    console.log("[Sign In] API called");
    
    // Check environment mode
    console.log(`[Sign In] Environment: ${process.env.NODE_ENV}`);
    console.log(`[Sign In] App URL: ${process.env.NEXT_PUBLIC_APP_URL}`);
    
    // Safety check for request body
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error("[Sign In] Invalid JSON in request body:", jsonError);
      return NextResponse.json({ 
        error: "Invalid request format", 
        success: false 
      }, { status: 400 });
    }

    const { email, password } = body;

    // Log attempt with partial email for privacy
    const emailPrefix = email ? email.split('@')[0].substring(0, 3) + "***" : "undefined";
    console.log(`[Sign In] Attempt for email: ${emailPrefix}@...`);

    // Check for demo users first
    const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (demoUser) {
      console.log(`[Sign In] Demo user authenticated: ${emailPrefix}@...`);
      
      // Create token for demo user
      const token = createToken({
        userId: demoUser.id,
        email: demoUser.email
      });
      
      // Set auth cookie
      cookies().set({
        name: "__clerk_db_jwt",
        value: token,
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        sameSite: "lax"
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = demoUser;
      
      return NextResponse.json({
        user: userWithoutPassword,
        success: true,
        demoMode: true
      });
    }

    // Check database connection with enhanced error info
    let dbConnectResult = false;
    let dbErrorMessage = "";
    
    try {
      console.log("[Sign In] Checking database connection...");
      console.log(`[Sign In] Database URL Pattern: ${process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.split('@')[0].substring(0, 12) + '...' : 
        'Not configured'}`);
      
      await prisma.$queryRaw`SELECT 1`;
      dbConnectResult = true;
      console.log("[Sign In] Database connection confirmed");
    } catch (dbConnError: any) {
      dbErrorMessage = dbConnError?.message || "Unknown database error";
      console.error("[Sign In] Database connection failed:", dbConnError);
      console.error(`[Sign In] Database error details: ${dbErrorMessage}`);
      
      // If database connection fails, suggest using demo accounts
      return NextResponse.json({ 
        error: "Database connection failed. Please use demo account: admin@example.com / password123", 
        details: dbErrorMessage,
        demoMode: true,
        success: false
      }, { status: 503 });
    }

    // Validate required fields
    if (!email || !password) {
      console.log("[Sign In] Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required", success: false },
        { status: 400 }
      );
    }
    
    // Find the user
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // If user doesn't exist
      if (!user) {
        console.log(`[Sign In] User not found: ${emailPrefix}@...`);
        return NextResponse.json(
          { error: "Invalid email or password", success: false },
          { status: 401 }
        );
      }

      console.log(`[Sign In] User found: ${emailPrefix}@..., verifying password`);

      // Verify password
      try {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          console.log(`[Sign In] Invalid password for: ${emailPrefix}@...`);
          return NextResponse.json(
            { error: "Invalid email or password", success: false },
            { status: 401 }
          );
        }

        console.log(`[Sign In] Password valid for: ${emailPrefix}@..., creating token`);

        // Create a JWT token with user info
        try {
          const token = createToken({
            userId: user.id,
            email: user.email,
          });

          console.log(`[Sign In] Token created for: ${emailPrefix}@..., setting cookie`);

          // Set auth cookie
          cookies().set({
            name: "__clerk_db_jwt",
            value: token,
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            sameSite: "lax"
          });

          // Don't send the password back to the client
          const { password: _, ...userWithoutPassword } = user;

          console.log(`[Sign In] Success for: ${emailPrefix}@...`);

          return NextResponse.json({
            user: userWithoutPassword,
            success: true
          });
        } catch (tokenError) {
          console.error(`[Sign In] Token creation error for ${emailPrefix}@...`, tokenError);
          return NextResponse.json({ 
            error: `Token creation failed: ${(tokenError as Error).message}`,
            success: false
          }, { status: 500 });
        }
      } catch (passwordError) {
        console.error(`[Sign In] Password comparison error for ${emailPrefix}@...`, passwordError);
        return NextResponse.json({ 
          error: `Authentication failed`,
          success: false
        }, { status: 500 });
      }
    } catch (userError) {
      console.error(`[Sign In] Database error for ${emailPrefix}@...`, userError);
      return NextResponse.json({ 
        error: `Database operation failed. Try demo account: admin@example.com / password123`,
        success: false,
        demoMode: true
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error authenticating user:", error);
    return NextResponse.json(
      { 
        error: "Authentication failed. Try demo account: admin@example.com / password123", 
        details: (error as Error).message, 
        success: false,
        demoMode: true 
      },
      { status: 500 }
    );
  }
} 