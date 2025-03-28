import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Get auth cookie
    const authCookie = cookies().get('wanderpaws_auth')?.value;
    
    if (!authCookie) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        authenticated: false 
      }, { status: 401 });
    }
    
    // Parse user from cookie
    let user;
    try {
      user = JSON.parse(authCookie);
    } catch (e) {
      return NextResponse.json({ 
        error: 'Invalid auth token',
        authenticated: false 
      }, { status: 401 });
    }
    
    // Get additional profile info for walkers
    if (user && user.role === 'walker') {
      // Get the actual walker record with proper ID
      const walker = await prisma.walker.findUnique({
        where: { userId: user.id },
        select: { 
          id: true,
          name: true,
          email: true
        }
      });
      
      if (walker) {
        console.log('Found walker record:', walker);
        return NextResponse.json({
          ...user,
          authenticated: true,
          walkerId: walker.id,
          walkerDetails: walker
        });
      }
    }
    
    // For all other users
    return NextResponse.json({ 
      ...user,
      authenticated: true
    });
  } catch (error) {
    console.error('Error in current-user endpoint:', error);
    return NextResponse.json({ 
      error: 'Failed to get current user',
      authenticated: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 