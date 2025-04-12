import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

// POST /api/auth/register - Handle user registration
export async function POST(request: NextRequest) {
  try {
    const { email, password, name, organizationName, organizationSlug } = await request.json();
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user and organization in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create the user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword
        }
      });

      // If organization name is provided, create an organization too
      if (organizationName) {
        // Generate slug from name if not provided
        const slug = organizationSlug || organizationName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Create the organization
        const organization = await prisma.organization.create({
          data: {
            name: organizationName,
            slug
          }
        });

        // Add the user as an ADMIN member of the organization
        const member = await prisma.member.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: "ADMIN"
          }
        });

        return { user, organization, member };
      }

      return { user, organization: null, member: null };
    });

    // Generate a token for the user
    const token = await createToken({ 
      userId: result.user.id, 
      email: result.user.email 
    });

    // Return success response
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        createdAt: result.user.createdAt
      },
      organization: result.organization || null
    }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 