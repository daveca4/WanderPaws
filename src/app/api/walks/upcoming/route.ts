import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { parseJsonFields } from '@/lib/dbOperations';
import { parseISO, isAfter, addDays } from 'date-fns';
import { Dog, Walk } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Get user info from the headers
    const userId = request.headers.get('user-id') || '';
    const userRole = request.headers.get('user-role') || '';
    const profileId = request.headers.get('user-profile-id') || '';

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log('🔍 Fetching upcoming walks for user:', { userId, userRole, profileId });
    
    // For debugging - check if there are ANY walks in the database
    const totalWalks = await prisma.walk.count();
    console.log(`📊 Total walks in database: ${totalWalks}`);
    
    // Explicitly type walks
    let walks: any[] = [];
    
    // Fetch all walks with includes and filter in memory to avoid schema issues
    walks = await prisma.walk.findMany({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)) // Get today and future walks
        }
      },
      include: {
        dog: {
          include: {
            owner: true
          }
        },
        walker: true
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    // Filter based on user role in memory
    if (userRole === 'owner') {
      walks = walks.filter(walk => {
        const ownerIdFromDog = walk.dog?.owner?.id;
        return ownerIdFromDog === profileId || ownerIdFromDog === userId;
      });
      console.log(`🚶 Filtered to ${walks.length} walks for owner`);
    } else if (userRole === 'walker') {
      walks = walks.filter(walk => 
        walk.walkerId === profileId || walk.walkerId === userId
      );
      console.log(`🚶 Filtered to ${walks.length} walks for walker`);
    }
    // Admin gets all walks, no filtering needed
    
    // If still no walks, add a test walk for demonstration
    if (walks.length === 0 && totalWalks === 0) {
      console.log('📝 Adding a sample walk to database for demonstration');
      
      try {
        // Find a dog and walker to associate with the walk
        const firstDog = await prisma.dog.findFirst();
        const firstWalker = await prisma.walker.findFirst();
        
        if (firstDog && firstWalker) {
          // Create a walk for tomorrow
          const tomorrow = addDays(new Date(), 1);
          
          const newWalk = await prisma.walk.create({
            data: {
              dogId: firstDog.id,
              walkerId: firstWalker.id,
              date: tomorrow.toISOString(),
              startTime: '09:00:00',
              timeSlot: 'AM',
              duration: 60,
              status: 'scheduled',
              notes: 'Sample walk automatically created'
            },
            include: {
              dog: true,
              walker: true
            }
          });
          
          console.log('✅ Created sample walk:', newWalk);
          walks.push(newWalk);
        }
      } catch (error) {
        console.error('❌ Error creating sample walk:', error);
      }
    }
    
    console.log(`📊 Final walk count: ${walks.length} upcoming walks`);
    if (walks.length > 0) {
      console.log('📝 Sample walk data:', JSON.stringify(walks[0]));
    }
    
    // Parse any JSON fields
    const parsedWalks = walks.map((walk: any) => parseJsonFields(walk));
    
    return NextResponse.json(parsedWalks);
  } catch (error) {
    console.error('❌ Error fetching upcoming walks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming walks', details: String(error) },
      { status: 500 }
    );
  }
} 