import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';
import { Role } from '@/lib/types';

// Cache for walks data to improve performance
const walksCache = new Map<string, any>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role') as Role;
    const userProfileId = request.headers.get('user-profile-id');

    if (!userId || !userRole) {
      console.error('Missing user headers:', { userId, userRole });
      return NextResponse.json({ error: 'Unauthorized - Missing user information' }, { status: 401 });
    }

    // Check cache first
    const cacheKey = `${userRole}-${userId}`;
    const cachedData = walksCache.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - CACHE_TTL) {
      console.log('Returning cached walks for:', cacheKey);
      return NextResponse.json(cachedData.data);
    }

    let walks;

    switch (userRole) {
      case 'admin':
        // Admins can see all walks
        walks = await prisma.walk.findMany({
          include: {
            dog: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            },
            walker: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        });
        break;

      case 'owner':
        // Owners can only see walks for their dogs
        if (!userProfileId) {
          console.error('Owner profile ID missing for user:', userId);
          return NextResponse.json({ error: 'Owner profile not found' }, { status: 404 });
        }

        walks = await prisma.walk.findMany({
          where: {
            dog: {
              ownerId: userProfileId
            }
          },
          include: {
            dog: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            },
            walker: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        });
        break;

      case 'walker':
        // Walkers can see walks they're assigned to
        if (!userProfileId) {
          console.error('Walker profile ID missing for user:', userId);
          return NextResponse.json({ error: 'Walker profile not found' }, { status: 404 });
        }

        walks = await prisma.walk.findMany({
          where: {
            walkerId: userProfileId
          },
          include: {
            dog: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        });
        break;

      default:
        console.error('Invalid user role:', userRole);
        return NextResponse.json({ error: 'Unauthorized - Invalid role' }, { status: 401 });
    }

    // Parse any JSON fields in the data
    const parsedWalks = walks.map(walk => parseJsonFields(walk));

    // Cache the results
    walksCache.set(cacheKey, {
      data: parsedWalks,
      timestamp: Date.now()
    });

    return NextResponse.json(parsedWalks);
  } catch (error) {
    console.error('Error fetching walks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Failed to fetch walks: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role') as Role;
    const userProfileId = request.headers.get('user-profile-id');

    if (!userId || !userRole) {
      console.error('Missing user headers:', { userId, userRole });
      return NextResponse.json({ error: 'Unauthorized - Missing user information' }, { status: 401 });
    }

    // Only owners, walkers and admins can create walks
    if (!['owner', 'walker', 'admin'].includes(userRole)) {
      console.error('Unauthorized role:', userRole);
      return NextResponse.json({ error: 'Unauthorized - Invalid role' }, { status: 403 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.dogId || !data.date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If user is owner, check ownership of the dog
    if (userRole === 'owner') {
      const dog = await prisma.dog.findUnique({
        where: { id: data.dogId },
        select: { ownerId: true }
      });

      if (!dog) {
        return NextResponse.json({ error: 'Dog not found' }, { status: 404 });
      }

      if (dog.ownerId !== userProfileId) {
        return NextResponse.json({ error: 'You can only book walks for your own dogs' }, { status: 403 });
      }
    }

    // Create the walk using prisma
    const newWalk = await prisma.walk.create({
      data: {
        dogId: data.dogId,
        date: new Date(data.date),
        startTime: data.startTime || '09:00:00',
        duration: data.duration || 60,
        status: data.status || 'scheduled',
        notes: data.notes || '',
        walkerId: data.walkerId,
        timeSlot: data.timeSlot || 'morning',
      }
    });
    
    // Parse any JSON fields in the response
    const parsedWalk = parseJsonFields(newWalk);
    
    // Invalidate cache
    walksCache.clear();
    
    return NextResponse.json(parsedWalk, { status: 201 });
  } catch (error) {
    console.error('Error creating walk:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Failed to create walk: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
} 