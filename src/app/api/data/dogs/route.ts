import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';
import { Role } from '@/lib/types';

// Cache for dog data to improve performance
const dogCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role') as Role;

    if (!userId || !userRole) {
      console.error('Missing user headers:', { userId, userRole });
      return NextResponse.json({ error: 'Unauthorized - Missing user information' }, { status: 401 });
    }

    // Check cache first
    const cacheKey = `${userRole}-${userId}`;
    const cachedData = dogCache.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - CACHE_TTL) {
      console.log('Returning cached dogs for:', cacheKey);
      return NextResponse.json(cachedData.data);
    }

    let dogs;

    switch (userRole) {
      case 'admin':
        // Admins can see all dogs
        dogs = await prisma.dog.findMany({
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true
              }
            }
          }
        });
        break;

      case 'owner':
        // Owners can only see their own dogs
        const owner = await prisma.owner.findUnique({
          where: { userId },
          select: { id: true }
        });

        if (!owner) {
          console.error('Owner profile not found for user:', userId);
          return NextResponse.json({ error: 'Owner profile not found' }, { status: 404 });
        }

        dogs = await prisma.dog.findMany({
          where: {
            ownerId: owner.id
          },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true
              }
            }
          }
        });
        break;

      case 'walker':
        // Walkers can see dogs they've walked or are scheduled to walk
        const walker = await prisma.walker.findUnique({
          where: { userId },
          select: { id: true }
        });

        if (!walker) {
          console.error('Walker profile not found for user:', userId);
          return NextResponse.json({ error: 'Walker profile not found' }, { status: 404 });
        }

        // Get all dogs from walks this walker has done or is scheduled to do
        dogs = await prisma.dog.findMany({
          where: {
            walks: {
              some: {
                walkerId: walker.id
              }
            }
          },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true
              }
            }
          }
        });
        break;

      default:
        console.error('Invalid user role:', userRole);
        return NextResponse.json({ error: 'Unauthorized - Invalid role' }, { status: 401 });
    }

    // Parse any JSON fields in the data
    const parsedDogs = dogs.map(dog => parseJsonFields(dog));

    // Cache the results
    dogCache.set(cacheKey, {
      data: parsedDogs,
      timestamp: Date.now()
    });

    return NextResponse.json(parsedDogs);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Failed to fetch dogs: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role') as Role;

    if (!userId || !userRole) {
      console.error('Missing user headers:', { userId, userRole });
      return NextResponse.json({ error: 'Unauthorized - Missing user information' }, { status: 401 });
    }

    // Only owners and admins can create dogs
    if (userRole !== 'owner' && userRole !== 'admin') {
      console.error('Unauthorized role attempting to create dog:', userRole);
      return NextResponse.json({ error: 'Unauthorized - Only owners and admins can create dogs' }, { status: 403 });
    }

    const data = await request.json();
    
    // Combined validation - more efficient than individual checks
    const validationErrors = [];
    const requiredFields = ['name', 'breed', 'age', 'size'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        validationErrors.push(`${field} is required`);
      }
    }
    
    // Validate size is one of the allowed values
    const validSizes = ['small', 'medium', 'large'];
    if (data.size && !validSizes.includes(data.size)) {
      validationErrors.push('Invalid dog size. Must be one of: small, medium, large');
    }
    
    // Validate arrays
    if (data.temperament && !Array.isArray(data.temperament)) {
      validationErrors.push('Temperament must be an array of strings');
    }
    
    if (data.specialNeeds && !Array.isArray(data.specialNeeds)) {
      validationErrors.push('Special needs must be an array of strings');
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json({ errors: validationErrors }, { status: 400 });
    }

    // If user is an owner, use their owner profile
    // If admin, they must specify an ownerId
    let ownerId = data.ownerId;

    if (userRole === 'owner') {
      const owner = await prisma.owner.findUnique({
        where: { userId },
        select: { id: true, address: true }
      });

      if (!owner) {
        console.error('Owner profile not found for user:', userId);
        return NextResponse.json({ error: 'Owner profile not found' }, { status: 404 });
      }

      ownerId = owner.id;
      
      // If no address provided, use owner's address
      if (!data.address) {
        data.address = owner.address;
      }
    } else if (!ownerId) {
      return NextResponse.json({ error: 'ownerId is required for admin users' }, { status: 400 });
    }
    
    // Check if owner exists
    const ownerExists = await prisma.owner.findUnique({
      where: { id: ownerId },
      select: { id: true, address: true }
    });
    
    if (!ownerExists) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }
    
    // Create dog with validated data
    const newDog = await prisma.dog.create({
      data: {
        name: data.name,
        breed: data.breed,
        age: data.age,
        size: data.size,
        temperament: data.temperament || [],
        specialNeeds: data.specialNeeds || [],
        ownerId: ownerId,
        address: data.address || ownerExists.address,
        assessmentStatus: data.assessmentStatus || 'pending',
        imageUrl: data.imageUrl || null
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true
          }
        }
      }
    });
    
    // Parse any JSON fields in the response
    const parsedDog = parseJsonFields(newDog);
    
    // Clear the cache for this user's dogs
    const cacheKey = `${userRole}-${userId}`;
    dogCache.delete(cacheKey);
    
    return NextResponse.json(parsedDog, { status: 201 });
  } catch (error) {
    console.error('Error creating dog:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      error: `Failed to create dog: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
} 