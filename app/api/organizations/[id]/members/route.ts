import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/organizations/[id]/members - Get all members of a specific organization
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const members = await prisma.member.findMany({
      where: { organizationId: id },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching organization members:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization members" },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[id]/members - Add a member to a specific organization
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId, role } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if member already exists
    const existingMember = await prisma.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
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

    // Create the member
    const member = await prisma.member.create({
      data: {
        organizationId: id,
        userId,
        role: role || "MEMBER",
        email: body.email || "unknown@example.com",
        name: body.name || "Unknown Member"
      }
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Error adding organization member:", error);
    return NextResponse.json(
      { error: "Failed to add organization member" },
      { status: 500 }
    );
  }
} 