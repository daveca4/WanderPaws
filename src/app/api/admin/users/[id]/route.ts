import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';

// Update a user
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
    
    // Check if the user is an admin
    if (!currentUser || currentUser.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403 }
      );
    }
    
    // Get the updated data from the request
    const data = await request.json();
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data,
    });
    
    // Don't return the password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json({
      message: 'User updated successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to update user', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
}

// Delete a user
export async function DELETE(
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
    
    // Check if the user is an admin
    if (!currentUser || currentUser.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403 }
      );
    }
    
    // First, check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        owner: true,
        walker: true,
      },
    });
    
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      );
    }
    
    // Delete any associated profiles first
    if (user.walker) {
      await prisma.walker.delete({
        where: { id: user.walker.id },
      });
    }
    
    if (user.owner) {
      await prisma.owner.delete({
        where: { id: user.owner.id },
      });
    }
    
    // Now delete the user
    await prisma.user.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to delete user', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
} 