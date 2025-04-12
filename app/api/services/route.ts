export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/services - Get all services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Get services from database
    const services = await prisma.service.findMany({
      where: {
        organizationId: organizationId,
      },
      orderBy: {
        createdAt: "desc",
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

// POST /api/services - Create or update a service
export async function POST(request: NextRequest) {
  let body: any;
  
  try {
    // Extracting the request parameters
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({
        error: "Invalid JSON"
      }, { status: 400 });
    }
    
    const { organizationId, name, status, description, id } = body;
    
    // Check for required fields
    if (!organizationId || !name || !status) {
      return NextResponse.json({
        error: "Missing required fields"
      }, { status: 400 });
    }

    // Create or update the service in the database
    const existingService = id ? await prisma.service.findUnique({
      where: { id }
    }) : null;

    const service = await prisma.service.upsert({
      where: { 
        id: id || 'create-new-id',
      },
      update: {
        name,
        description,
        status,
        updatedAt: new Date(),
      },
      create: {
        name,
        description,
        status,
        organizationId,
      },
    });

    return NextResponse.json({ 
      service,
      message: existingService ? "Service updated successfully" : "Service created successfully" 
    }, { status: existingService ? 200 : 201 });
  } catch (error) {
    console.error('Error creating/updating service:', error);
    
    return NextResponse.json({ 
      error: "Failed to create/update service",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 