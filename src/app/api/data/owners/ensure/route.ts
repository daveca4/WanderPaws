import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';

// Create a simple in-memory cache for recently created owners
// This helps avoid DB lookups for frequent operations
const ownerCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * This endpoint ensures that an Owner record exists for a given User
 * It either returns the existing Owner or creates a new one
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    if (!userId) {
      console.error('No user ID in headers');
      return NextResponse.json({ error: 'User ID is required in headers' }, { status: 400 });
    }

    const data = await request.json();
    console.log('Ensuring owner profile for user:', userId, data);
    
    // Check cache first
    if (ownerCache.has(userId)) {
      const cachedOwner = ownerCache.get(userId);
      if (cachedOwner && cachedOwner.timestamp > Date.now() - CACHE_TTL) {
        console.log('Returning cached owner:', cachedOwner.data);
        return NextResponse.json(cachedOwner.data);
      } else {
        // Cache expired, remove it
        ownerCache.delete(userId);
      }
    }
    
    // Check if owner record already exists for this user
    let owner = await prisma.owner.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        userId: true,
        dogs: {
          select: {
            id: true
          }
        }
      }
    });
    
    if (owner) {
      console.log('Found existing owner:', owner);
      const parsedOwner = parseJsonFields(owner);
      
      // Cache the result
      ownerCache.set(userId, {
        data: parsedOwner,
        timestamp: Date.now()
      });
      
      return NextResponse.json(parsedOwner);
    }
    
    console.log('Creating new owner for user:', userId);
    
    // Create new owner record if it doesn't exist
    owner = await prisma.owner.create({
      data: {
        userId,
        name: data.name || 'Dog Owner',
        email: data.email,
        phone: data.phone || '',
        address: data.address || {
          street: '',
          city: '',
          state: '',
          zip: ''
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        userId: true,
        dogs: {
          select: {
            id: true
          }
        }
      }
    });
    
    console.log('Created new owner:', owner);
    const parsedOwner = parseJsonFields(owner);
    
    // Cache the new owner
    ownerCache.set(userId, {
      data: parsedOwner,
      timestamp: Date.now()
    });
    
    return NextResponse.json(parsedOwner);
  } catch (error) {
    console.error('Error ensuring owner exists:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      error: `Failed to ensure owner exists: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
} 