import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Demo organizations for fallback
const DEMO_ORGANIZATIONS = [
  {
    id: 'demo-admin-org',
    name: 'Admin Demo Organization',
    slug: 'admin-demo-org',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'demo-user-org',
    name: 'User Demo Organization',
    slug: 'user-demo-org',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// GET /api/organizations - Get all organizations
export async function GET() {
  try {
    // Try to get real organizations from database
    const organizations = await prisma.organization.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // If we have organizations, return them
    if (organizations.length > 0) {
      return NextResponse.json(organizations);
    }
    
    // If no organizations found, return demo organizations
    console.log("No organizations found, returning demo organizations");
    return NextResponse.json(DEMO_ORGANIZATIONS);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    
    // On database error, return demo organizations
    console.log("Database error, returning demo organizations");
    return NextResponse.json(DEMO_ORGANIZATIONS);
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
    
    // On error, check if we should return a demo organization
    if (process.env.DEMO_MODE === 'true') {
      // Generate a unique ID for the demo org
      const timestamp = new Date().getTime();
      const demoOrg = {
        id: `demo-org-${timestamp}`,
        name: "New Demo Organization",
        slug: `demo-org-${timestamp}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json({
        ...demoOrg,
        defaultSubscription: null,
        demoMode: true
      }, { status: 201 });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create organization", 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
