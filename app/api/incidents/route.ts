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
    if (organizationId.startsWith('demo-')) {
      const filteredIncidents = DEMO_INCIDENTS.filter(
        incident => incident.organizationId === organizationId
      );
      return NextResponse.json(filteredIncidents);
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
    if (organizationId.startsWith('demo-')) {
      return NextResponse.json([]);
    }

    // Otherwise return demo incidents as fallback
    return NextResponse.json(DEMO_INCIDENTS);
  } catch (error) {
    console.error("Error fetching incidents:", error);

    // If error occurred for a demo organization, return demo incidents
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (organizationId && organizationId.startsWith('demo-')) {
      const filteredIncidents = DEMO_INCIDENTS.filter(
        incident => incident.organizationId === organizationId
      );
      return NextResponse.json(filteredIncidents);
    }

    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 }
    );
  }
}

// POST /api/incidents - Create a new incident
export async function POST(request: NextRequest) {
  try {
    const { title, description, status, severity, serviceId, organizationId } = await request.json();

    // Validate input
    if (!title || !description || !status || !severity || !serviceId || !organizationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if this is a demo organization
    if (organizationId.startsWith('demo-')) {
      // Generate a unique ID for the demo incident
      const timestamp = new Date().getTime();
      const incidentId = `demo-incident-${timestamp}`;
      const updateId = `demo-update-${timestamp}`;
      
      // Create a mock incident
      const demoIncident = {
        id: incidentId,
        title,
        description,
        status,
        severity,
        serviceId,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
        service: {
          id: serviceId,
          name: serviceId.startsWith('demo-') ? 'Demo Service' : 'Unknown Service',
          status: 'DEGRADED',
          description: 'Demo service'
        },
        updates: [
          {
            id: updateId,
            content: description,
            status,
            createdAt: new Date(),
            incidentId
          }
        ],
        demoMode: true
      };
      
      return NextResponse.json({ 
        success: true, 
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
    try {
      const body = await request.json().catch(() => ({}));
      const { title, description, status, severity, serviceId, organizationId } = body;
      
      if (organizationId && organizationId.startsWith('demo-')) {
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
    } catch (fallbackError) {
      console.error("Error in fallback handling:", fallbackError);
    }
    
    return NextResponse.json(
      { error: "Failed to create incident" },
      { status: 500 }
    );
  }
} 
