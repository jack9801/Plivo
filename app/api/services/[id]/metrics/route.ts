// Add dynamic directive at the beginning of the file
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/services/[id]/metrics - Get uptime metrics for a service
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30'); // Default to 30 days
    
    // Ensure days is a reasonable number
    const safeDays = Math.min(Math.max(1, days), 90); // Between 1 and 90 days
    
    // Calculate the start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - safeDays);
    
    // Check if the service exists
    const service = await prisma.service.findUnique({
      where: { id: params.id },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }
    
    // Get metrics for the service within the date range
    const metrics = await prisma.serviceMetric.findMany({
      where: {
        serviceId: params.id,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });
    
    // Get the current date
    const now = new Date();
    
    // Calculate daily uptime percentages
    const dailyData = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= now) {
      const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Find metrics for this day
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayMetrics = metrics.filter(metric => {
        const metricDate = new Date(metric.timestamp);
        return metricDate >= dayStart && metricDate <= dayEnd;
      });
      
      // Calculate uptime percentage
      let uptimePercentage = 100; // Default to 100% if no incidents
      
      if (dayMetrics.length > 0) {
        const totalMinutes = 24 * 60; // Minutes in a day
        let downMinutes = 0;
        
        // Calculate downtime based on non-operational statuses
        for (let i = 0; i < dayMetrics.length; i++) {
          const currentMetric = dayMetrics[i];
          const nextMetric = dayMetrics[i + 1] || null;
          
          if (currentMetric.status !== "OPERATIONAL") {
            // Calculate duration until next metric or end of day
            const startTime = new Date(currentMetric.timestamp);
            const endTime = nextMetric 
              ? new Date(nextMetric.timestamp) 
              : dayEnd;
            
            // Calculate minutes between these times
            const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            
            // For partial outage, count as 50% down
            if (currentMetric.status === "PARTIAL_OUTAGE") {
              downMinutes += durationMinutes * 0.5;
            }
            // For degraded, count as 25% down
            else if (currentMetric.status === "DEGRADED") {
              downMinutes += durationMinutes * 0.25;
            }
            // For major outage, count as 100% down
            else if (currentMetric.status === "MAJOR_OUTAGE") {
              downMinutes += durationMinutes;
            }
          }
        }
        
        // Calculate uptime percentage
        uptimePercentage = Math.max(0, 100 - (downMinutes / totalMinutes * 100));
      }
      
      dailyData.push({
        date: dateString,
        uptime: parseFloat(uptimePercentage.toFixed(2))
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate overall uptime
    const totalUptime = dailyData.reduce((sum, day) => sum + day.uptime, 0);
    const overallUptime = totalUptime / dailyData.length;
    
    return NextResponse.json({
      service: {
        id: service.id,
        name: service.name,
        status: service.status
      },
      period: {
        days: safeDays,
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      metrics: {
        overallUptime: parseFloat(overallUptime.toFixed(2)),
        daily: dailyData
      }
    });
  } catch (error) {
    console.error("Error fetching service metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch service metrics" },
      { status: 500 }
    );
  }
} 