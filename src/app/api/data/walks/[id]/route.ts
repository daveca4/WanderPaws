import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';
import { Role } from '@/lib/types';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  
  try {
    // Get authentication headers
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role') as Role;
    const userProfileId = request.headers.get('user-profile-id');

    // Validate user authentication
    if (!userId || !userRole) {
      console.error('Missing authentication headers:', { userId, userRole });
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the walk with relevant relationships
    const walk = await prisma.walk.findUnique({
      where: { id },
      include: {
        dog: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            imageUrl: true
          }
        },
        walker: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!walk) {
      return NextResponse.json({ error: 'Walk not found' }, { status: 404 });
    }
    
    // Verify user has permission to see this walk
    if (userRole === 'owner') {
      // Owners can only see walks for their dogs
      if (walk.dog.ownerId !== userProfileId) {
        return NextResponse.json({ error: 'Not authorized to access this walk' }, { status: 403 });
      }
    } else if (userRole === 'walker') {
      // Walkers can only see walks assigned to them
      if (walk.walkerId !== userProfileId) {
        return NextResponse.json({ error: 'Not authorized to access this walk' }, { status: 403 });
      }
    }
    // Admins can see all walks
    
    // Parse any JSON fields in the data
    const parsedWalk = parseJsonFields(walk);
    
    return NextResponse.json(parsedWalk);
  } catch (error) {
    console.error(`Error fetching walk with ID ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Failed to fetch walk: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  
  try {
    // Get authentication headers
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role') as Role;
    const userProfileId = request.headers.get('user-profile-id');

    // Validate user authentication
    if (!userId || !userRole) {
      console.error('Missing authentication headers:', { userId, userRole });
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the existing walk to check permissions
    const existingWalk = await prisma.walk.findUnique({
      where: { id },
      include: {
        dog: {
          select: {
            ownerId: true
          }
        }
      }
    });
    
    if (!existingWalk) {
      return NextResponse.json({ error: 'Walk not found' }, { status: 404 });
    }
    
    // Verify user has permission to update this walk
    if (userRole === 'owner') {
      // Owners can only update walks for their dogs
      if (existingWalk.dog.ownerId !== userProfileId) {
        return NextResponse.json({ error: 'Not authorized to update this walk' }, { status: 403 });
      }
    } else if (userRole === 'walker') {
      // Walkers can only update walks assigned to them
      if (existingWalk.walkerId !== userProfileId) {
        return NextResponse.json({ error: 'Not authorized to update this walk' }, { status: 403 });
      }
    }
    // Admins can update all walks
    
    const data = await request.json();
    
    // Update the walk
    const updatedWalk = await prisma.walk.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
        startTime: data.startTime,
        duration: data.duration,
        timeSlot: data.timeSlot,
        // Don't allow changing dogId or walkerId through PATCH
      },
      include: {
        dog: true,
        walker: true
      }
    });
    
    // Parse any JSON fields in the response
    const parsedWalk = parseJsonFields(updatedWalk);
    
    return NextResponse.json(parsedWalk);
  } catch (error) {
    console.error(`Error updating walk with ID ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Failed to update walk: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  
  try {
    // Get authentication headers
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role') as Role;
    const userProfileId = request.headers.get('user-profile-id');

    // Validate user authentication
    if (!userId || !userRole) {
      console.error('Missing authentication headers:', { userId, userRole });
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the existing walk to check permissions
    const existingWalk = await prisma.walk.findUnique({
      where: { id },
      include: {
        dog: {
          select: {
            ownerId: true
          }
        }
      }
    });
    
    if (!existingWalk) {
      return NextResponse.json({ error: 'Walk not found' }, { status: 404 });
    }
    
    // Verify user has permission to delete this walk
    if (userRole === 'owner') {
      // Owners can only delete walks for their dogs
      if (existingWalk.dog.ownerId !== userProfileId) {
        return NextResponse.json({ error: 'Not authorized to delete this walk' }, { status: 403 });
      }
    } else if (userRole === 'walker') {
      // Walkers cannot delete walks
      return NextResponse.json({ error: 'Walkers cannot delete walks' }, { status: 403 });
    }
    // Admins can delete all walks
    
    // Delete the walk
    await prisma.walk.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Walk deleted successfully' });
  } catch (error) {
    console.error(`Error deleting walk with ID ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Failed to delete walk: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
} 