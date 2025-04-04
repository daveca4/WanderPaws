import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';

export interface AuthVerification {
  authorized: boolean;
  userId?: string;
  profileId?: string;
  role?: string;
  error?: string;
}

/**
 * Verify if the request is authorized as an admin
 */
export async function verifyAdminRequest(request: NextRequest): Promise<AuthVerification> {
  try {
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role');
    const url = request.url;
    
    console.log('Admin verification request', { 
      userId, 
      userRole, 
      url, 
      method: request.method,
      path: new URL(request.url).pathname
    });
    
    if (!userId || !userRole) {
      console.warn('Admin auth failed: Missing user authentication headers', { 
        userId, 
        userRole, 
        url 
      });
      
      // Try getting auth from cookies as fallback
      const cookies = request.cookies;
      const authCookie = cookies.get('wanderpaws_auth');
      
      if (authCookie) {
        try {
          const userData = JSON.parse(authCookie.value);
          console.log('Found auth cookie during admin verification', { 
            id: userData.id, 
            role: userData.role 
          });
          
          if (userData.role === 'admin') {
            return {
              authorized: true,
              userId: userData.id,
              role: userData.role
            };
          } else {
            console.warn('Auth cookie user is not admin', { 
              userId: userData.id, 
              role: userData.role 
            });
          }
        } catch (e) {
          console.error('Failed to parse auth cookie:', e);
        }
      }
      
      return { 
        authorized: false, 
        error: 'Missing user authentication headers' 
      };
    }
    
    if (userRole !== 'admin') {
      console.warn('Admin auth failed: User is not an admin', { 
        userId, 
        role: userRole, 
        url 
      });
      
      return { 
        authorized: false, 
        userId,
        role: userRole,
        error: 'User is not an admin' 
      };
    }
    
    // If needed, you could verify the admin against the database here
    // const admin = await prisma.user.findUnique({ where: { id: userId } });
    // if (!admin || admin.role !== 'admin') return { authorized: false };
    
    console.log('Admin verification successful', { 
      userId, 
      role: userRole, 
      url 
    });
    
    return { 
      authorized: true,
      userId,
      role: userRole
    };
  } catch (error) {
    console.error('Error verifying admin request:', error);
    return { 
      authorized: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verify if the request is from an owner
 */
export async function verifyOwnerRequest(request: NextRequest): Promise<AuthVerification> {
  try {
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role');
    const userProfileId = request.headers.get('user-profile-id');
    
    if (!userId || !userRole) {
      return { 
        authorized: false, 
        error: 'Missing user authentication headers' 
      };
    }
    
    if (userRole !== 'owner' && userRole !== 'admin') {
      return { 
        authorized: false, 
        userId,
        role: userRole,
        error: 'User is not an owner or admin' 
      };
    }
    
    return { 
      authorized: true,
      userId,
      profileId: userProfileId || undefined,
      role: userRole
    };
  } catch (error) {
    console.error('Error verifying owner request:', error);
    return { 
      authorized: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verify if the request is from a walker
 */
export async function verifyWalkerRequest(request: NextRequest): Promise<AuthVerification> {
  try {
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role');
    const userProfileId = request.headers.get('user-profile-id');
    
    if (!userId || !userRole) {
      return { 
        authorized: false, 
        error: 'Missing user authentication headers' 
      };
    }
    
    if (userRole !== 'walker' && userRole !== 'admin') {
      return { 
        authorized: false, 
        userId,
        role: userRole,
        error: 'User is not a walker or admin' 
      };
    }
    
    return { 
      authorized: true,
      userId,
      profileId: userProfileId || undefined,
      role: userRole
    };
  } catch (error) {
    console.error('Error verifying walker request:', error);
    return { 
      authorized: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function to check if a user is an admin
export async function isAdmin(userId: string) {
  if (!userId) return false;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    return user?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Simplified function to verify admin access in API routes
export async function verifyAdminAccess(req: NextRequest) {
  try {
    // Get user ID from cookie or authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || '';
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    
    // Extract user ID from token or cookie
    const userId = getIdFromToken(token) || sessionCookie?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }
    
    return null; // No error, proceed with admin access
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    );
  }
}

// Function to verify owner access
export async function verifyOwnerAccess(req: NextRequest, ownerId: string) {
  try {
    // Get user ID from cookie or authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || '';
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    
    // Extract user ID from token or cookie
    const userId = getIdFromToken(token) || sessionCookie?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Check if user is the owner or an admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }
    
    // Allow if user is admin or the owner
    if (user.role === 'admin' || userId === ownerId) {
      return null; // No error, proceed with access
    }
    
    return NextResponse.json(
      { error: 'Unauthorized. You do not have permission to access this resource.' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error verifying owner access:', error);
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    );
  }
}

// Function to verify walker access
export async function verifyWalkerAccess(req: NextRequest, walkerId: string) {
  try {
    // Get user ID from cookie or authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || '';
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    
    // Extract user ID from token or cookie
    const userId = getIdFromToken(token) || sessionCookie?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Check if user is the walker or an admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }
    
    // Allow if user is admin or the walker
    if (user.role === 'admin' || userId === walkerId) {
      return null; // No error, proceed with access
    }
    
    return NextResponse.json(
      { error: 'Unauthorized. You do not have permission to access this resource.' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error verifying walker access:', error);
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    );
  }
}

// Helper function to extract user ID from token (placeholder implementation)
function getIdFromToken(token: string): string | null {
  // This is a simplified placeholder. In a real app, you would verify
  // the token signature and extract the user ID from it.
  try {
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || null;
  } catch (e) {
    return null;
  }
} 