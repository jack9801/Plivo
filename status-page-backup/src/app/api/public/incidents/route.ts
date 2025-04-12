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
          {
            AND: [
              { status: "RESOLVED" },
              {
                resolvedAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
              },
            ],
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error("Failed to fetch incidents:", error);
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 }
    );
  }
} 