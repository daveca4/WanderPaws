import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    await verifyAdminRequest(request);

    const dogs = await prisma.dog.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(dogs);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dogs' },
      { status: 500 }
    );
  }
} 