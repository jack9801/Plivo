import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/incidents/[id] - Get a specific incident
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const incident = await prisma.incident.findUnique({
      where: {
        id,
      },
      include: {
        service: true,
        organization: true,
        updates: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(incident);
  } catch (error) {
    console.error("Error fetching incident:", error);
    return NextResponse.json(
      { error: "Failed to fetch incident" },
      { status: 500 }
    );
  }
}

// PATCH /api/incidents/[id] - Update a specific incident
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { title, description, status, severity, serviceId } = await request.json();

    // Validate if the incident exists
    const existingIncident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!existingIncident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    // Update the incident
    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        title,
        description,
        status,
        severity,
        serviceId,
      },
    });

    return NextResponse.json(updatedIncident);
  } catch (error) {
    console.error("Error updating incident:", error);
    return NextResponse.json(
      { error: "Failed to update incident" },
      { status: 500 }
    );
  }
}

// DELETE /api/incidents/[id] - Delete a specific incident
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Validate if the incident exists
    const existingIncident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!existingIncident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    // Delete all related incident updates first
    await prisma.update.deleteMany({
      where: { incidentId: id },
    });

    // Delete the incident
    await prisma.incident.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Incident deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting incident:", error);
    return NextResponse.json(
      { error: "Failed to delete incident" },
      { status: 500 }
    );
  }
}