import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/organizations/[id] - Get a specific organization
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        services: true,
        members: true,
      }
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}

// PATCH /api/organizations/[id] - Update a specific organization
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, slug } = body;

    // Check if organization with the same slug already exists (if slug is being updated)
    if (slug) {
      const existingOrg = await prisma.organization.findFirst({
        where: {
          slug,
          NOT: {
            id
          }
        }
      });

      if (existingOrg) {
        return NextResponse.json(
          { error: "Organization with this slug already exists" },
          { status: 400 }
        );
      }
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        name,
        slug,
      }
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id] - Delete a specific organization
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log(`Deleting organization with ID: ${id}`);
    
    // First delete all subscriptions associated with the organization
    await prisma.subscription.deleteMany({
      where: { organizationId: id }
    });
    console.log(`Deleted subscriptions for organization ${id}`);
    
    // Delete all incidents updates first
    const incidents = await prisma.incident.findMany({
      where: { organizationId: id },
      select: { id: true }
    });
    
    for (const incident of incidents) {
      await prisma.update.deleteMany({
        where: { incidentId: incident.id }
      });
    }
    console.log(`Deleted incident updates for organization ${id}`);
    
    // Delete all incidents associated with the organization
    await prisma.incident.deleteMany({
      where: { organizationId: id }
    });
    console.log(`Deleted incidents for organization ${id}`);
    
    // Delete all service metrics
    const services = await prisma.service.findMany({
      where: { organizationId: id },
      select: { id: true }
    });
    
    for (const service of services) {
      await prisma.serviceMetric.deleteMany({
        where: { serviceId: service.id }
      });
    }
    console.log(`Deleted service metrics for organization ${id}`);
    
    // Delete all services associated with the organization
    await prisma.service.deleteMany({
      where: { organizationId: id }
    });
    console.log(`Deleted services for organization ${id}`);
    
    // Delete all members associated with the organization
    await prisma.member.deleteMany({
      where: { organizationId: id }
    });
    console.log(`Deleted members for organization ${id}`);
    
    // Finally delete the organization
    await prisma.organization.delete({
      where: { id }
    });
    console.log(`Successfully deleted organization ${id}`);

    return NextResponse.json({ 
      success: true,
      message: "Organization and all associated data deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to delete organization", details: error.message },
      { status: 500 }
    );
  }
} 