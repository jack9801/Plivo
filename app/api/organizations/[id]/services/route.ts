import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/organizations/[id]/services - Get all services for an organization
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const services = await prisma.service.findMany({
      where: {
        organizationId: params.id,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[id]/services - Create a new service for an organization
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, status } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Service name is required" },
        { status: 400 }
      );
    }

    // Check if the organization exists
    const organization = await prisma.organization.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Create the service
    const service = await prisma.service.create({
      data: {
        name,
        description,
        status: status || "OPERATIONAL",
        organizationId: params.id,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
} 