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

    // Force demo mode for Vercel deployments or if organization ID starts with demo-
    const isDemoMode = process.env.DEMO_MODE === 'true' || organizationId.startsWith('demo-');

    // Check if this is a demo organization
    if (isDemoMode) {
      console.log("Creating incident in demo mode");
      // Generate a unique ID for the demo incident
      const timestamp = new Date().getTime();
      const incidentId = `demo-incident-${timestamp}`;
      const updateId = `demo-update-${timestamp}`;
      
      // Get service name for the provided service ID
      let serviceName = "Unknown Service";
      if (serviceId.startsWith('demo-')) {
        // For demo services, generate a readable name
        serviceName = `Demo Service ${serviceId.slice(-5)}`;
      } else {
        // Try to simulate looking up the service name
        try {
          const services = await prisma.service.findUnique({
            where: { id: serviceId }
          });
          if (services) {
            serviceName = services.name;
          }
        } catch (e) {
          console.log("Could not fetch service name for demo incident, using default");
        }
      }
      
      // Create a mock incident
      const demoIncident = {
        id: incidentId,
        title,
        description: incidentDescription,
        status: incidentStatus,
        severity: incidentSeverity,
        serviceId,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
        service: {
          id: serviceId,
          name: serviceName,
          status: 'DEGRADED',
          description: 'Service affected by the incident'
        },
        updates: [
          {
            id: updateId,
            content: incidentDescription,
            status: incidentStatus,
            createdAt: new Date(),
            incidentId
          }
        ]
      };
      
      // Store the demo incident temporarily in memory or return it directly
      // (In a real app, you might want to store this in a more persistent way)
      
      // Add the demo incident to our array for future fetches
      DEMO_INCIDENTS.push(demoIncident);
      
      return NextResponse.json({ 
        success: true, 
        incident: demoIncident,
        id: incidentId,
        message: "Demo incident created successfully",
        demoMode: true
      }, { status: 201 });
    }

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
        description,
        status,
        severity,
        serviceId,
        organizationId,
        updates: {
          create: {
            content: description,
            status,
          },
        },
      },
      include: {
        service: true,
        updates: true,
      },
    });

    // Send notifications to subscribers
    try {
      // Find all confirmed subscriptions for this organization
      console.log(`Looking for subscribers for organization ${organizationId}`);
      const subscriptions = await prisma.subscription.findMany({
        where: {
          organizationId,
          confirmed: true
        }
      });

      console.log(`Found ${subscriptions.length} confirmed subscriptions`);

      // Send email to each subscriber
      let sentCount = 0;
      for (const subscription of subscriptions) {
        console.log(`Preparing to send email to ${subscription.email}`);

        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/subscriptions?token=${subscription.token}&unsubscribe=true`;
        
        const { subject, text, html } = getIncidentCreatedTemplate({
          organizationName: organization.name,
          incidentTitle: title,
          serviceName: service.name,
          severity: severity,
          description: description,
          timestamp: new Date(incident.createdAt).toLocaleString(),
          unsubscribeUrl
        });

        const emailResult = await sendEmail({
          to: subscription.email,
          subject,
          text,
          html
        });

        if (emailResult.success) {
          console.log(`Email sent successfully to ${subscription.email}`);
          sentCount++;
        } else {
          console.error(`Failed to send email to ${subscription.email}:`, emailResult.error);
        }
      }

      console.log(`✅ Sent incident notifications to ${sentCount} subscribers out of ${subscriptions.length}`);
    } catch (notificationError) {
      // Don't fail the request if notifications fail
      console.error("❌ Error sending incident notifications:", notificationError);
    }

    // Don't return the incident with all data, just the success message
    return NextResponse.json({ 
      success: true, 
      id: incident.id,
      message: "Incident created successfully" 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating incident:", error);
    
    // If error occurred for a demo organization, create a demo incident
    const { title, description, status, severity, serviceId, organizationId } = body || {};
    
    if (organizationId && (process.env.DEMO_MODE === 'true' || organizationId.startsWith('demo-'))) {
      console.log("Falling back to demo incident creation after error");
      // Generate a unique ID for the demo incident
      const timestamp = new Date().getTime();
      const incidentId = `demo-incident-${timestamp}`;
      
      return NextResponse.json({ 
        success: true, 
        id: incidentId,
        message: "Demo incident created successfully (fallback)",
        demoMode: true
      }, { status: 201 });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create incident",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
