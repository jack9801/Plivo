import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not available in production" }, { status: 403 });
    }

    const body = await request.json();
    const { serviceId, days = 30 } = body;

    if (!serviceId) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Generate test data for the past X days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Delete existing metrics for this service
    await prisma.serviceMetric.deleteMany({
      where: { serviceId }
    });

    console.log(`Generating ${days} days of test metrics for service ${service.name}`);

    // Generate 1-3 status changes per day with mostly operational status
    const metrics = [];
    let currentDate = new Date(startDate);
    const now = new Date();

    while (currentDate <= now) {
      // Number of status changes for this day (1-3)
      const changesPerDay = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < changesPerDay; i++) {
        // Random hour between 0-23
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        
        const timestamp = new Date(currentDate);
        timestamp.setHours(hour, minute, 0, 0);
        
        // 80% chance of OPERATIONAL, 10% DEGRADED, 7% PARTIAL_OUTAGE, 3% MAJOR_OUTAGE
        const rand = Math.random();
        let status = "OPERATIONAL";
        
        if (rand > 0.97) {
          status = "MAJOR_OUTAGE";
        } else if (rand > 0.9) {
          status = "PARTIAL_OUTAGE";
        } else if (rand > 0.8) {
          status = "DEGRADED";
        }
        
        // Don't add metrics in the future
        if (timestamp <= now) {
          metrics.push({
            serviceId,
            status,
            timestamp
          });
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Always end with current status
    metrics.push({
      serviceId,
      status: service.status,
      timestamp: now
    });
    
    // Sort by timestamp
    metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Create metrics in database
    const result = await prisma.serviceMetric.createMany({
      data: metrics
    });
    
    return NextResponse.json({
      success: true,
      message: `Generated ${result.count} metrics for service ${service.name}`,
      service: {
        id: service.id,
        name: service.name
      }
    });
  } catch (error) {
    console.error("Error generating test metrics:", error);
    return NextResponse.json(
      { error: "Failed to generate test metrics" },
      { status: 500 }
    );
  }
} 
