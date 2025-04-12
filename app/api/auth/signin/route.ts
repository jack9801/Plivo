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
    role: 'ADMIN',
    organizationId: 'demo-admin-org' // Add organization ID reference
  },
  {
    id: 'demo-user-id',
    email: 'user@example.com',
    password: 'password123',
    name: 'Demo User',
    role: 'USER',
    organizationId: 'demo-user-org' // Add organization ID reference
  }
];

// Demo mode is now a fallback, not a forced option
const USE_DEMO_FALLBACK = true;

export async function POST(request: Request) {
  try {
    console.log("[Sign In] API called");
    
    // Log crucial environment information
    console.log(`[Sign In] Environment: ${process.env.NODE_ENV}`);
    console.log(`[Sign In] App URL: ${process.env.NEXT_PUBLIC_APP_URL}`);
    console.log(`[Sign In] Demo Mode Env: ${process.env.DEMO_MODE}`);
    
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

    // First check for demo users explicitly
    const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (demoUser) {
      return handleDemoUser(demoUser, emailPrefix);
    }

    // Try to authenticate with the database (real users take priority)
    let dbConnectResult = false;
    let dbErrorMessage = "";
    
    try {
      console.log("[Sign In] Checking database connection...");
      
      await prisma.$queryRaw`SELECT 1`;
      dbConnectResult = true;
      console.log("[Sign In] Database connection confirmed");

      // Database is connected, try to authenticate the user
      if (!email || !password) {
        console.log("[Sign In] Missing email or password");
        return NextResponse.json(
          { error: "Email and password are required", success: false },
          { status: 400 }
        );
      }
      
      // Find the user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // If user exists, verify the password
      if (user) {
        console.log(`[Sign In] User found: ${emailPrefix}@..., verifying password`);

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
          console.log(`[Sign In] Password valid for: ${emailPrefix}@..., creating token`);

          // Create a JWT token with user info
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
        } else {
          console.log(`[Sign In] Invalid password for: ${emailPrefix}@...`);
          
          // Wrong password - check if demo user before returning error
          if (email === 'admin@example.com' || email === 'user@example.com') {
            return NextResponse.json({ 
              error: "Incorrect password for demo account. Use 'password123'",
              success: false
            }, { status: 401 });
          }
          
          return NextResponse.json(
            { error: "Invalid email or password", success: false },
            { status: 401 }
          );
        }
      } else {
        console.log(`[Sign In] User not found: ${emailPrefix}@...`);
        
        // User not found - check if it's a demo email with wrong password
        if (email === 'admin@example.com' || email === 'user@example.com') {
          return NextResponse.json({ 
            error: "Incorrect password for demo account. Use 'password123'",
            success: false
          }, { status: 401 });
        }
        
        return NextResponse.json(
          { error: "Invalid email or password", success: false },
          { status: 401 }
        );
      }
    } catch (dbError: any) {
      // Database error
      dbErrorMessage = dbError?.message || "Unknown database error";
      console.error("[Sign In] Database error:", dbError);
      console.error(`[Sign In] Database error details: ${dbErrorMessage}`);
      
      // On database error, fall back to demo users if enabled
      if (USE_DEMO_FALLBACK) {
        console.log("[Sign In] Falling back to demo users due to database error");
        
        // Check if this is a demo email with the wrong password
        if (email === 'admin@example.com' || email === 'user@example.com') {
          const demoUser = DEMO_USERS.find(u => u.email === email);
          if (demoUser && password !== demoUser.password) {
            return NextResponse.json({ 
              error: "Incorrect password for demo account. Use 'password123'",
              success: false
            }, { status: 401 });
          }
        }
        
        // No matching demo user, suggest using demo credentials
        return NextResponse.json({ 
          error: "Authentication failed. You can use demo account: admin@example.com / password123", 
          details: dbErrorMessage,
          demoMode: true,
          success: false
        }, { status: 503 });
      }
      
      // If demo fallback is disabled, return the database error
      return NextResponse.json({ 
        error: "Database error. Please try again later.", 
        details: dbErrorMessage,
        success: false
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error authenticating user:", error);
    return NextResponse.json(
      { 
        error: "Authentication failed. Please try again later.", 
        details: (error as Error).message, 
        success: false
      },
      { status: 500 }
    );
  }
}

// Helper function to handle demo user authentication
function handleDemoUser(demoUser: any, emailPrefix: string) {
  console.log(`[Sign In] Demo user authenticated: ${emailPrefix}@...`);
  
  // Create token for demo user with organization info
  const token = createToken({
    userId: demoUser.id,
    email: demoUser.email,
    organizationId: demoUser.organizationId // Include organization ID in the token
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