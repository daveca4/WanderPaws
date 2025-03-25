import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Update walk tracking data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      walkId, 
      pickupLocation,
      dropoffLocation,
      walkStartLocation,
      walkEndLocation,
      routeCoordinates,
      isTrackingActive,
      action // 'start', 'update', 'end', 'pickup', 'dropoff'
    } = body;
    
    if (!walkId) {
      return NextResponse.json({ error: 'Walk ID is required' }, { status: 400 });
    }
    
    // Find the walk
    const existingWalk = await prisma.walk.findUnique({
      where: { id: walkId }
    });
    
    if (!existingWalk) {
      return NextResponse.json({ error: 'Walk not found' }, { status: 404 });
    }
    
    let updateData: any = {};
    
    // Handle different tracking actions
    switch (action) {
      case 'start':
        updateData = {
          walkStartLocation,
          isTrackingActive: true,
          routeCoordinates: routeCoordinates || []
        };
        break;
        
      case 'update':
        // Merge new coordinates with existing ones
        const existingCoordinates = existingWalk.routeCoordinates || [];
        updateData = {
          routeCoordinates: [...existingCoordinates, ...routeCoordinates]
        };
        break;
        
      case 'end':
        updateData = {
          walkEndLocation,
          isTrackingActive: false,
          // Optionally update route coordinates one last time
          ...(routeCoordinates && { 
            routeCoordinates: [
              ...(existingWalk.routeCoordinates || []), 
              ...routeCoordinates
            ]
          })
        };
        break;
        
      case 'pickup':
        updateData = {
          pickupLocation,
        };
        break;
        
      case 'dropoff':
        updateData = {
          dropoffLocation,
          isTrackingActive: false
        };
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Update the walk with tracking data
    const updatedWalk = await prisma.walk.update({
      where: { id: walkId },
      data: updateData
    });
    
    return NextResponse.json({
      success: true,
      walk: updatedWalk
    });
    
  } catch (error) {
    console.error('Error updating walk tracking:', error);
    return NextResponse.json({ error: 'Failed to update walk tracking' }, { status: 500 });
  }
}

// Get walk tracking data
export async function GET(request: NextRequest) {
  try {
    const walkId = request.nextUrl.searchParams.get('walkId');
    
    if (!walkId) {
      return NextResponse.json({ error: 'Walk ID is required' }, { status: 400 });
    }
    
    const walk = await prisma.walk.findUnique({
      where: { id: walkId },
      select: {
        id: true,
        pickupLocation: true,
        dropoffLocation: true,
        walkStartLocation: true,
        walkEndLocation: true,
        routeCoordinates: true,
        isTrackingActive: true,
        dogId: true,
        dog: {
          select: {
            name: true,
            imageUrl: true,
          }
        }
      }
    });
    
    if (!walk) {
      return NextResponse.json({ error: 'Walk not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      walk
    });
    
  } catch (error) {
    console.error('Error fetching walk tracking:', error);
    return NextResponse.json({ error: 'Failed to fetch walk tracking' }, { status: 500 });
  }
} 