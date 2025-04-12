import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("[Sign In] Database connection confirmed");
    } catch (dbConnError) {
      console.error("[Sign In] Database connection failed:", dbConnError);
      return NextResponse.json({ 
        error: "Database connection failed", 
        details: (dbConnError as Error).message 
      }, { status: 500 });
    }

    const body = await request.json();
    const { email, password } = body;

    console.log(`[Sign In] Attempt for email: ${email}`);

    // Validate required fields
    if (!email || !password) {
      console.log("[Sign In] Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find the user
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // If user doesn't exist or password is wrong
      if (!user) {
        console.log(`[Sign In] User not found: ${email}`);
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      console.log(`[Sign In] User found: ${email}, verifying password`);

      // Verify password
      try {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          console.log(`[Sign In] Invalid password for: ${email}`);
          return NextResponse.json(
            { error: "Invalid email or password" },
            { status: 401 }
          );
        }

        console.log(`[Sign In] Password valid for: ${email}, creating token`);

        // Create a JWT token with user info
        try {
          const token = createToken({
            userId: user.id,
            email: user.email,
          });

          console.log(`[Sign In] Token created for: ${email}, setting cookie`);

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

          console.log(`[Sign In] Success for: ${email}`);

          return NextResponse.json({
            user: userWithoutPassword,
            success: true
          });
        } catch (tokenError) {
          console.error(`[Sign In] Token creation error for ${email}:`, tokenError);
          throw new Error(`Token creation failed: ${(tokenError as Error).message}`);
        }
      } catch (passwordError) {
        console.error(`[Sign In] Password comparison error for ${email}:`, passwordError);
        throw new Error(`Password comparison failed: ${(passwordError as Error).message}`);
      }
    } catch (userError) {
      console.error(`[Sign In] Database error for ${email}:`, userError);
      throw new Error(`Database operation failed: ${(userError as Error).message}`);
    }
  } catch (error) {
    console.error("Error authenticating user:", error);
    return NextResponse.json(
      { error: "Authentication failed", details: (error as Error).message },
      { status: 500 }
    );
  }
} 