import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import { parseJsonFields } from '@/lib/dbOperations';

export async function GET(request: NextRequest) {
  try {
    // Get auth cookie and parse it
    const authCookie = cookies().get('wanderpaws_auth')?.value;
    
    // If no auth cookie or unable to parse it
    if (!authCookie) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    // Try to parse the user from the cookie
    let currentUser;
    try {
      currentUser = JSON.parse(authCookie);
    } catch (e) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid auth token' }),
        { status: 401 }
      );
    }
    
    // Check if the user is an admin
    if (!currentUser || currentUser.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403 }
      );
    }
    
    // Get all users with their profile information
    const users = await prisma.user.findMany({
      include: {
        owner: true,
        walker: true,
      }
    });
    
    // Don't expose password hashes
    const sanitizedUsers = users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...sanitizedUser } = user;
      return sanitizedUser;
    });
    
    // Process the data but ensure it's still an array
    const processedUsers = parseJsonFields(sanitizedUsers);
    
    // Debug
    console.log('Type of processed users:', Array.isArray(processedUsers) ? 'array' : typeof processedUsers);
    
    // Ensure we're returning an array
    return NextResponse.json(Array.isArray(processedUsers) ? processedUsers : sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
} 