import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { format, isValid, addHours } from 'date-fns';

// Get available time slots for a specific date
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const walkerId = searchParams.get('walkerId');
    const dogId = searchParams.get('dogId');
    
    // Check for recurring booking parameters
    const isRecurring = searchParams.get('isRecurring') === 'true';
    const recurrenceFrequency = searchParams.get('frequency');
    const recurrenceEndDate = searchParams.get('endDate');
    
    // Date is required
    if (!date || !isValid(new Date(date))) {
      return NextResponse.json({ error: 'Valid date is required' }, { status: 400 });
    }
    
    console.log('Availability request:', { 
      date, 
      walkerId, 
      dogId,
      isRecurring,
      recurrenceFrequency,
      recurrenceEndDate
    });
    
    // If this is a recurring booking request, validate the end date
    if (isRecurring && recurrenceEndDate) {
      if (!isValid(new Date(recurrenceEndDate))) {
        return NextResponse.json({ error: 'Valid end date is required for recurring bookings' }, { status: 400 });
      }
      
      // End date must be after start date
      if (new Date(recurrenceEndDate) <= new Date(date)) {
        return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
      }
    }
    
    let walkerIdToUse = walkerId;
    let walkerName = '';
    let walkerData;
    
    // If no walker ID is provided, but a dog ID is, find the assigned walker for the dog
    if (!walkerIdToUse && dogId) {
      console.log('Looking up walker for dog:', dogId);
      
      try {
        // First get the dog to verify it exists
        const dog = await prisma.dog.findUnique({
          where: { id: dogId }
        });
        
        if (!dog) {
          return NextResponse.json({ error: 'Dog not found' }, { status: 404 });
        }
        
        console.log('Found dog:', { id: dog.id, name: dog.name });
        
        // Now find the assessment for this dog
        const assessment = await prisma.assessment.findFirst({
          where: { 
            dogId: dogId,
            status: 'completed',
            result: 'approved'
          },
          select: {
            id: true,
            assignedWalkerId: true
          },
          orderBy: { updatedAt: 'desc' }
        });
        
        console.log('Assessment found:', assessment ? 
          { id: assessment.id, walkerId: assessment.assignedWalkerId } : 'No assessment');
        
        if (assessment && assessment.assignedWalkerId) {
          walkerIdToUse = assessment.assignedWalkerId;
          
          // Get the walker details
          const walker = await prisma.walker.findUnique({
            where: { id: assessment.assignedWalkerId },
            select: { id: true, name: true }
          });
          
          if (walker) {
            walkerName = walker.name || 'Unknown';
            console.log('Found assigned walker:', { id: walkerIdToUse, name: walkerName });
          }
        } else {
          return NextResponse.json({ 
            error: 'This dog does not have an assigned walker yet. Please complete a dog assessment first.', 
            timeSlots: [] 
          }, { status: 404 });
        }
      } catch (error) {
        console.error('Error finding assigned walker:', error);
        return NextResponse.json({ 
          error: 'Error finding assigned walker', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
      }
    }
    
    // If after checking for a dog, we still don't have a walker ID, return an error
    if (!walkerIdToUse) {
      return NextResponse.json({ error: 'Walker ID is required either directly or via a dog ID' }, { status: 400 });
    }
    
    // Get the walker's availability
    try {
      const walker = await prisma.walker.findUnique({
        where: { id: walkerIdToUse },
        select: {
          id: true,
          name: true,
          availability: true
        }
      });
      
      if (!walker) {
        console.log('Walker not found:', walkerIdToUse);
        return NextResponse.json({ error: 'Walker not found' }, { status: 404 });
      }
      
      // Save walker data for later use
      walkerData = walker;
      
      // Set the walker name if we didn't already have it
      if (!walkerName) {
        walkerName = walker.name || 'Unknown';
      }
      
      console.log('Walker found:', { id: walker.id, name: walker.name });
      
      // Parse the walker's availability from JSON if needed
      let walkerAvailability;
      try {
        walkerAvailability = typeof walker.availability === 'string' 
          ? JSON.parse(walker.availability) 
          : walker.availability;
        
        if (!walkerAvailability || typeof walkerAvailability !== 'object') {
          return NextResponse.json({ 
            error: 'Walker has no availability configured', 
            timeSlots: [],
            walkerName
          }, { status: 404 });
        }
      } catch (e) {
        console.error('Failed to parse walker availability:', e);
        return NextResponse.json({ 
          error: 'Error parsing walker availability data', 
          timeSlots: [],
          walkerName
        }, { status: 500 });
      }
      
      console.log('Walker availability:', walkerAvailability);
      
      // Get the day of week
      const dayOfWeek = format(new Date(date), 'EEEE').toLowerCase();
      
      // Check if the walker works on this day
      if (!walkerAvailability[dayOfWeek] || !Array.isArray(walkerAvailability[dayOfWeek])) {
        console.log('Walker does not work on', dayOfWeek);
        return NextResponse.json({ 
          timeSlots: [],
          walkerName,
          walkerId: walker.id,
          message: `Walker is not available on ${format(new Date(date), 'EEEE')}s`
        });
      }
      
      // Format the date
      const formattedDate = format(new Date(date), 'yyyy-MM-dd');
      
      // The minimum booking time is 48 hours from now
      const now = new Date();
      const minBookingDate = addHours(now, 48);
      
      // If the requested date is less than 48 hours away, no slots are available
      if (new Date(date) < minBookingDate) {
        console.log('Date is less than 48 hours away');
        return NextResponse.json({ 
          timeSlots: [],
          walkerName,
          walkerId: walker.id,
          message: 'Bookings must be made at least 48 hours in advance'
        });
      }
      
      // If this is a recurring booking, check conflicts across all dates
      if (isRecurring && recurrenceEndDate) {
        // For recurring bookings, we need to check availability for all relevant dates
        // This is a simplified version - in production you'd want to check each date
        console.log('Checking recurring booking availability');
        
        const startDate = new Date(date);
        const endDate = new Date(recurrenceEndDate);
        
        // Check if the day of week is consistently available
        // For weekly recurrence, the day of week should be available for all weeks
        if (recurrenceFrequency === 'weekly' || recurrenceFrequency === 'biweekly') {
          // Walker should be generally available on this day of week
          if (!walkerAvailability[dayOfWeek]) {
            return NextResponse.json({
              timeSlots: [],
              walkerName,
              walkerId: walker.id,
              message: `Walker is not available on ${format(new Date(date), 'EEEE')}s for recurring bookings`
            });
          }
        } else if (recurrenceFrequency === 'monthly') {
          // For monthly, ideally check each month's occurrence
          // This is simplified for now
        }
      }
      
      // Get the walker's existing walks for the day to check availability
      const existingWalks = await prisma.walk.findMany({
        where: {
          walkerId: walkerIdToUse,
          date: {
            gte: new Date(`${formattedDate}T00:00:00`),
            lt: new Date(`${formattedDate}T23:59:59`)
          },
          status: {
            in: ['scheduled', 'in-progress']
          }
        },
        select: {
          id: true,
          date: true,
          timeSlot: true,
          duration: true
        }
      });
      
      console.log('Existing walks:', existingWalks);
      
      // Count walks per time slot to check capacity
      const walkCountByTimeSlot: Record<string, number> = {};
      
      // Initialize with 0 for each available time slot
      const availableTimeSlots = walkerAvailability[dayOfWeek];
      availableTimeSlots.forEach((slot: string) => {
        walkCountByTimeSlot[slot] = 0;
      });
      
      // Count existing walks for each time slot
      existingWalks.forEach(walk => {
        if (walk.timeSlot) {
          walkCountByTimeSlot[walk.timeSlot] = (walkCountByTimeSlot[walk.timeSlot] || 0) + 1;
        }
      });
      
      console.log('Walk counts by time slot:', walkCountByTimeSlot);
      
      // Format the time slots with availability and remaining capacity
      const formattedTimeSlots = availableTimeSlots.map((slot: string) => {
        const bookedCount = walkCountByTimeSlot[slot] || 0;
        const maxDogsPerWalk = 6; // Maximum 6 dogs per walk
        const slotsRemaining = maxDogsPerWalk - bookedCount;
        
        return {
          time: slot,
          available: slotsRemaining > 0,
          slotsRemaining: slotsRemaining
        };
      });
      
      console.log('Formatted time slots with availability:', formattedTimeSlots);
      
      // Return time slots in a consistent format
      return NextResponse.json({
        walkerName: walkerName,
        walkerId: walker.id,
        timeSlots: formattedTimeSlots
      });
    } catch (error) {
      console.error('Error getting walker availability:', error);
      return NextResponse.json({ 
        error: 'Error getting walker availability', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in availability endpoint:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 