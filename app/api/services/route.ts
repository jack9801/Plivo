import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Demo services for fallback
const DEMO_SERVICES = [
  {
    id: 'demo-service-1',
    name: 'Demo API',
    status: 'OPERATIONAL',
    description: 'Demo API service',
    organizationId: 'demo-admin-org',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'demo-service-2',
    name: 'Demo Website',
    status: 'OPERATIONAL',
    description: 'Demo website service',
    organizationId: 'demo-admin-org',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// GET /api/services - Get all services
export async function GET(request: Request) {
  try {
    // Get organization ID from query params if provided
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    
    // If this is a demo organization ID, return demo services
    if (organizationId && organizationId.startsWith('demo-')) {
      // Filter demo services to match organization
      const filteredServices = DEMO_SERVICES.filter(
        service => service.organizationId === organizationId
      );
      return NextResponse.json(filteredServices);
    }
    
    // Otherwise, try to get real services from database
    const whereClause = organizationId ? { organizationId } : {};
    
    const services = await prisma.service.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // If we found real services, return them
    if (services.length > 0) {
      return NextResponse.json(services);
    }
    
    // If specifically querying for a demo org but no services found, return empty array
    if (organizationId && organizationId.startsWith('demo-')) {
      return NextResponse.json([]);
    }
    
    // For all other cases with no results, return demo services as fallback
    return NextResponse.json(DEMO_SERVICES);
  } catch (error) {
    console.error("Error fetching services:", error);
    
    // On error for demo org, return demo services
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    if (organizationId && organizationId.startsWith('demo-')) {
      const filteredServices = DEMO_SERVICES.filter(
        service => service.organizationId === organizationId
      );
      return NextResponse.json(filteredServices);
    }
    
    // Otherwise return all demo services
    return NextResponse.json(DEMO_SERVICES);
  }
}

// POST /api/services - Create or update a service
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, status, description, organizationId } = body;
    
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }
    
    // Handle demo organization IDs specially
    if (organizationId.startsWith('demo-')) {
      // Generate a unique demo service ID
      const timestamp = new Date().getTime();
      const demoService = {
        id: id || `demo-service-${timestamp}`,
        name: name || 'New Demo Service',
        status: status || 'OPERATIONAL',
        description: description || 'Demo service description',
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Return the demo service
      return NextResponse.json(demoService);
    }

    // For real organizations, use the database
    const service = await prisma.service.upsert({
      where: { id: id || '' },
      update: {
        name,
        status,
        description
      },
      create: {
        name,
        status,
        description,
        organizationId
      }
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error creating/updating service:", error);
    
    // On error, check if it's a demo organization and return a mock service
    const body = await request.json().catch(() => ({}));
    const { organizationId, name, status, description } = body;
    
    if (organizationId && organizationId.startsWith('demo-')) {
      const timestamp = new Date().getTime();
      const demoService = {
        id: `demo-service-${timestamp}`,
        name: name || 'New Demo Service',
        status: status || 'OPERATIONAL',
        description: description || 'Demo service description',
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
        demoMode: true
      };
      
      return NextResponse.json(demoService);
    }
    
    return NextResponse.json({ 
      error: 'Failed to update service',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 