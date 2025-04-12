// Add dynamic directive at the beginning of the file
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, getIncidentCreatedTemplate } from "@/lib/email";

// Demo incidents for fallback
const DEMO_INCIDENTS = [
  {
    id: 'demo-incident-1',
    title: 'Demo API Degradation',
    description: 'Our API is experiencing some performance issues.',
    status: 'INVESTIGATING',
    severity: 'MEDIUM',
    serviceId: 'demo-service-1',
    organizationId: 'demo-admin-org',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    service: {
      id: 'demo-service-1',
      name: 'Demo API',
      status: 'DEGRADED',
      description: 'Demo API service'
    },
    updates: [
      {
        id: 'demo-update-1',
        content: 'We are investigating the API performance issues.',
        status: 'INVESTIGATING',
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        incidentId: 'demo-incident-1'
      }
    ]
  }
];

// GET /api/incidents - Get all incidents
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

    // If this is a demo organization, return demo incidents
    if (organizationId.startsWith('demo-') || process.env.DEMO_MODE === 'true') {
      const filteredIncidents = DEMO_INCIDENTS.filter(
        incident => incident.organizationId === organizationId
      );
      
      // Ensure each incident has a properly structured service property
      const enhancedDemoIncidents = filteredIncidents.map(incident => ({
        ...incident,
        service: incident.service || {
          id: incident.serviceId,
          name: `Service ${incident.serviceId.slice(-5)}`,
          status: 'DEGRADED',
          description: 'Demo service'
        }
      }));
      
      return NextResponse.json(enhancedDemoIncidents);
    }

    // Otherwise try to get real incidents from database
    const incidents = await prisma.incident.findMany({
      where: {
        organizationId,
      },
      include: {
        service: true,
        updates: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // If we found real incidents, return them
    if (incidents.length > 0) {
      return NextResponse.json(incidents);
    }

    // If no real incidents found and this is a demo org, return empty array
    if (organizationId.startsWith('demo-') || process.env.DEMO_MODE === 'true') {
      return NextResponse.json([]);
    }

    // Otherwise return demo incidents as fallback
    return NextResponse.json(DEMO_INCIDENTS);
  } catch (error) {
    console.error("Error fetching incidents:", error);

    // If error occurred for a demo organization, return demo incidents
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (organizationId && (organizationId.startsWith('demo-') || process.env.DEMO_MODE === 'true')) {
      const filteredIncidents = DEMO_INCIDENTS.filter(
        incident => incident.organizationId === organizationId
      );
      
      // Ensure each incident has a properly structured service property
      const enhancedDemoIncidents = filteredIncidents.map(incident => ({
        ...incident,
        service: incident.service || {
          id: incident.serviceId,
          name: `Service ${incident.serviceId.slice(-5)}`,
          status: 'DEGRADED',
          description: 'Demo service'
        }
      }));
      
      return NextResponse.json(enhancedDemoIncidents);
    }

    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 }
    );
  }
}

// POST /api/incidents - Create a new incident
export async function POST(request: NextRequest) {
  // Parse the request body first, outside of the try/catch block
  let body;
  try {
    body = await request.json();
  } catch (jsonError) {
    console.error("Error parsing incident request body:", jsonError);
    return NextResponse.json({
      error: "Invalid request format. Please check your JSON data.",
      details: "Failed to parse request body."
    }, { status: 400 });
  }
  
  try {
    const { title, description, status, severity, serviceId, organizationId } = body;
    
    console.log("Received incident creation request:", { title, serviceId, organizationId });

    // Validate input
    if (!title || !serviceId || !organizationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Set defaults for optional fields
    const incidentStatus = status || "INVESTIGATING";
    const incidentSeverity = severity || "MEDIUM";
    const incidentDescription = description || title;

    // For real organizations, check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Create incident
    const incident = await prisma.incident.create({
      data: {
        title,
        description: incidentDescription,
        status: incidentStatus,
        severity: incidentSeverity,
        serviceId,
        organizationId,
        updates: {
          create: {
            content: incidentDescription,
            status: incidentStatus,
          },
        },
      },
      include: {
        service: true,
        updates: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      incident,
      id: incident.id,
      message: "Incident created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating incident:", error);
    return NextResponse.json(
      { error: "Failed to create incident", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 
