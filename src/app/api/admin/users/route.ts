import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAdminRequest } from '../../../../lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    // Verify this is an admin request
    const adminAuth = await verifyAdminRequest(request);
    if (!adminAuth.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const query = searchParams.get('query') || '';
    
    // Set up the where clause for the query
    const whereClause: any = {};
    
    // Add role filter if specified
    if (role) {
      whereClause.role = role;
    }
    
    // Add search query if provided
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    // Fetch users
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        owner: {
          select: {
            id: true
          }
        },
        walker: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 