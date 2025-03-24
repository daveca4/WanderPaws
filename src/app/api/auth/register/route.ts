import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    // Get user data from request
    const data = await req.json();
    const { email, password, name, role = 'owner' } = data;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Generate a unique ID
    const userId = `user_${uuidv4()}`;
    
    // Create user
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        passwordHash,
        name,
        role,
        emailVerified: false,
      },
    });
    
    // Remove sensitive data before sending response
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    // Return response with properly shaped user object
    const userResponse = {
      ...userWithoutPassword,
      profileId: "", // Include empty string instead of null/undefined
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
    
    return NextResponse.json({
      message: 'User registered successfully',
      user: userResponse,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
} 