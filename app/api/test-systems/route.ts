import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// GET /api/test-systems - Test various system components
export async function GET(request: Request) {
  const results = {
    tests: {
      subscriptions: [] as any[]
    },
    email: {
      success: true,
      config: {},
      test: null as string | null,
      error: null as string | null,
      messageId: null as string | null
    },
    db: {
      connection: "Pending",
      success: true,
      counts: {},
      error: null as string | null
    },
    endpoints: {}
  };
  
  try {
    // 1. Test email configuration
    results.email.config = {
      host: process.env.EMAIL_HOST || 'Not configured',
      port: process.env.EMAIL_PORT || 'Not configured',
      user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 4)}...` : 'Not configured',
      password: process.env.EMAIL_PASSWORD ? 'Set' : 'Not configured',
      from: process.env.EMAIL_FROM || 'Not configured',
      secure: process.env.EMAIL_SECURE || 'Not configured'
    };
    
    // 2. Test database connection
    try {
      // Simple query to test connection
      const orgCount = await prisma.organization.count();
      const serviceCount = await prisma.service.count();
      const incidentCount = await prisma.incident.count();
      const subscriptionCount = await prisma.subscription.count();
      
      results.db.connection = "Success";
      results.db.counts = {
        organizations: orgCount,
        services: serviceCount,
        incidents: incidentCount,
        subscriptions: subscriptionCount
      };
    } catch (dbError) {
      results.db.success = false;
      results.db.error = dbError instanceof Error ? dbError.message : 'Unknown error';
    }
    
    // 3. Test a subscription record
    if (results.db.connection === "Success") {
      const subscriptions = await prisma.subscription.findMany({
        take: 5,
        include: { organization: true }
      });
      
      results.tests.subscriptions = subscriptions.map(sub => ({
        id: sub.id,
        email: sub.email,
        confirmed: sub.confirmed,
        organization: sub.organization?.name || 'Unknown',
        created: sub.createdAt.toISOString()
      }));
    }
    
    // 4. Send a test email if configuration is available
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        const emailResult = await sendEmail({
          to: "test@example.com",
          subject: "Status Page System Test",
          text: "This is a system test email to verify that the email configuration is working correctly.",
          html: "<p>This is a system test email to verify that the email configuration is working correctly.</p>"
        });
        
        results.email.test = emailResult.success ? "Success" : "Failed";
        if (!emailResult.success) {
          results.email.success = false;
          results.email.error = emailResult.error instanceof Error ? emailResult.error.message : emailResult.error as string;
        } else {
          results.email.messageId = emailResult.messageId as string;
        }
      } catch (emailError) {
        results.email.success = false;
        results.email.error = emailError instanceof Error ? emailError.message : 'Unknown error';
      }
    } else {
      results.email.test = "Skipped - No configuration";
    }
    
    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      results
    });
  } catch (error) {
    console.error("Error in system test:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 