import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const incidents = await prisma.incident.findMany({
      where: {
        OR: [
          { status: "INVESTIGATING" },
          { status: "IDENTIFIED" },
          { status: "MONITORING" },
          { status: "RESOLVED" }
        ]
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        service: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error("Failed to fetch incidents:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 