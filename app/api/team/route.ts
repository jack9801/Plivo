import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { role, organizationId, userId, name } = await req.json();

    // Validate input
    if (!role || !organizationId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields (role, organizationId, userId)" },
        { status: 400 }
      );
    }

    // Get the user to get their email for the member record
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if member already exists
    const existingMember = await prisma.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId
        }
      }
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "Member already exists in this organization" },
        { status: 400 }
      );
    }

    // Created manually with non-typed query first, then fetch it
    const memberId = `mbr-${Date.now()}`;
    const memberName = name || user.email.split('@')[0];
    
    // First create the member with raw query
    await prisma.$executeRaw`
      INSERT INTO "Member" ("id", "organizationId", "userId", "role", "email", "name", "createdAt", "updatedAt")
      VALUES (
        ${memberId}, 
        ${organizationId}, 
        ${userId}, 
        ${role}, 
        ${user.email}, 
        ${memberName}, 
        ${new Date()}, 
        ${new Date()}
      );
    `;
    
    // Then fetch the created member with proper typing
    const createdMember = await prisma.member.findUnique({
      where: { id: memberId }
    });

    return NextResponse.json(createdMember, { status: 201 });
  } catch (error) {
    console.error("Error creating team member:", error);
    return NextResponse.json(
      { error: "Failed to create team member", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const teamMembers = await prisma.member.findMany({
      include: {
        organization: true
      }
    });
    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
