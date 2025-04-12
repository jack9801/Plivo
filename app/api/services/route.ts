export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Define the demo organization ID constant
const DEMO_ORG_ID = 'demo-admin-org';

// Generate a UUID for demo services
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Demo services for fallback
const DEMO_SERVICES = [
  {
    id: 'demo-service-1',
    name: 'Demo API',
    status: 'OPERATIONAL',
    description: 'Demo API service',
    organizationId: 'demo-admin-org',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-service-2',
    name: 'Demo Website',
    status: 'OPERATIONAL',
    description: 'Demo website service',
    organizationId: 'demo-admin-org',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-service-3',
    name: 'Demo Authentication',
    status: 'OPERATIONAL',
    description: 'Demo auth service',
    organizationId: 'demo-admin-org',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

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

    // If this is a demo organization, return demo services
    if (organizationId.startsWith('demo-')) {
      const filteredServices = DEMO_SERVICES.filter(
        service => service.organizationId === organizationId
      );
      return NextResponse.json(filteredServices);
    }

    // Otherwise try to get real services from database
    const services = await prisma.service.findMany({
      where: {
        organizationId: organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // If we found real services, return them
    if (services.length > 0) {
      return NextResponse.json(services);
    }

    // If no real services found, return demo services as fallback
    return NextResponse.json(DEMO_SERVICES);
  } catch (error) {
    console.error("Error fetching services:", error);

    // If error occurred for a demo organization, return demo services
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (organizationId && organizationId.startsWith('demo-')) {
      const filteredServices = DEMO_SERVICES.filter(
        service => service.organizationId === organizationId
      );
      return NextResponse.json(filteredServices);
    }

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

    // Handle the demo organization
    if (organizationId === DEMO_ORG_ID) {
      // Create a mock service for demo
      const newService = {
        id: id || generateUUID(),
        name,
        description,
        status,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return NextResponse.json({ 
        service: newService,
        message: "Service created successfully (Demo Mode)" 
      }, { status: 201 });
    }

    // For real organizations, create or update the service in the database
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
    
    // Check if this is a demo organization and handle the error gracefully
    try {
      if (body && body.organizationId === DEMO_ORG_ID) {
        // Return a mock success for demo organization even if there was an error
        return NextResponse.json({ 
          message: "Service operation handled in demo mode",
          error: "Backend error occurred but demo mode recovered" 
        }, { status: 200 });
      }
    } catch (e) {
      // Ignore errors in error handling
    }
    
    return NextResponse.json({ 
      error: "Failed to create/update service",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 