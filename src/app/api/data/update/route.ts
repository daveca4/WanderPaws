import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';
import { Role } from '@/lib/types';

/**
 * Generic data update endpoint that can handle updates to different entity types
 * based on the type parameter in the request body
 */
export async function POST(request: NextRequest) {
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

    const data = await request.json();
    const { type, data: entityData } = data;

    if (!type || !entityData) {
      return NextResponse.json(
        { error: 'Missing required fields: type and data' },
        { status: 400 }
      );
    }

    console.log(`Processing update for ${type}:`, entityData);

    // Handle different entity types
    switch (type) {
      case 'owner': {
        return await handleOwnerUpdate(entityData, userId, userRole, userProfileId);
      }
      // Add cases for other entity types as needed
      default:
        return NextResponse.json(
          { error: `Unsupported entity type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing update:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      error: `Failed to update entity: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
}

/**
 * Handle updates to owner profiles
 */
async function handleOwnerUpdate(
  data: any,
  userId: string,
  userRole: Role,
  userProfileId: string | null
) {
  try {
    // Verify the owner exists and the user has permission to update it
    const ownerToUpdate = await prisma.owner.findUnique({
      where: { id: data.id },
      select: { 
        id: true, 
        userId: true 
      }
    });

    if (!ownerToUpdate) {
      console.error(`Owner not found with ID: ${data.id}`);
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    // Check permissions
    let isAuthorized = false;
    
    if (userRole === 'admin') {
      // Admin is always authorized
      isAuthorized = true;
      console.log('Authorization passed: User is admin');
    } else if (userRole === 'owner') {
      // Owner is authorized if they own the profile
      if (ownerToUpdate.userId === userId) {
        isAuthorized = true;
        console.log(`Authorization passed: Owner user ID ${ownerToUpdate.userId} matches requesting user ID ${userId}`);
      } else {
        console.error(`Authorization failed: User ${userId} is not owner of profile ${data.id} (owned by ${ownerToUpdate.userId})`);
      }
    }
    
    if (!isAuthorized) {
      return NextResponse.json({
        error: 'Unauthorized - You can only update your own owner profile',
        details: {
          userRole,
          userId,
          profileId: data.id
        }
      }, { status: 403 });
    }

    // Remove id from update data to prevent changing the primary key
    const { id, ...updateData } = data;
    
    // Update the owner
    const updatedOwner = await prisma.owner.update({
      where: { id },
      data: updateData,
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
    
    console.log(`Successfully updated owner: ${updatedOwner.name}`);
    
    // Parse any JSON fields (like address) in the response
    const parsedOwner = parseJsonFields(updatedOwner);
    
    return NextResponse.json(parsedOwner);
  } catch (error) {
    console.error(`Error updating owner:`, error);
    return NextResponse.json({ 
      error: `Failed to update owner: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
} 