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
    
    let walks = [];
    
    // Logic based on user role
    if (userRole === 'owner') {
      try {
        // APPROACH 1: Find by owner directly
        // This is a more direct approach that doesn't require finding dogs first
        console.log('🔍 Trying owner-direct approach with ids:', { userId, profileId });
        
        walks = await prisma.walk.findMany({
          where: {
            OR: [
              // Direct owner ID match from walk
              { ownerId: userId },
              { ownerId: profileId },
              // Dog owner match 
              {
                dog: {
                  OR: [
                    { ownerId: userId },
                    { ownerId: profileId }
                  ]
                }
              }
            ],
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)) // Get today and future walks
            }
          },
          include: {
            dog: true,
            walker: true
          },
          orderBy: {
            date: 'asc'
          }
        });
        
        console.log(`🚶 Found ${walks.length} upcoming walks using direct owner match`);
        
        // If no walks found, try the dog-based approach
        if (walks.length === 0) {
          // For owners, get walks that match their dogs
          // First get the owner's dogs
          const ownerDogs = await prisma.dog.findMany({
            where: {
              OR: [
                { ownerId: userId },
                { ownerId: profileId }
              ]
            }
          });
          
          console.log(`🐕 Found ${ownerDogs.length} dogs for owner with IDs:`, ownerDogs.map((dog: any) => dog.id));
          
          if (ownerDogs.length > 0) {
            // Get walks for these dogs
            const dogIds = ownerDogs.map((dog: any) => dog.id);
            walks = await prisma.walk.findMany({
              where: {
                dogId: { in: dogIds },
                date: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)) // Get today and future walks
                }
              },
              include: {
                dog: true,
                walker: true
              },
              orderBy: {
                date: 'asc'
              }
            });
            
            console.log(`🚶 Found ${walks.length} upcoming walks for these dogs`);
          }
        }
        
        // If we still don't have walks, try one more approach
        if (walks.length === 0) {
          console.log(`⚠️ No walks found with standard approaches, trying extended lookups`);
          
          // Try to find walks with includes only
          walks = await prisma.walk.findMany({
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
            },
            take: 10
          });
          
          // Filter in memory for the current user
          walks = walks.filter(walk => {
            const dogOwnerId = walk.dog?.ownerId || '';
            return dogOwnerId === userId || dogOwnerId === profileId;
          });
          
          console.log(`🚶 Found ${walks.length} walks using extended approach`);
        }
      } catch (error) {
        console.error('❌ Error fetching owner dogs or walks:', error);
      }
    } else if (userRole === 'walker') {
      try {
        // For walkers, get walks assigned to them
        walks = await prisma.walk.findMany({
          where: {
            OR: [
              { walkerId: userId },
              { walkerId: profileId }
            ],
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)) // Get today and future walks
            }
          },
          include: {
            dog: true,
            walker: true
          },
          orderBy: {
            date: 'asc'
          }
        });
        
        console.log(`🚶 Found ${walks.length} upcoming walks for walker`);
      } catch (error) {
        console.error('❌ Error fetching walker walks:', error);
      }
    } else if (userRole === 'admin') {
      try {
        // Admins can see all upcoming walks
        walks = await prisma.walk.findMany({
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)) // Get today and future walks
            }
          },
          include: {
            dog: true,
            walker: true
          },
          orderBy: {
            date: 'asc'
          }
        });
        
        console.log(`🚶 Found ${walks.length} total upcoming walks for admin`);
      } catch (error) {
        console.error('❌ Error fetching admin walks:', error);
      }
    }
    
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
              ownerId: firstDog.ownerId,
              date: tomorrow.toISOString().split('T')[0],
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