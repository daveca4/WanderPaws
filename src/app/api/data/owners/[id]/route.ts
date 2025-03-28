import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`API: Fetching owner with ID: ${id}`);

    const owner = await prisma.owner.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          }
        }
      }
    });

    if (!owner) {
      console.log(`API: Owner with ID ${id} not found`);
      return NextResponse.json(
        { error: 'Owner not found' },
        { status: 404 }
      );
    }

    console.log(`API: Successfully found owner: ${owner.name}`);

    // Format dates
    const ownerWithFormattedData = {
      ...owner,
      createdAt: owner.createdAt.toISOString(),
      updatedAt: owner.updatedAt.toISOString(),
    };

    return NextResponse.json(ownerWithFormattedData);
  } catch (error) {
    console.error('Error fetching owner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owner details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 