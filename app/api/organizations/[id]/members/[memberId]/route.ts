import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/organizations/[id]/members/[memberId] - Get a specific member
export async function GET(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const { id, memberId } = params;
    
    const member = await prisma.member.findUnique({
      where: {
        id: memberId,
        organizationId: id
      }
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error fetching member:", error);
    return NextResponse.json(
      { error: "Failed to fetch member" },
      { status: 500 }
    );
  }
}

// PATCH /api/organizations/[id]/members/[memberId] - Update a specific member
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const { id, memberId } = params;
    const body = await request.json();
    const { role } = body;

    const member = await prisma.member.update({
      where: {
        id: memberId,
        organizationId: id
      },
      data: {
        role
      }
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id]/members/[memberId] - Remove a specific member
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const { id, memberId } = params;
    
    await prisma.member.delete({
      where: {
        id: memberId,
        organizationId: id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
} 