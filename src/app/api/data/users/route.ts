import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Define a simplified user type for internal use
type UserRecord = {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  emailVerified: any; // Allow any type for flexibility with DB schema
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner: { id: string } | null;
};

export async function GET(request: NextRequest) {
  try {
    // Get authentication data from headers
    const auth = {
      userId: request.headers.get('user-id'),
      userRole: request.headers.get('user-role'),
      profileId: request.headers.get('user-profile-id')
    };
    
    // Check if user is authenticated
    if (!auth.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    console.log('GET /api/data/users - Auth:', auth);
    
    try {
      // Fetch users based on role
      let userData: UserRecord[] = [];
      
      if (auth.userRole === 'admin') {
        // Admin can see all users
        userData = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            emailVerified: true,
            image: true,
            createdAt: true,
            updatedAt: true,
            owner: {
              select: {
                id: true,
              }
            }
          }
        });
      } else {
        // Regular users can only see their own data
        const user = await prisma.user.findUnique({
          where: {
            id: auth.userId
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
            owner: {
              select: {
                id: true,
              }
            }
          }
        });
        
        if (user) {
          userData = [user];
        }
      }
      
      // Process the user data
      const processedUsers = userData.map(user => {
        // Convert dates to ISO strings for consistent serialization
        const serializedUser = {
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          emailVerified: user.emailVerified instanceof Date ? user.emailVerified.toISOString() : 
                         user.emailVerified === true ? new Date().toISOString() : null,
          profileId: user.owner?.id || null
        };
        
        // Helper function to parse JSON fields
        const parseJsonFields = (obj: any) => {
          const result = { ...obj };
          for (const key in result) {
            if (typeof result[key] === 'string') {
              try {
                const parsed = JSON.parse(result[key]);
                if (typeof parsed === 'object') {
                  result[key] = parsed;
                }
              } catch (e) {
                // Not a valid JSON string, keep as is
              }
            } else if (typeof result[key] === 'object' && result[key] !== null) {
              result[key] = parseJsonFields(result[key]);
            }
          }
          return result;
        };
        
        return parseJsonFields(serializedUser);
      });
      
      return NextResponse.json(processedUsers);
    } catch (dbError) {
      console.error('Database error in users API:', dbError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 