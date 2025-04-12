import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await request.json();
    const { status, description } = json;

    const incident = await prisma.incident.update({
      where: {
        id: params.id,
      },
      data: {
        status,
        description,
      },
    });

    return NextResponse.json(incident);
  } catch (error) {
    console.error("Error updating incident:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 