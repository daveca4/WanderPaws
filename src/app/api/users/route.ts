import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Get users with optional filtering by IDs, role, walkerIds, or ownerIds
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const ids = url.searchParams.get('ids');
    const role = url.searchParams.get('role');
    const walkerIds = url.searchParams.get('walkerIds');
    const ownerIds = url.searchParams.get('ownerIds');
    
    const where: any = {};
    
    // If IDs are provided, filter by those IDs
    if (ids) {
      const idArray = ids.split(',');
      where.id = {
        in: idArray
      };
    }
    
    // If role is provided, filter by role
    if (role) {
      where.role = role;
    }
    
    // If walkerIds are provided, filter users with walker profiles
    if (walkerIds) {
      const walkerIdArray = walkerIds.split(',');
      where.walker = {
        id: {
          in: walkerIdArray
        }
      };
    }
    
    // If ownerIds are provided, filter users with owner profiles
    if (ownerIds) {
      const ownerIdArray = ownerIds.split(',');
      where.owner = {
        id: {
          in: ownerIdArray
        }
      };
    }
    
    // Fetch users with minimal data for privacy
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        owner: {
          select: {
            id: true,
            name: true
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
    
    // Transform the data to include the appropriate name
    const transformedUsers = users.map(user => {
      let displayName = user.name;
      
      // If no name is set but the user has a profile, use that name
      if (!displayName) {
        if (user.role === 'owner' && user.owner) {
          displayName = user.owner.name;
        } else if (user.role === 'walker' && user.walker) {
          displayName = user.walker.name;
        } else {
          // Fall back to email if no name is available
          displayName = user.email.split('@')[0];
        }
      }
      
      return {
        id: user.id,
        name: displayName,
        email: user.email,
        role: user.role,
        image: user.image,
        profileId: user.role === 'owner' ? user.owner?.id : user.walker?.id
      };
    });
    
    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', users: [] },
      { status: 500 }
    );
  }
}

// Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.email || !body.role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash: body.passwordHash || '',
        name: body.name,
        role: body.role,
        emailVerified: body.emailVerified || false,
        image: body.image,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        // Don't include passwordHash in the response for security
      },
    });
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 