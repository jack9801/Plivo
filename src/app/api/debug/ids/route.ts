import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      select: {
        id: true,
        name: true
      }
    });

    const incidents = await prisma.incident.findMany({
      select: {
        id: true,
        title: true
      }
    });

    return NextResponse.json({
      services,
      incidents
    });
  } catch (error) {
    console.error('Error fetching IDs:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 