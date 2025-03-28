import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes, format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { dogId, date, timeSlot, notes, ownerId } = body;
    
    console.log('Booking request:', { dogId, date, timeSlot, notes, ownerId });
    
    // Check required fields
    if (!dogId || !date || !timeSlot) {
      return NextResponse.json({ 
        error: 'Missing required fields: dogId, date, and timeSlot are required' 
      }, { status: 400 });
    }
    
    // Verify dog exists
    const dog = await prisma.dog.findUnique({
      where: { id: dogId }
    });
    
    if (!dog) {
      return NextResponse.json({ 
        error: 'Dog not found' 
      }, { status: 404 });
    }
    
    console.log('Dog found:', { id: dog.id, name: dog.name });
    
    // Find assigned walker through assessment
    let assignedWalkerId = null;
    
    const assessment = await prisma.assessment.findFirst({
      where: {
        dogId: dogId,
        status: 'completed',
        result: 'approved'
      },
      select: {
        id: true,
        assignedWalkerId: true
      }
    });
    
    if (assessment && assessment.assignedWalkerId) {
      assignedWalkerId = assessment.assignedWalkerId;
    } else {
      // If no assigned walker from assessment, try to find any available walker
      const anyWalker = await prisma.walker.findFirst({
        select: { id: true }
      });
      
      if (anyWalker) {
        assignedWalkerId = anyWalker.id;
      } else {
        return NextResponse.json({ 
          error: 'No available walker found for this dog' 
        }, { status: 400 });
      }
    }
    
    // Ensure booking date is at least 48 hours in the future
    const bookingDate = new Date(date);
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours in milliseconds
    
    if (bookingDate < minBookingTime) {
      return NextResponse.json({ 
        error: 'Bookings must be made at least 48 hours in advance' 
      }, { status: 400 });
    }
    
    // Parse time slot (e.g., "9:00 AM" -> "09:00")
    let startHour = 0;
    let startMinute = 0;
    
    try {
      const timeRegex = /(\d+):(\d+)\s*(AM|PM)/i;
      const match = timeSlot.match(timeRegex);
      
      if (!match) {
        return NextResponse.json({ 
          error: 'Invalid time format. Expected format: "9:00 AM"' 
        }, { status: 400 });
      }
      
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3].toUpperCase();
      
      // Convert to 24-hour format
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      startHour = hours;
      startMinute = minutes;
    } catch (error) {
      console.error('Error parsing time slot:', error);
      return NextResponse.json({ 
        error: 'Failed to parse time slot' 
      }, { status: 400 });
    }
    
    // Create date object with the correct time
    const walkDateTime = new Date(date);
    walkDateTime.setHours(startHour, startMinute, 0, 0);
    
    console.log('Booking date and time:', walkDateTime);
    
    // Check if this time slot is already booked
    const existingWalk = await prisma.walk.findFirst({
      where: {
        walkerId: assignedWalkerId,
        date: {
          gte: new Date(walkDateTime.getTime() - 60 * 60 * 1000), // 1 hour before
          lt: new Date(walkDateTime.getTime() + 60 * 60 * 1000)   // 1 hour after
        },
        status: {
          in: ['scheduled', 'in-progress']
        }
      }
    });
    
    if (existingWalk) {
      return NextResponse.json({ 
        error: 'This time slot is already booked with this walker' 
      }, { status: 400 });
    }
    
    // Check if owner has active subscription with credits
    const activeSubscription = await prisma.userSubscription.findFirst({
      where: {
        OR: [
          { userId: ownerId },
          { userId: dog.ownerId } // In case ownerId and dog.ownerId differ
        ],
        status: 'active',
        endDate: {
          gte: new Date()
        },
        creditsRemaining: {
          gt: 0
        }
      }
    });
    
    if (!activeSubscription) {
      return NextResponse.json({ 
        error: 'No active subscription with available credits found' 
      }, { status: 400 });
    }
    
    console.log('Active subscription found:', { 
      id: activeSubscription.id, 
      credits: activeSubscription.creditsRemaining 
    });
    
    // All checks passed, create the walk
    const newWalk = await prisma.walk.create({
      data: {
        id: uuidv4(),
        date: walkDateTime,
        duration: 60, // 60 minutes walk
        status: 'scheduled',
        dogId: dogId,
        walkerId: assignedWalkerId,
        notes: notes || '',
        startTime: format(walkDateTime, 'HH:mm'),
        timeSlot: timeSlot,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Deduct a credit from the subscription
    await prisma.userSubscription.update({
      where: {
        id: activeSubscription.id
      },
      data: {
        creditsRemaining: {
          decrement: 1
        },
        updatedAt: new Date()
      }
    });
    
    // Return the new walk
    return NextResponse.json({
      success: true,
      walk: newWalk,
      message: 'Walk scheduled successfully'
    });
    
  } catch (error) {
    console.error('Error creating walk booking:', error);
    return NextResponse.json({ 
      error: 'Failed to create walk booking', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 