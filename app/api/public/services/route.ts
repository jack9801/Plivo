import { NextResponse } from "next/server";
import { prisma, withDatabase } from "@/lib/db";

export async function GET() {
  try {
    const services = await withDatabase(
      async () => {
        return await prisma.service.findMany({
          orderBy: {
            createdAt: 'desc'
          }
        });
      },
      [] // Fallback to empty array if database is unavailable
    );
    
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
} 