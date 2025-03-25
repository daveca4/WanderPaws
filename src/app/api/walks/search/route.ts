import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Search walks within a specific geographical area
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Get geographical bounds
    const north = searchParams.get('north') ? parseFloat(searchParams.get('north')!) : null;
    const south = searchParams.get('south') ? parseFloat(searchParams.get('south')!) : null;
    const east = searchParams.get('east') ? parseFloat(searchParams.get('east')!) : null;
    const west = searchParams.get('west') ? parseFloat(searchParams.get('west')!) : null;
    
    // Optional filters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const dogId = searchParams.get('dogId');
    const walkerId = searchParams.get('walkerId');
    
    // Check if we have bounds
    const hasBounds = north && south && east && west;
    
    // Build the query
    let query: any = {
      where: {
        // Filter by date range if provided
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        // Filter by dog or walker if provided
        ...(dogId && { dogId }),
        ...(walkerId && { walkerId }),
        // Only include walks with route data
        OR: [
          { pickupLocation: { not: null } },
          { dropoffLocation: { not: null } },
          { walkStartLocation: { not: null } },
          { walkEndLocation: { not: null } },
          { routeCoordinates: { not: null } }
        ]
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
                name: true
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
    };
    
    // Execute the query
    const walks = await prisma.walk.findMany(query);
    
    // If we have geographical bounds, filter the walks that have at least one point in the bounds
    let filteredWalks = walks;
    
    if (hasBounds) {
      filteredWalks = walks.filter((walk: any) => {
        // Check if any of the route points are within the bounds
        const points = [
          walk.pickupLocation,
          walk.dropoffLocation,
          walk.walkStartLocation,
          walk.walkEndLocation
        ].filter(Boolean);
        
        // Add route coordinates if available
        const routeCoords = walk.routeCoordinates || [];
        if (Array.isArray(routeCoords)) {
          points.push(...routeCoords);
        }
        
        // Check if any point is within the bounds
        return points.some(point => {
          if (!point) return false;
          const { lat, lng } = point as any;
          return lat && lng && 
                 lat <= north! && lat >= south! && 
                 lng <= east! && lng >= west!;
        });
      });
    }
    
    return NextResponse.json({
      success: true,
      walks: filteredWalks,
      total: filteredWalks.length
    });
    
  } catch (error) {
    console.error('Error searching walks:', error);
    return NextResponse.json({ error: 'Failed to search walks' }, { status: 500 });
  }
} 