import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * API endpoint for booking dog walks
 * 
 * Expected request body:
 * {
 *   dogId: string,
 *   date: string (YYYY-MM-DD),
 *   timeSlot: string (e.g. "8:00 AM" or "1:00 PM"),
 *   notes: string (optional),
 *   isRecurring: boolean,
 *   recurrenceFrequency: string (weekly, biweekly, monthly) - only if isRecurring is true,
 *   recurrenceEndDate: string (YYYY-MM-DD) - only if isRecurring is true
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get authentication headers
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role');
    const userProfileId = request.headers.get('user-profile-id');

    // Validate user authentication
    if (!userId || !userRole) {
      console.error('Missing authentication headers:', { userId, userRole });
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only owners can book walks
    if (userRole !== 'owner' && userRole !== 'admin') {
      console.error('Unauthorized role for booking walks:', userRole);
      return NextResponse.json(
        { error: 'Only owners can book walks' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { dogId, date, timeSlot, notes, isRecurring, recurrenceFrequency, recurrenceEndDate } = body;

    console.log('Booking walk with data:', {
      userId,
      userRole,
      userProfileId,
      dogId,
      date,
      timeSlot,
      isRecurring,
      recurrenceFrequency,
      recurrenceEndDate
    });

    // Validate required fields
    if (!dogId || !date || !timeSlot) {
      return NextResponse.json(
        { error: 'Missing required fields: dogId, date, and timeSlot are required' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Date must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    // Validate recurring booking parameters
    if (isRecurring && (!recurrenceFrequency || !recurrenceEndDate)) {
      return NextResponse.json(
        { error: 'Recurring bookings require recurrenceFrequency and recurrenceEndDate' },
        { status: 400 }
      );
    }

    // Get dog information
    const dog = await prisma.dog.findUnique({
      where: { id: dogId },
      include: {
        owner: true
      }
    });

    if (!dog) {
      return NextResponse.json(
        { error: 'Dog not found' },
        { status: 404 }
      );
    }

    // Verify dog ownership
    if (userRole === 'owner' && dog.ownerId !== userProfileId) {
      console.error('User does not own this dog:', {
        userId,
        userProfileId,
        dogOwnerId: dog.ownerId
      });
      return NextResponse.json(
        { error: 'You can only book walks for your own dogs' },
        { status: 403 }
      );
    }

    // Get the most recent assessment to find the assigned walker
    const assessment = await prisma.assessment.findFirst({
      where: {
        dogId: dogId,
        status: 'completed'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!assessment || !assessment.assignedWalkerId) {
      return NextResponse.json(
        { error: 'This dog does not have an assigned walker. Please complete an assessment first.' },
        { status: 400 }
      );
    }

    // Get the assigned walker
    const walker = await prisma.walker.findUnique({
      where: { id: assessment.assignedWalkerId }
    });

    if (!walker) {
      return NextResponse.json(
        { error: 'Assigned walker not found' },
        { status: 400 }
      );
    }

    // Convert timeSlot to start time format
    let startTime;
    if (timeSlot.includes('AM') || timeSlot.toLowerCase() === 'morning') {
      startTime = '08:00:00';
    } else {
      startTime = '13:00:00';
    }

    // Create initial walk booking
    const walk = await prisma.walk.create({
      data: {
        date: new Date(date),
        startTime,
        timeSlot: timeSlot === 'morning' ? '8:00 AM - 12:00 PM' : '1:00 PM - 5:00 PM',
        duration: 60, // 60 minutes
        status: 'scheduled',
        notes: notes || '',
        dogId,
        walkerId: walker.id,
        // These fields don't exist in the schema but were in our code:
        // userId, isRecurring, recurrenceFrequency, recurrenceEndDate
      }
    });

    // If it's a recurring booking, create the entire series
    const recurringWalks: typeof walk[] = [];
    if (isRecurring) {
      const createdWalks = await createRecurringWalks(
        walk.id,
        dogId,
        walker.id,
        date,
        recurrenceEndDate,
        recurrenceFrequency,
        startTime,
        notes || ''
      );
      
      recurringWalks.push(...createdWalks);
    }

    // Deduct walk credits from the owner's subscription
    // Number of walks to deduct = 1 for single booking or the number of recurring walks
    const walksToDeduct = isRecurring ? recurringWalks.length + 1 : 1;
    
    try {
      const userSubscription = await prisma.userSubscription.findFirst({
        where: {
          userId: dog.ownerId || '',
          status: 'active',
          endDate: {
            gte: new Date()
          }
        }
      });

      if (userSubscription) {
        await prisma.userSubscription.update({
          where: { id: userSubscription.id },
          data: {
            creditsRemaining: (userSubscription.creditsRemaining || 0) - walksToDeduct
          }
        });
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      // Don't fail the booking if subscription update fails
    }

    return NextResponse.json({
      message: 'Walk booked successfully',
      walkId: walk.id,
      recurringWalks: isRecurring ? recurringWalks.map(w => w.id) : []
    });
  } catch (error) {
    console.error('Error booking walk:', error);
    return NextResponse.json(
      { error: 'Failed to book walk. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to create recurring walks
 */
async function createRecurringWalks(
  parentId: string,
  dogId: string,
  walkerId: string,
  startDate: string,
  endDate: string,
  frequency: string,
  startTime: string,
  notes: string
) {
  const recurringWalks = [];
  
  // Parse dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set up interval based on frequency
  let intervalDays = 7; // weekly
  if (frequency === 'biweekly') {
    intervalDays = 14;
  } else if (frequency === 'monthly') {
    intervalDays = 30; // Approximation
  }
  
  // Calculate recurring dates
  const currentDate = new Date(start);
  currentDate.setDate(currentDate.getDate() + intervalDays); // Skip the first occurrence (already created)
  
  while (currentDate <= end) {
    // Create a walk for this date
    const walk = await prisma.walk.create({
      data: {
        date: new Date(currentDate),
        startTime,
        timeSlot: startTime.startsWith('08') ? '8:00 AM - 12:00 PM' : '1:00 PM - 5:00 PM',
        duration: 60, // 60 minutes
        status: 'scheduled',
        notes,
        dogId,
        walkerId
        // These recurring fields aren't in the schema
        // parentWalkId, isRecurring, recurrenceFrequency, recurrenceEndDate
      }
    });
    
    recurringWalks.push(walk);
    
    // Move to next occurrence
    currentDate.setDate(currentDate.getDate() + intervalDays);
  }
  
  return recurringWalks;
} 