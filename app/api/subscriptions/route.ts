// Add dynamic directive at the beginning of the file
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

// GET /api/subscriptions - List subscriptions (admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    
    // If token is provided, verify subscription
    if (token) {
      const subscription = await prisma.subscription.findUnique({
        where: { token },
        include: { organization: true }
      });
      
      if (!subscription) {
        return NextResponse.json(
          { error: "Invalid verification token" },
          { status: 400 }
        );
      }
      
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { confirmed: true }
      });
      
      return NextResponse.json({
        success: true,
        message: `You've successfully subscribed to ${subscription.organization.name} status updates`
      });
    }

    // If email is provided, get subscriptions for that email
    if (email) {
      const subscriptions = await prisma.subscription.findMany({
        where: { email },
        include: { organization: { select: { name: true, slug: true } } }
      });
      
      return NextResponse.json(subscriptions);
    }

    // Default to all subscriptions (admin only - should be protected)
    const subscriptions = await prisma.subscription.findMany({
      include: { organization: { select: { name: true, slug: true } } }
    });
    
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("Error getting subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to get subscriptions" },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Create a new subscription
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, organizationId } = body;
    
    if (!email || !organizationId) {
      return NextResponse.json(
        { error: "Email and organization ID are required" },
        { status: 400 }
      );
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });
    
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Generate a verification token
    const token = crypto.randomBytes(32).toString('hex');
    const timestamp = new Date().toISOString();
    
    // Create or update subscription
    const subscription = await prisma.subscription.upsert({
      where: {
        email_organizationId: {
          email,
          organizationId
        }
      },
      update: {
        token,
        confirmed: false // Reset to false for re-verification
      },
      create: {
        email,
        organizationId,
        token,
        confirmed: false
      }
    });

    console.log(`Creating subscription for ${email} to ${organization.name} updates`, {
      subscriptionId: subscription.id,
      organizationId,
      organizationName: organization.name,
      email,
      timestamp,
      tokenPreview: `${token.substring(0, 8)}...`,
    });

    // Send verification email with improved template
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/subscriptions?token=${token}`;
    const statusPageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/status/${organization.slug}`;
    
    const emailResult = await sendEmail({
      to: email,
      subject: `Confirm your subscription to ${organization.name} status updates`,
      text: `
Please confirm your subscription to ${organization.name} status updates by clicking this link:
${verificationUrl}

By confirming this subscription, you will receive email notifications about:
- New incidents
- Incident updates
- Service status changes

You can view the current status at: ${statusPageUrl}

If you didn't request this subscription, you can ignore this email.

Request details:
- Organization: ${organization.name}
- Timestamp: ${timestamp}
- Email: ${email}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">Confirm your subscription</h2>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333;">Please confirm your subscription to <strong>${organization.name}</strong> status updates by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold;">
              Confirm Subscription
            </a>
          </div>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin-top: 0; font-weight: bold;">By confirming, you will receive email notifications about:</p>
            <ul>
              <li>New incidents</li>
              <li>Incident updates</li>
              <li>Service status changes</li>
            </ul>
          </div>
          
          <p>You can view the current status at: <a href="${statusPageUrl}" style="color: #2563eb;">${organization.name} Status Page</a></p>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="font-size: 14px; background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">${verificationUrl}</p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
          
          <p style="font-size: 14px; color: #666;">If you didn't request this subscription, you can ignore this email.</p>
          
          <div style="font-size: 12px; color: #999; margin-top: 20px;">
            <p>Request details:</p>
            <p>Organization: ${organization.name}</p>
            <p>Timestamp: ${timestamp}</p>
            <p>Email: ${email}</p>
          </div>
        </div>
      `
    });
    
    console.log("Subscription verification email result:", {
      success: emailResult.success,
      messageId: emailResult.messageId,
      response: emailResult.response,
      email,
      organization: organization.name
    });
    
    return NextResponse.json({
      success: true,
      message: "Subscription created. Please check your email to confirm.",
      emailStatus: emailResult.success ? "sent" : "failed"
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/subscriptions - Unsubscribe
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: "Unsubscribe token is required" },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { token },
      include: { organization: true }
    });
    
    if (!subscription) {
      return NextResponse.json(
        { error: "Invalid unsubscribe token" },
        { status: 400 }
      );
    }

    await prisma.subscription.delete({
      where: { id: subscription.id }
    });
    
    return NextResponse.json({
      success: true,
      message: `You've been unsubscribed from ${subscription.organization.name} status updates`
    });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
} 
