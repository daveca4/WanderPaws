import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';

export async function POST(
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
    
    // Generate a random password (8 characters)
    const newPassword = Math.random().toString(36).slice(-8);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password
    await prisma.user.update({
      where: { id: params.id },
      data: { passwordHash }
    });
    
    // Return the new password (only time we'll show it in plaintext)
    return NextResponse.json({ 
      message: 'Password has been reset',
      newPassword 
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to reset password', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
} 