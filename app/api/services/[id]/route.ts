import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getServiceStatusChangeTemplate } from "@/lib/email";

// GET /api/services/[id] - Get a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = await prisma.service.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

// PATCH /api/services/[id] - Update a specific service
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, status } = await request.json();

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Service name is required" },
        { status: 400 }
      );
    }

    // Check if the service exists
    const existingService = await prisma.service.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Update the service
    const updatedService = await prisma.service.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description,
        status,
      },
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id] - Delete a specific service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = params.id;
    
    // Check if this is a demo service
    const isDemoService = serviceId.startsWith('demo-') || process.env.DEMO_MODE === 'true';
    
    // If it's a demo service, just return success
    if (isDemoService) {
      console.log(`Demo service deletion requested for ID: ${serviceId}`);
      return NextResponse.json({ 
        success: true,
        message: "Demo service deleted successfully",
        demoMode: true
      });
    }
    
    // For real services, check if the service exists
    const existingService = await prisma.service.findUnique({
      where: {
        id: serviceId,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Check if there are any incidents associated with this service
    const incidents = await prisma.incident.findMany({
      where: {
        serviceId: serviceId,
      },
    });

    if (incidents.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete service with existing incidents. Please delete the incidents first." },
        { status: 400 }
      );
    }

    // Delete the service
    await prisma.service.delete({
      where: {
        id: serviceId,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: "Service deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
} 