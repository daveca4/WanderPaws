import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';

interface RouteParams {
  params: {
    id: string;
  }
}

// Get a specific user by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { id },
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
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error(`Error fetching user ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// Update a user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Remove sensitive fields that shouldn't be updated directly
    const { passwordHash, ...updateData } = body;
    
    // Find and update the user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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
    console.error(`Error updating user ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Delete a user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Delete the user
    await prisma.user.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting user ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Check if the user is updating their own profile or is an admin
    if (!currentUser || (currentUser.id !== params.id && currentUser.role !== 'admin')) {
      return new NextResponse(
        JSON.stringify({ error: 'You can only update your own profile' }),
        { status: 403 }
      );
    }
    
    // Get the updated data from the request
    const data = await request.json();
    const { name, image } = data;
    
    // Define allowed fields to update
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });
    
    // Don't return the password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    
    // Update the cookie if the user is updating their own profile
    if (currentUser.id === params.id) {
      // Create an updated cookie with the new data
      const updatedCookie = {
        ...currentUser,
        name: updatedUser.name,
        image: updatedUser.image
      };
      
      // Create response
      const response = NextResponse.json({
        message: 'Profile updated successfully',
        user: userWithoutPassword,
      });
      
      // Update the auth cookie
      response.cookies.set({
        name: 'wanderpaws_auth',
        value: JSON.stringify(updatedCookie),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/'
      });
      
      return response;
    }
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to update profile', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
} 