import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/organizations - Get all organizations
export async function GET() {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

// POST /api/organizations - Create a new organization
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, defaultEmail } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if organization with the same slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug }
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: "Organization with this slug already exists" },
        { status: 400 }
      );
    }

    // Generate a default subscription token
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');

    // Create the organization and automatically add subscription in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create the organization
      const organization = await prisma.organization.create({
        data: {
          name,
          slug,
        }
      });

      // If defaultEmail is provided, create a default confirmed subscription
      if (defaultEmail) {
        console.log(`Creating default subscription for organization ${organization.name} (${organization.id}) with email ${defaultEmail}`);
        
        const subscription = await prisma.subscription.create({
          data: {
            email: defaultEmail,
            organizationId: organization.id,
            token: token,
            confirmed: true // Auto-confirm the default subscription
          }
        });
        
        console.log(`Default subscription created with ID ${subscription.id}`);
        
        return {
          organization,
          subscription
        };
      }
      
      return { organization, subscription: null };
    });

    return NextResponse.json({
      ...result.organization,
      defaultSubscription: result.subscription ? {
        email: result.subscription.email,
        confirmed: result.subscription.confirmed,
        id: result.subscription.id
      } : null
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { 
        error: "Failed to create organization", 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 