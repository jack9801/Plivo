import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/debug-subscriptions - Get all subscriptions with more details
export async function GET(request: Request) {
  try {
    // Get all subscriptions with organization details
    const subscriptions = await prisma.subscription.findMany({
      include: {
        organization: {
          select: { name: true, slug: true }
        }
      }
    });
    
    // Count total, confirmed, and unconfirmed subscriptions
    const stats = {
      total: subscriptions.length,
      confirmed: subscriptions.filter(s => s.confirmed).length,
      unconfirmed: subscriptions.filter(s => !s.confirmed).length
    };
    
    return NextResponse.json({
      stats,
      subscriptions
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

// POST /api/debug-subscriptions - Create a subscription directly with confirmed=true
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

    // Generate a token (for unsubscribe functionality)
    const token = require('crypto').randomBytes(32).toString('hex');
    
    // Create or update subscription with confirmed=true
    const subscription = await prisma.subscription.upsert({
      where: {
        email_organizationId: {
          email,
          organizationId
        }
      },
      update: {
        token,
        confirmed: true // Force to true
      },
      create: {
        email,
        organizationId,
        token,
        confirmed: true // Create as confirmed
      },
      include: {
        organization: {
          select: { name: true, slug: true }
        }
      }
    });

    return NextResponse.json({
      message: "Subscription created and confirmed",
      subscription
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
} 
