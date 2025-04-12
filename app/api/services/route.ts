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

// In-memory store for dynamically created demo services
const dynamicDemoServices: any[] = [];

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

    // If demo mode is enabled or this is a demo organization, return demo services
    const isDemoMode = process.env.DEMO_MODE === 'true' || organizationId.startsWith('demo-');
    
    if (isDemoMode) {
      console.log(`Returning demo services for organization: ${organizationId}`);
      
      // Get all default demo services for this organization
      const defaultDemoServices = DEMO_SERVICES.filter(
        service => service.organizationId === organizationId
      );
      
      // Find any dynamically created services for this organization
      const dynamicServices = dynamicDemoServices.filter(
        service => service.organizationId === organizationId
      );
      
      // Combine both sets of services
      const allServices = [...defaultDemoServices, ...dynamicServices];
      
      return NextResponse.json(allServices);
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

    // If error occurred, check if demo mode fallback should be used
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (process.env.DEMO_MODE === 'true' || (organizationId && organizationId.startsWith('demo-'))) {
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

    // Handle demo mode or demo organization
    const isDemoMode = process.env.DEMO_MODE === 'true' || organizationId.startsWith('demo-');
    
    if (isDemoMode) {
      // Create a mock service for demo
      const serviceId = id || generateUUID();
      const newService = {
        id: serviceId,
        name,
        description,
        status,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store the service in our dynamic services array if it doesn't already exist
      if (!id) {
        dynamicDemoServices.push(newService);
      } else {
        // Update existing service if found
        const existingIndex = dynamicDemoServices.findIndex(s => s.id === id);
        if (existingIndex >= 0) {
          dynamicDemoServices[existingIndex] = newService;
        } else {
          dynamicDemoServices.push(newService);
        }
      }

      console.log(`Demo service ${id ? 'updated' : 'created'}: ${name} (${serviceId})`);
      
      return NextResponse.json({ 
        service: newService,
        message: id 
          ? "Service updated successfully (Demo Mode)" 
          : "Service created successfully (Demo Mode)",
        demoMode: true
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
      if (process.env.DEMO_MODE === 'true' || (body && body.organizationId.startsWith('demo-'))) {
        // Create a fallback service with minimal data
        const fallbackService = {
          id: generateUUID(),
          name: body?.name || "Emergency Fallback Service",
          status: body?.status || "OPERATIONAL",
          description: body?.description || "Created during error recovery",
          organizationId: body?.organizationId || DEMO_ORG_ID,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Add to dynamic services for future retrieval
        dynamicDemoServices.push(fallbackService);
        
        // Return a mock success for demo organization even if there was an error
        return NextResponse.json({ 
          service: fallbackService,
          message: "Service operation handled in demo mode (error recovery)",
          demoMode: true
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