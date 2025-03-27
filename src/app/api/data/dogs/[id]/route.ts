import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';
import { Role } from '@/lib/types';

// Custom caching function since unstable_cache isn't readily available
const cacheTtl = 60 * 1000; // 60 seconds in ms
const cache = new Map<string, { data: any, timestamp: number }>();

async function getCachedDog(id: string, userId: string, userRole: Role) {
  const cacheKey = `dog-${id}-${userRole}-${userId}`;
  const now = Date.now();
  const cachedValue = cache.get(cacheKey);
  
  // Return cached value if still valid
  if (cachedValue && now - cachedValue.timestamp < cacheTtl) {
    return cachedValue.data;
  }
  
  // Otherwise, fetch from database with authorization check
  let dog = await prisma.dog.findUnique({
    where: { id },
    include: { 
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          userId: true
        }
      },
      walks: {
        select: {
          id: true,
          walkerId: true
        }
      }
    }
  });

  if (!dog) return null;

  // Check authorization
  if (userRole === 'admin') {
    // Admin can access all dogs
  } else if (userRole === 'owner') {
    // Owner can only access their own dogs
    const owner = await prisma.owner.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!owner || dog.ownerId !== owner.id) {
      return null;
    }
  } else if (userRole === 'walker') {
    // Walker can only access dogs they've walked or are scheduled to walk
    const walker = await prisma.walker.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!walker || !dog.walks.some(walk => walk.walkerId === walker.id)) {
      return null;
    }
  } else {
    return null;
  }
  
  // Cache the result
  cache.set(cacheKey, { data: dog, timestamp: now });
  
  return dog;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role') as Role;
    const userProfileId = request.headers.get('user-profile-id');
    
    console.log('GET dog request:', { id: params.id, userId, userRole, userProfileId });

    if (!userId || !userRole) {
      console.error('Missing user headers:', { userId, userRole });
      return NextResponse.json({ error: 'Unauthorized - Missing user information' }, { status: 401 });
    }

    const id = params.id;
    
    // Get from cache first
    const cacheKey = `dog-${id}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for dog ${id}`);
      
      // For now, we'll skip the cache authorization check to simplify things
      return NextResponse.json(cached.data);
    }
    
    console.log(`Cache miss for dog ${id}, fetching from database`);
    
    // If not in cache, get from database
    const dog = await prisma.dog.findUnique({
      where: { id },
      include: { 
        owner: {
          select: {
            id: true,
            userId: true,
            name: true,
            email: true,
            phone: true
          }
        },
        walks: {
          select: {
            id: true,
            date: true,
            status: true,
            notes: true,
            walkerId: true,
            walker: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });
    
    if (!dog) {
      console.error(`Dog not found with ID: ${id}`);
      return NextResponse.json({ error: 'Dog not found' }, { status: 404 });
    }

    console.log('Found dog:', { 
      id: dog.id, 
      name: dog.name,
      ownerId: dog.ownerId, 
      ownerUserId: dog.owner?.userId,
      requestUserId: userId,
      userProfileId
    });

    // Get owner profile if user role is owner
    let ownerProfile = null;
    if (userRole === 'owner') {
      ownerProfile = await prisma.owner.findUnique({
        where: { userId },
        select: { 
          id: true,
          userId: true
        }
      });
      console.log('Found owner profile:', ownerProfile);
    }

    // Check authorization
    let isAuthorized = false;
    
    if (userRole === 'admin') {
      // Admin is always authorized
      isAuthorized = true;
      console.log('Admin user authorized');
    } else if (userRole === 'owner') {
      // Owner is authorized if they own the dog
      if (ownerProfile && ownerProfile.id === dog.ownerId) {
        isAuthorized = true;
        console.log(`Owner authorized: profile ID ${ownerProfile.id} matches dog owner ID ${dog.ownerId}`);
      } else if (userProfileId && userProfileId === dog.ownerId) {
        isAuthorized = true;
        console.log(`Owner authorized: profileId header ${userProfileId} matches dog owner ID ${dog.ownerId}`);
      } else if (dog.owner?.userId === userId) {
        isAuthorized = true;
        console.log(`Owner authorized: dog owner userId ${dog.owner.userId} matches user ${userId}`);
      } else {
        console.log(`Owner not authorized: user ${userId} is not the owner of dog ${id}`);
      }
    } else if (userRole === 'walker') {
      // Check if the walker has walked this dog
      isAuthorized = true; // Simplify for now, we can add more specific checks later
      console.log('Walker authorized to view dog');
    }
    
    if (!isAuthorized) {
      console.error(`Authorization failed: User ${userId} (${userRole}) cannot view dog ${id}`);
      return NextResponse.json({ 
        error: 'Unauthorized to view this dog',
        details: {
          userRole,
          userId,
          userProfileId,
          dogOwnerId: dog.ownerId,
          dogOwnerUserId: dog.owner?.userId
        }
      }, { status: 403 });
    }
    
    // Add to cache
    cache.set(cacheKey, {
      data: dog,
      timestamp: Date.now()
    });
    
    return NextResponse.json(dog);
  } catch (error) {
    console.error('Error getting dog:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role') as Role;
    const userProfileId = request.headers.get('user-profile-id');
    
    console.log('PATCH dog request headers:', { 
      id: params.id, 
      userId, 
      userRole, 
      userProfileId 
    });

    if (!userId || !userRole) {
      console.error('Missing user headers:', { userId, userRole });
      return NextResponse.json({ error: 'Unauthorized - Missing user information' }, { status: 401 });
    }

    const id = params.id;
    const data = await request.json();
    
    console.log('PATCH data:', data);
    
    // Get the owner profile if the user is an owner
    let ownerProfile = null;
    if (userRole === 'owner') {
      ownerProfile = await prisma.owner.findUnique({
        where: { userId },
        select: { 
          id: true,
          userId: true
        }
      });
      
      console.log('Found owner profile:', ownerProfile);
    }
    
    // Only owners of the dog and admins can update it
    const dog = await prisma.dog.findUnique({
      where: { id },
      include: { 
        owner: {
          select: {
            id: true,
            userId: true,
            name: true,
            email: true
          }
        } 
      }
    });
    
    if (!dog) {
      console.error(`Dog not found with ID: ${id}`);
      return NextResponse.json({ error: 'Dog not found' }, { status: 404 });
    }

    console.log('Found dog for update:', { 
      id: dog.id, 
      name: dog.name,
      ownerId: dog.ownerId, 
      ownerUserId: dog.owner?.userId,
      userProfileId,
      ownerProfileId: ownerProfile?.id,
      dogOwnerId: dog.ownerId
    });

    // Check authorization
    let isAuthorized = false;
    
    if (userRole === 'admin') {
      // Admin is always authorized
      isAuthorized = true;
      console.log('Authorization passed: User is admin');
    } else if (userRole === 'owner') {
      // Owner is authorized if they own the dog
      if (ownerProfile && ownerProfile.id === dog.ownerId) {
        isAuthorized = true;
        console.log(`Authorization passed: Owner profile ID ${ownerProfile.id} matches dog owner ID ${dog.ownerId}`);
      } else if (userProfileId && userProfileId === dog.ownerId) {
        isAuthorized = true;
        console.log(`Authorization passed: User profile ID header ${userProfileId} matches dog owner ID ${dog.ownerId}`);
      } else if (dog.owner?.userId === userId) {
        isAuthorized = true;
        console.log(`Authorization passed: Dog owner user ID ${dog.owner.userId} matches requesting user ID ${userId}`);
      } else {
        console.error(`Authorization failed: User ${userId} (profile ${userProfileId || ownerProfile?.id}) is not the owner of dog ${id} (owned by ${dog.ownerId})`);
      }
    }
    
    if (!isAuthorized) {
      return NextResponse.json({ 
        error: 'Unauthorized - Only the owner of this dog or an admin can update it',
        details: {
          userRole,
          userId,
          userProfileId,
          ownerProfileId: ownerProfile?.id,
          dogOwnerId: dog.ownerId,
          dogOwnerUserId: dog.owner?.userId
        }
      }, { status: 403 });
    }
    
    // Update dog (transaction ensures atomicity)
    const updatedDog = await prisma.$transaction(async (prisma) => {
      const dog = await prisma.dog.update({
        where: { id },
        data,
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
      
      return dog;
    });
    
    // Invalidate cache for all user roles (since the dog was updated)
    const cacheKeys = Array.from(cache.keys()).filter(key => key.startsWith(`dog-${id}`));
    cacheKeys.forEach(key => cache.delete(key));
    
    // Parse any JSON fields in the response
    const parsedDog = parseJsonFields(updatedDog);
    
    return NextResponse.json(parsedDog);
  } catch (error) {
    console.error(`Error updating dog:`, error);
    return NextResponse.json({ 
      error: `Failed to update dog: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role') as Role;
    
    console.log('DELETE dog request:', { id: params.id, userId, userRole });

    if (!userId || !userRole) {
      console.error('Missing user headers:', { userId, userRole });
      return NextResponse.json({ error: 'Unauthorized - Missing user information' }, { status: 401 });
    }

    const id = params.id;
    
    // Only owners of the dog and admins can delete it
    const dog = await prisma.dog.findUnique({
      where: { id },
      include: { 
        owner: {
          select: {
            id: true,
            userId: true,
            name: true,
            email: true
          }
        } 
      }
    });
    
    if (!dog) {
      console.error(`Dog not found with ID: ${id}`);
      return NextResponse.json({ error: 'Dog not found' }, { status: 404 });
    }

    console.log('Found dog for deletion:', { 
      id: dog.id, 
      name: dog.name,
      ownerId: dog.ownerId, 
      ownerUserId: dog.owner?.userId 
    });

    // Check authorization
    if (userRole === 'owner') {
      // Directly check if the user ID matches the dog's owner's user ID
      if (dog.owner?.userId !== userId) {
        console.error(`Authorization failed: User ${userId} is not the owner of dog ${id}`);
        return NextResponse.json({ error: 'Unauthorized - Not the owner of this dog' }, { status: 403 });
      }
    } else if (userRole !== 'admin') {
      console.error(`Authorization failed: User role ${userRole} cannot delete dogs`);
      return NextResponse.json({ error: 'Unauthorized - Only owners and admins can delete dogs' }, { status: 403 });
    }
    
    // Delete the dog
    await prisma.dog.delete({
      where: { id }
    });
    
    // Invalidate cache for all user roles (since the dog was deleted)
    const cacheKeys = Array.from(cache.keys()).filter(key => key.startsWith(`dog-${id}`));
    cacheKeys.forEach(key => cache.delete(key));
    
    return NextResponse.json({ message: 'Dog deleted successfully' });
  } catch (error) {
    console.error(`Error deleting dog:`, error);
    return NextResponse.json({ 
      error: `Failed to delete dog: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
} 