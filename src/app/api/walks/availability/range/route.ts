import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { format, addDays } from 'date-fns';

interface AvailabilitySlot {
  time: string;
  available: boolean;
}

interface WalkerAvailability {
  day: number | string;
  morning?: boolean;
  afternoon?: boolean;
  allDay?: boolean;
}

/**
 * API endpoint to get walker availability for a date range
 * 
 * Query parameters:
 * - dogId: string - ID of the dog to check availability for
 * - startDate: string (YYYY-MM-DD) - Start of date range
 * - endDate: string (YYYY-MM-DD) - End of date range
 * 
 * Returns an object with availability for each date in the range:
 * {
 *   availability: {
 *     "2023-06-01": [
 *       { time: "8:00 AM", available: true },
 *       { time: "1:00 PM", available: false }
 *     ],
 *     "2023-06-02": [...],
 *     ...
 *   },
 *   walkerName: "John Smith" // The dog's assigned walker's name
 * }
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const dogId = searchParams.get('dogId');
    
    console.log('GET /api/walks/availability/range - Request received');
    console.log(`GET /api/walks/availability/range - Params: startDate=${startDate}, endDate=${endDate}, dogId=${dogId}`);
    console.log(`GET /api/walks/availability/range - User: ${userId}, Role: ${userRole}, ProfileId: ${userProfileId}`);
    
    // Dates are required
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }
    
    // Check if dates are valid
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }
    
    console.log('Range availability request:', { startDate, endDate, dogId });
    
    if (!dogId) {
      return NextResponse.json({ error: 'Dog ID is required' }, { status: 400 });
    }
    
    // First, get the dog with its assessment details
    const dog = await prisma.dog.findUnique({
      where: { id: dogId },
      include: {
        owner: true
      }
    });
    
    if (!dog) {
      return NextResponse.json({ error: 'Dog not found' }, { status: 404 });
    }
    
    // Verify dog ownership if user is an owner
    if (userRole === 'owner' && dog.ownerId !== userProfileId) {
      console.error('User does not own this dog:', {
        userId,
        userProfileId,
        dogOwnerId: dog.ownerId
      });
      return NextResponse.json(
        { error: 'You can only check availability for your own dogs' },
        { status: 403 }
      );
    }
    
    // Get the most recent completed assessment for this dog
    const assessment = await prisma.assessment.findFirst({
      where: { 
        dogId: dogId,
        status: 'completed',
        result: 'approved'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    if (!assessment) {
      return NextResponse.json(
        { error: 'This dog does not have a completed and approved assessment. Please complete an assessment first.' },
        { status: 400 }
      );
    }
    
    // Get the assigned walker from the assessment
    const walker = await prisma.walker.findUnique({
      where: { id: assessment.assignedWalkerId || '' }
    });
    
    if (!walker) {
      return NextResponse.json(
        { error: 'No walker assigned to this dog. Please contact support.' },
        { status: 400 }
      );
    }
    
    // Get all existing walks for this walker in the date range
    const existingWalks = await prisma.walk.findMany({
      where: {
        walkerId: walker.id,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        status: { in: ['scheduled', 'confirmed'] }
      },
      include: {
        dog: true
      }
    });
    
    // Get walker's availability from their profile
    let walkerAvailability: WalkerAvailability[] = [];
    
    // Parse availability data from walker profile (assuming it's stored as JSON)
    try {
      if (walker.availability) {
        // Handle array or JSON string format
        const availData = 
          typeof walker.availability === 'string' 
            ? JSON.parse(walker.availability) 
            : walker.availability;
            
        // Convert to array if needed
        const availArray = Array.isArray(availData) ? availData : [availData];
        
        // Safely transform to WalkerAvailability[]
        walkerAvailability = availArray
          .filter(item => item && typeof item === 'object' && 'day' in item)
          .map(item => ({
            day: item.day,
            morning: !!item.morning,
            afternoon: !!item.afternoon,
            allDay: !!item.allDay
          }));
      }
    } catch (error) {
      console.error('Error parsing walker availability:', error);
      // Default to no availability on error
    }
    
    // If no availability data found, create default availability (all weekdays)
    if (walkerAvailability.length === 0) {
      // Default: Monday to Friday, 8am-5pm
      walkerAvailability = [
        { day: 1, morning: true, afternoon: true }, // Monday
        { day: 2, morning: true, afternoon: true }, // Tuesday
        { day: 3, morning: true, afternoon: true }, // Wednesday
        { day: 4, morning: true, afternoon: true }, // Thursday
        { day: 5, morning: true, afternoon: true }  // Friday
      ];
    }
    
    // Generate date range
    const dates = generateDateRange(startDate, endDate);
    
    // Calculate availability for each date in the range
    const availability: Record<string, AvailabilitySlot[]> = {};
    
    for (const dateStr of dates) {
      // Get day of week for this date (0 = Sunday, 1 = Monday, etc.)
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      
      // Check walker's availability for this day of week
      const dayAvailability = walkerAvailability.find((a: WalkerAvailability) => 
        typeof a.day === 'number' ? a.day === dayOfWeek : a.day === getDayName(dayOfWeek)
      );
      
      // Initialize with standard morning and afternoon slots
      const timeSlots: AvailabilitySlot[] = [
        { time: "8:00 AM", available: false },
        { time: "1:00 PM", available: false }
      ];
      
      // If walker is available on this day, mark slots as available
      if (dayAvailability) {
        // Morning availability (before noon)
        if (dayAvailability.morning || dayAvailability.allDay) {
          timeSlots[0].available = true;
        }
        
        // Afternoon availability (after noon)
        if (dayAvailability.afternoon || dayAvailability.allDay) {
          timeSlots[1].available = true;
        }
      }
      
      // Check for existing walks that would block time slots
      const dateWalks = existingWalks.filter(walk => 
        // Compare only the date part, ignoring time
        walk.date.toISOString().split('T')[0] === dateStr
      );
      
      // Count walks in morning and afternoon
      const morningWalks = dateWalks.filter(walk => {
        const hour = parseInt(walk.startTime.split(':')[0], 10);
        return hour < 12;
      });
      
      const afternoonWalks = dateWalks.filter(walk => {
        const hour = parseInt(walk.startTime.split(':')[0], 10);
        return hour >= 12;
      });
      
      // A walker can handle up to 6 dogs at once
      const MAX_DOGS_PER_SLOT = 6;
      
      // Update availability based on existing walks
      if (morningWalks.length >= MAX_DOGS_PER_SLOT) {
        timeSlots[0].available = false;
      }
      
      if (afternoonWalks.length >= MAX_DOGS_PER_SLOT) {
        timeSlots[1].available = false;
      }
      
      // Add to availability map
      availability[dateStr] = timeSlots;
    }
    
    return NextResponse.json({
      availability,
      walkerName: walker.name
    });
    
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to generate an array of date strings between start and end dates
 */
function generateDateRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates: string[] = [];
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Helper function to convert day number to name
 */
function getDayName(dayNumber: number): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayNumber];
} 