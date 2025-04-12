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
      console.log("[Sign Up] Database connection confirmed");
    } catch (dbConnError) {
      console.error("[Sign Up] Database connection failed:", dbConnError);
      return NextResponse.json({ 
        error: "Database connection failed", 
        details: (dbConnError as Error).message 
      }, { status: 500 });
    }

    const body = await request.json();
    const { email, password } = body;

    console.log(`[Sign Up] Attempt for email: ${email}`);

    // Validate required fields
    if (!email || !password) {
      console.log("[Sign Up] Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(`[Sign Up] Invalid email format: ${email}`);
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      console.log(`[Sign Up] Password too short for: ${email}`);
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.log(`[Sign Up] User already exists: ${email}`);
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }

      console.log(`[Sign Up] Creating new user: ${email}`);

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      console.log(`[Sign Up] User created: ${email}`);

      // Generate auth token (auto login)
      try {
        const token = createToken({
          userId: user.id,
          email: user.email,
        });

        console.log(`[Sign Up] Token created for: ${email}`);

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

        console.log(`[Sign Up] Success for: ${email}`);

        return NextResponse.json({
          user: userWithoutPassword,
          success: true
        }, { status: 201 });
      } catch (tokenError) {
        console.error(`[Sign Up] Token creation error for ${email}:`, tokenError);
        // Still return success but without auto-login
        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json({
          user: userWithoutPassword,
          success: true,
          autoLogin: false
        }, { status: 201 });
      }
    } catch (userError) {
      console.error(`[Sign Up] Database error:`, userError);
      throw new Error(`Database operation failed: ${(userError as Error).message}`);
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user", details: (error as Error).message },
      { status: 500 }
    );
  }
} 
