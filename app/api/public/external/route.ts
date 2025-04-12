import { NextResponse } from "next/server";
import { prisma, withDatabase } from "@/lib/db";

// GET /api/public/external - Get minimal status data for external integrations
export async function GET(request: Request) {
  try {
    // Get the organization slug from the query parameters (optional)
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    return await withDatabase(async () => {
      // If slug is provided, return data for just that organization
      if (slug) {
        const organization = await prisma.organization.findUnique({
          where: { slug },
          include: {
            services: {
              select: {
                id: true,
                name: true,
                status: true,
                updatedAt: true
              },
              orderBy: {
                name: 'asc'
              }
            }
          }
        });

        if (!organization) {
          return NextResponse.json(
            { error: "Organization not found" },
            { status: 404 }
          );
        }

        // Determine overall status
        const statuses = organization.services.map(service => service.status);
        const overallStatus = getOverallStatus(statuses);

        return NextResponse.json({
          name: organization.name,
          slug: organization.slug,
          status: overallStatus,
          lastUpdated: new Date().toISOString(),
          services: organization.services.map(service => ({
            name: service.name,
            status: service.status,
            lastUpdated: service.updatedAt.toISOString()
          }))
        }, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, max-age=0',
          },
        });
      }
      
      // If no slug, return minimal data for all organizations
      const organizations = await prisma.organization.findMany({
        include: {
          services: {
            select: {
              status: true
            }
          }
        }
      });

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        organizations: organizations.map(org => {
          const statuses = org.services.map(service => service.status);
          return {
            name: org.name,
            slug: org.slug,
            status: getOverallStatus(statuses),
            serviceCount: org.services.length
          };
        })
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }, 
    // Fallback response if database is unavailable during static generation
    NextResponse.json({
      timestamp: new Date().toISOString(),
      organizations: [],
      message: "Data temporarily unavailable. Please try again later."
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0',
      },
    }));
  } catch (error) {
    console.error("API Error fetching external status:", error);
    return NextResponse.json(
      { error: "Failed to fetch status information" },
      { status: 500 }
    );
  }
}

// Helper function to determine overall status based on service statuses
function getOverallStatus(statuses: string[]): string {
  if (statuses.includes("MAJOR_OUTAGE")) return "MAJOR_OUTAGE";
  if (statuses.includes("PARTIAL_OUTAGE")) return "PARTIAL_OUTAGE";
  if (statuses.includes("DEGRADED")) return "DEGRADED";
  return "OPERATIONAL";
} 
