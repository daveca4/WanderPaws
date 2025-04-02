import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';
import { Role } from '@/lib/types';

// Cache for owner data to improve performance
const ownerCache = new Map<string, any>();
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
    const cachedData = ownerCache.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - CACHE_TTL) {
      console.log('Returning cached owners for:', cacheKey);
      return NextResponse.json(cachedData.data);
    }

    let owners;

    switch (userRole) {
      case 'admin':
        // Admins can see all owners
        owners = await prisma.owner.findMany({
          include: {
            dogs: {
              select: {
                id: true,
                name: true,
                breed: true,
                age: true,
                size: true,
                temperament: true,
                specialNeeds: true,
                imageUrl: true,
                assessmentStatus: true,
                address: true
              }
            }
          }
        });
        break;

      case 'owner':
        // Owners can only see their own profile
        owners = await prisma.owner.findMany({
          where: {
            userId
          },
          include: {
            dogs: {
              select: {
                id: true,
                name: true,
                breed: true,
                age: true,
                size: true,
                temperament: true,
                specialNeeds: true,
                imageUrl: true,
                assessmentStatus: true,
                address: true
              }
            }
          }
        });
        break;

      case 'walker':
        // Walkers can see owners of dogs they walk
        const walker = await prisma.walker.findUnique({
          where: { userId },
          select: { id: true }
        });

        if (!walker) {
          console.error('Walker profile not found for user:', userId);
          return NextResponse.json({ error: 'Walker profile not found' }, { status: 404 });
        }

        owners = await prisma.owner.findMany({
          where: {
            dogs: {
              some: {
                walks: {
                  some: {
                    walkerId: walker.id
                  }
                }
              }
            }
          },
          include: {
            dogs: {
              select: {
                id: true,
                name: true,
                breed: true,
                age: true,
                size: true,
                temperament: true,
                specialNeeds: true,
                imageUrl: true,
                assessmentStatus: true,
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
    const parsedOwners = owners.map(owner => parseJsonFields(owner));

    // Cache the results
    ownerCache.set(cacheKey, {
      data: parsedOwners,
      timestamp: Date.now()
    });

    return NextResponse.json(parsedOwners);
  } catch (error) {
    console.error('Error fetching owners:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Failed to fetch owners: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
} 