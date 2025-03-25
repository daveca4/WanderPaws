import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';

// Custom caching function since unstable_cache isn't readily available
const cacheTtl = 60 * 1000; // 60 seconds in ms
const cache = new Map<string, { data: any, timestamp: number }>();

async function getCachedDog(id: string) {
  const cacheKey = `dog-${id}`;
  const now = Date.now();
  const cachedValue = cache.get(cacheKey);
  
  // Return cached value if still valid
  if (cachedValue && now - cachedValue.timestamp < cacheTtl) {
    return cachedValue.data;
  }
  
  // Otherwise, fetch from database
  const dog = await prisma.dog.findUnique({
    where: { id },
    include: { owner: true }
  });
  
  // Cache the result
  if (dog) {
    cache.set(cacheKey, { data: dog, timestamp: now });
  }
  
  return dog;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Use HTTP cache headers for browser caching
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    
    // Get the dog (using the cache)
    const dog = await getCachedDog(id);
    
    if (!dog) {
      return NextResponse.json({ error: 'Dog not found' }, { status: 404 });
    }
    
    // Parse any JSON fields in the data
    const parsedDog = parseJsonFields(dog);
    
    return NextResponse.json(parsedDog, { headers });
  } catch (error) {
    console.error(`Error fetching dog:`, error);
    return NextResponse.json({ error: 'Failed to fetch dog' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    // Validate that dog exists
    const existingDog = await prisma.dog.findUnique({
      where: { id }
    });
    
    if (!existingDog) {
      return NextResponse.json({ error: 'Dog not found' }, { status: 404 });
    }
    
    // Update dog (transaction ensures atomicity)
    const updatedDog = await prisma.$transaction(async (prisma) => {
      const dog = await prisma.dog.update({
        where: { id },
        data
      });
      
      return dog;
    });
    
    // Invalidate cache
    const cacheKey = `dog-${id}`;
    cache.delete(cacheKey);
    
    // Parse any JSON fields in the response
    const parsedDog = parseJsonFields(updatedDog);
    
    return NextResponse.json(parsedDog);
  } catch (error) {
    console.error(`Error updating dog:`, error);
    return NextResponse.json({ 
      error: `Failed to update dog: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Check if dog exists
    const dog = await prisma.dog.findUnique({
      where: { id }
    });
    
    if (!dog) {
      return NextResponse.json({ error: 'Dog not found' }, { status: 404 });
    }
    
    // Get the user ID from the query params
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // Alternative way to get userId from headers
    const headerUserId = request.headers.get('user-id');
    
    // If neither is provided, return error
    if (!userId && !headerUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Check the owner's ID matches the user's profile ID (authorization check)
    if (dog.ownerId !== userId && dog.ownerId !== headerUserId) {
      return NextResponse.json({ error: 'Unauthorized - You do not own this dog' }, { status: 403 });
    }
    
    // Delete the dog
    await prisma.dog.delete({
      where: { id }
    });
    
    // Invalidate cache
    const cacheKey = `dog-${id}`;
    cache.delete(cacheKey);
    
    return NextResponse.json({ message: 'Dog deleted successfully' });
  } catch (error) {
    console.error(`Error deleting dog:`, error);
    return NextResponse.json({ 
      error: `Failed to delete dog: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
} 