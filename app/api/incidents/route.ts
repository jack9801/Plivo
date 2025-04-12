// Add dynamic directive at the beginning of the file
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, getIncidentCreatedTemplate } from "@/lib/email";

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

    return NextResponse.json(incidents);
  } catch (error) {
    console.error("Error fetching incidents:", error);
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

    // Check if organization exists
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
    return NextResponse.json(
      { error: "Failed to create incident" },
      { status: 500 }
    );
  }
} 
