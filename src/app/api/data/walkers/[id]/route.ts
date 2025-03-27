import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
            phone: true,
            imageUrl: true,
          }
        },
        walks: {
          where: {
            status: 'COMPLETED'
          }
        },
        timeSlots: true
      }
    });

    if (!walker) {
      return new NextResponse(
        JSON.stringify({ error: 'Walker not found' }),
        { status: 404 }
      );
    }

    // Map timeSlots to availability format
    const availability: Record<string, Array<{start: string, end: string}>> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };
    
    walker.timeSlots.forEach(slot => {
      const day = slot.day.toLowerCase();
      if (day in availability) {
        availability[day].push({
          start: slot.startTime,
          end: slot.endTime
        });
      }
    });
    
    // Calculate walker's rating (mock data for now, would be from reviews)
    const rating = walker.walks.length > 0 
      ? 3.5 + Math.random() * 1.5 // Generate rating between 3.5 and 5
      : 4.0; // Default rating for new walkers

    const formattedWalker = {
      id: walker.id,
      name: walker.user.name,
      email: walker.user.email,
      phone: walker.user.phone,
      imageUrl: walker.user.imageUrl,
      bio: walker.bio || "Dedicated dog walker with a passion for all types of dogs.",
      rating: parseFloat(rating.toFixed(1)),
      specialties: walker.specialties || ["Dog Walking", "Basic Training"],
      certificationsOrTraining: walker.certifications || ["Pet First Aid", "Canine Behavior"],
      preferredDogSizes: walker.preferredDogSizes || ["small", "medium", "large"],
      availability,
      experienceYears: walker.experienceYears || 2,
      location: walker.location || "Local Area",
      completedWalks: walker.walks.length
    };

    return NextResponse.json(formattedWalker);
  } catch (error) {
    console.error('Error fetching walker:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch walker details' }),
      { status: 500 }
    );
  }
} 