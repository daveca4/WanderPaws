import { NextRequest, NextResponse } from 'next/server';
import * as dbOps from '@/lib/dbOperations';
import { parseJsonFields } from '@/lib/dbOperations';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const walkers = await prisma.walker.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          }
        },
        walks: {
          where: {
            status: 'COMPLETED'
          }
        }
      }
    });

    // Process walkers data to match the expected format in the UI
    const formattedWalkers = walkers.map(walker => {
      // Calculate walker's rating (mock data for now, would be from reviews)
      const rating = walker.walks.length > 0 
        ? 3.5 + Math.random() * 1.5 // Generate rating between 3.5 and 5
        : 4.0; // Default rating for new walkers
      
      // Parse the availability from JSON
      const walkerAvailability = typeof walker.availability === 'object' 
        ? walker.availability 
        : JSON.parse(walker.availability as string);
      
      return {
        id: walker.id,
        name: walker.user?.name || walker.name || '',
        email: walker.user?.email || walker.email || '',
        phone: walker.phone || '',
        imageUrl: walker.imageUrl || walker.user?.image || '',
        bio: walker.bio || "Dedicated dog walker with a passion for all types of dogs.",
        rating: parseFloat(rating.toFixed(1)),
        specialties: walker.specialties || ["Dog Walking", "Basic Training"],
        certificationsOrTraining: walker.certificationsOrTraining || ["Pet First Aid", "Canine Behavior"],
        preferredDogSizes: walker.preferredDogSizes || ["small", "medium", "large"],
        availability: walkerAvailability,
        experienceYears: 2,
        location: "Local Area",
        completedWalks: walker.walks.length
      };
    });

    return NextResponse.json(formattedWalkers);
  } catch (error) {
    console.error('Error fetching walkers:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch walkers' }),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const newWalker = await dbOps.createWalker(data);
    
    // Parse any JSON fields in the response
    const parsedWalker = parseJsonFields(newWalker);
    
    return NextResponse.json(parsedWalker, { status: 201 });
  } catch (error) {
    console.error('Error creating walker:', error);
    return NextResponse.json({ error: 'Failed to create walker' }, { status: 500 });
  }
} 