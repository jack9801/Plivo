import { prisma } from "@/lib/prisma"
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { content } = await request.json()
    
    const status = await prisma.statusUpdate.create({
      data: {
        content,
      },
    })
    
    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create status update' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const statuses = await prisma.statusUpdate.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json(statuses)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch status updates' },
      { status: 500 }
    )
  }
} 