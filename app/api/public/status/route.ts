import { NextResponse } from "next/server";
import { prisma, withDatabase } from "@/lib/db";

// GET /api/public/status - Get the public status page data
export async function GET(request: Request) {
  try {
    // Get the organization slug from the query parameters
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    console.log(`API: Fetching status for slug: ${slug}`);

    if (!slug) {
      console.log("API: Missing slug parameter");
      return NextResponse.json(
        { error: "Organization slug is required" },
        { status: 400 }
      );
    }

    // Use the withDatabase helper for all database operations
    return await withDatabase(async () => {
      // Find the organization by slug
      const organization = await prisma.organization.findUnique({
        where: { slug },
        include: {
          services: {
            orderBy: {
              name: 'asc'
            }
          }
        }
      });

      if (!organization) {
        console.log(`API: Organization with slug ${slug} not found`);
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        );
      }

      console.log(`API: Found organization ${organization.name} with ${organization.services.length} services`);

      // Get active incidents
      const activeIncidents = await prisma.incident.findMany({
        where: {
          organizationId: organization.id,
          status: {
            in: ["INVESTIGATING", "IDENTIFIED", "MONITORING"]
          }
        },
        include: {
          service: true,
          updates: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`API: Found ${activeIncidents.length} active incidents`);

      // Get recent incidents (including resolved ones)
      const recentIncidents = await prisma.incident.findMany({
        where: {
          organizationId: organization.id,
        },
        include: {
          service: true,
          updates: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      console.log(`API: Found ${recentIncidents.length} recent incidents`);

      // Determine overall system status
      let overallStatus = "OPERATIONAL";
      if (activeIncidents.some(incident => incident.severity === "CRITICAL")) {
        overallStatus = "MAJOR_OUTAGE";
      } else if (activeIncidents.some(incident => incident.severity === "HIGH")) {
        overallStatus = "PARTIAL_OUTAGE";
      } else if (activeIncidents.some(incident => incident.severity === "MEDIUM")) {
        overallStatus = "DEGRADED";
      }

      // Create and format the response data
      const responseData = {
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug
        },
        status: overallStatus,
        services: organization.services.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          status: service.status,
        })),
        activeIncidents: activeIncidents.map(incident => ({
          id: incident.id,
          title: incident.title,
          description: incident.description,
          status: incident.status,
          severity: incident.severity,
          createdAt: incident.createdAt.toISOString(),
          service: {
            id: incident.service.id,
            name: incident.service.name,
            status: incident.service.status
          },
          updates: incident.updates.map(update => ({
            id: update.id,
            content: update.content,
            status: update.status,
            createdAt: update.createdAt.toISOString()
          }))
        })),
        recentIncidents: recentIncidents.map(incident => ({
          id: incident.id,
          title: incident.title,
          description: incident.description,
          status: incident.status,
          severity: incident.severity,
          createdAt: incident.createdAt.toISOString(),
          service: {
            id: incident.service.id,
            name: incident.service.name,
            status: incident.service.status
          },
          updates: incident.updates.map(update => ({
            id: update.id,
            content: update.content,
            status: update.status,
            createdAt: update.createdAt.toISOString()
          }))
        }))
      };

      console.log(`API: Returning status data with ${responseData.services.length} services`);
      
      return NextResponse.json(responseData, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }, 
    // Fallback response if database is unavailable during static generation
    NextResponse.json({
      organization: { id: "", name: "Loading...", slug: slug || "" },
      status: "UNKNOWN",
      services: [],
      activeIncidents: [],
      recentIncidents: []
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    }));
  } catch (error) {
    console.error("API Error fetching public status:", error);
    return NextResponse.json(
      { error: "Failed to fetch public status" },
      { status: 500 }
    );
  }
} 
