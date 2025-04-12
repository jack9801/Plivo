import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const incidents = await prisma.incident.findMany({
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, serviceId, severity } = await request.json();

    const incident = await prisma.incident.create({
      data: {
        title,
        description,
        serviceId,
        severity,
      },
    });

    return NextResponse.json(incident);
  } catch (error) {
    console.error("Failed to create incident:", error);
    return NextResponse.json(
      { error: "Failed to create incident" },
      { status: 500 }
    );
  }
} 
