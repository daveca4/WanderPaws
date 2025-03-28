import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Walker ID is required' }),
        { status: 400 }
      );
    }

    const walker = await prisma.walker.findUnique({
      where: { id: params.id },
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

    if (!walker) {
      return new NextResponse(
        JSON.stringify({ error: 'Walker not found' }),
        { status: 404 }
      );
    }
    
    // Calculate walker's rating (mock data for now, would be from reviews)
    const rating = walker.walks && walker.walks.length > 0 
      ? 3.5 + Math.random() * 1.5 // Generate rating between 3.5 and 5
      : 4.0; // Default rating for new walkers

    // Create a default availability structure
    const defaultAvailability = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };
    
    // Parse the availability from JSON if needed
    let walkerAvailability;
    try {
      walkerAvailability = typeof walker.availability === 'object' 
        ? walker.availability 
        : JSON.parse(String(walker.availability || '{}'));
    } catch (e) {
      console.error('Error parsing availability:', e);
      walkerAvailability = defaultAvailability;
    }

    const formattedWalker = {
      id: walker.id,
      name: walker.user?.name || walker.name,
      email: walker.user?.email || walker.email,
      phone: walker.phone || '',
      imageUrl: walker.imageUrl || walker.user?.image || '',
      bio: walker.bio || "Dedicated dog walker with a passion for all types of dogs.",
      rating: parseFloat(rating.toFixed(1)),
      specialties: walker.specialties || ["Dog Walking", "Basic Training"],
      certificationsOrTraining: walker.certificationsOrTraining || ["Pet First Aid", "Canine Behavior"],
      preferredDogSizes: walker.preferredDogSizes || ["small", "medium", "large"],
      availability: walkerAvailability || defaultAvailability,
      experienceYears: 2, // Default value
      location: "Local Area", // Default value
      completedWalks: walker.walks ? walker.walks.length : 0
    };

    return NextResponse.json(formattedWalker);
  } catch (error) {
    console.error('Error fetching walker:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch walker details', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
} 