import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    // Get login credentials from request
    const data = await req.json();
    const { email, password } = data;
    
    console.log('Login attempt for email:', email);
    
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find the user
    console.log('Finding user in database...');
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        owner: true,
        walker: true
      }
    });
    
    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      console.log('User has no password hash');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Verify password
    console.log('Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      console.log('Invalid password');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    console.log('Login successful');
    const currentLoginTime = new Date().toISOString();
    
    // Remove sensitive data
    const { passwordHash: _, ...userWithoutSensitiveData } = user;
    
    // Get the profile ID based on role
    let profileId = '';
    if (user.role === 'owner' && user.owner) {
      profileId = user.owner.id;
    } else if (user.role === 'walker' && user.walker) {
      profileId = user.walker.id;
    }
    
    // Create user object for token and response
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      image: user.image,
      profileId: profileId
    };
    
    // If the user is a walker, include their walker ID
    if (user.role === 'walker') {
      try {
        const walker = await prisma.walker.findUnique({
          where: { userId: user.id },
          select: { id: true }
        });
        
        if (walker) {
          console.log('Found walker record during login:', walker);
          (userWithoutPassword as any).walkerId = walker.id;
        }
      } catch (error) {
        console.error('Error finding walker record during login:', error);
      }
    }
    
    // Return user data with properly formatted fields
    const userResponse = {
      ...userWithoutPassword,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLogin: currentLoginTime,
    };
    
    // Create a response with the user data
    const response = NextResponse.json({
      message: 'Login successful',
      user: userResponse,
    });
    
    // Set the token as an HTTP-only cookie
    response.cookies.set({
      name: 'wanderpaws_auth',
      value: JSON.stringify(userWithoutPassword),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 