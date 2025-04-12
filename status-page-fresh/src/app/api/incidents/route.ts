import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
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
    console.error("Error fetching incidents:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await request.json();
    const { title, description, serviceId, severity } = json;

    const incident = await prisma.incident.create({
      data: {
        title,
        description,
        serviceId,
        severity,
        status: "INVESTIGATING",
      },
    });

    return NextResponse.json(incident);
  } catch (error) {
    console.error("Error creating incident:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
