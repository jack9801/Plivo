import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// GET /api/incidents/[id]/updates - Get all updates for a specific incident
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const updates = await prisma.update.findMany({
      where: { incidentId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(updates);
  } catch (error) {
    console.error("Error fetching incident updates:", error);
    return NextResponse.json(
      { error: "Failed to fetch incident updates" },
      { status: 500 }
    );
  }
}

// POST /api/incidents/[id]/updates - Add an update to a specific incident
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { content, status } = await request.json();

    // Validate input
    if (!content || !status) {
      return NextResponse.json(
        { error: "Content and status are required" },
        { status: 400 }
      );
    }

    // Check if incident exists
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: { service: true, organization: true }
    });

    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    // Create update
    const update = await prisma.update.create({
      data: {
        content,
        status,
        incidentId: id,
      },
    });

    // Update incident status
    await prisma.incident.update({
      where: { id },
      data: { status },
    });

    // Send notifications to subscribers about the update
    try {
      // Find all confirmed subscriptions for this organization
      console.log(`Looking for subscribers for organization ${incident.organizationId}`);
      const subscriptions = await prisma.subscription.findMany({
        where: {
          organizationId: incident.organizationId,
          confirmed: true
        }
      });

      console.log(`Found ${subscriptions.length} confirmed subscriptions`);

      // Send email to each subscriber
      let sentCount = 0;
      for (const subscription of subscriptions) {
        console.log(`Preparing to send email to ${subscription.email}`);
        
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/subscriptions?token=${subscription.token}&unsubscribe=true`;
        const statusPageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/status/${incident.organization.slug}`;
        
        const emailResult = await sendEmail({
          to: subscription.email,
          subject: `[${incident.organization.name}] Incident Update - ${incident.title}`,
          text: `
Incident Update

Incident: ${incident.title}
Service: ${incident.service.name}
New Status: ${status || incident.status}
Time: ${new Date().toLocaleString()}

Update:
${content}

Visit our status page for more information: ${statusPageUrl}

Unsubscribe: ${unsubscribeUrl}
          `,
          html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
    .update { margin: 20px 0; padding: 15px; border-radius: 5px; background-color: #f0f0f0; }
    .status { display: inline-block; padding: 5px 10px; border-radius: 15px; font-size: 14px; }
    .investigating { background-color: #fff3cd; color: #856404; }
    .identified { background-color: #ffe5d0; color: #fd7e14; }
    .monitoring { background-color: #d1ecf1; color: #0c5460; }
    .resolved { background-color: #d4edda; color: #155724; }
    .footer { margin-top: 30px; font-size: 12px; color: #6c757d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${incident.organization.name} Incident Update</h2>
    </div>
    
    <div class="update">
      <h3>Update on Incident: ${incident.title}</h3>
      <p><strong>Service:</strong> ${incident.service.name}</p>
      <p><strong>Status:</strong> 
        <span class="status ${(status || incident.status).toLowerCase()}">${(status || incident.status).replace('_', ' ')}</span>
      </p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Update:</strong></p>
      <p>${content}</p>
    </div>
    
    <p>Visit our <a href="${statusPageUrl}">status page</a> for more information and updates.</p>
    
    <div class="footer">
      <p>You're receiving this email because you subscribed to status updates for ${incident.organization.name}.</p>
      <p><a href="${unsubscribeUrl}">Unsubscribe</a> from these notifications.</p>
    </div>
  </div>
</body>
</html>
          `
        });
        
        if (emailResult.success) {
          console.log(`Email sent successfully to ${subscription.email}`);
          sentCount++;
        } else {
          console.error(`Failed to send email to ${subscription.email}:`, emailResult.error);
        }
      }

      console.log(`✅ Sent incident update notifications to ${sentCount} subscribers out of ${subscriptions.length}`);
    } catch (notificationError) {
      // Don't fail the request if notifications fail
      console.error("❌ Error sending incident update notifications:", notificationError);
    }

    return NextResponse.json({ success: true, update });
  } catch (error) {
    console.error("Error creating incident update:", error);
    return NextResponse.json(
      { error: "Failed to create incident update" },
      { status: 500 }
    );
  }
} 