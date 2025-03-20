import { Walk, Walker } from './types';
import { mockWalks } from './mockData';
import { generateId } from '@/utils/helpers';

// Constants
export const MAX_DOGS_PER_WALK = 6;
export const MAX_WALKS_PER_DAY = 2; // AM and PM slots

// Get bookings (walks) by owner ID
export function getBookingsByOwnerId(ownerId: string): Walk[] {
  // In a real app, we would query the database for walks associated with dogs owned by this owner
  // For the mock data, we'll assume ownerId is embedded in the walkId with a pattern like 'o1_walk1'
  return mockWalks.filter(walk => {
    // This is a simplified example - in a real app, we would have a proper relationship
    // between dogs and owners to make this query
    return walk.id.startsWith(ownerId) || walk.dogId.startsWith(ownerId);
  });
}

// Get booking by ID
export function getBookingById(bookingId: string): Walk | undefined {
  return mockWalks.find(walk => walk.id === bookingId);
}

// Get walks for a specific walker on a given date
export function getWalkerBookingsByDate(walkerId: string, date: string): Walk[] {
  return mockWalks.filter(walk => 
    walk.walkerId === walkerId && 
    walk.date === date && 
    walk.status === 'scheduled'
  );
}

// Check if walker is available on a given date and time slot
export function isWalkerAvailable(walkerId: string, date: string, timeSlot: 'AM' | 'PM'): boolean {
  // Get all scheduled walks for this walker on this date
  const walkerBookings = getWalkerBookingsByDate(walkerId, date);
  
  // Count how many dogs are already scheduled for this time slot
  const bookingsInTimeSlot = walkerBookings.filter(walk => walk.timeSlot === timeSlot);
  
  // Check if the walker has reached the maximum number of dogs for this time slot
  const dogsInTimeSlot = bookingsInTimeSlot.length;
  
  return dogsInTimeSlot < MAX_DOGS_PER_WALK;
}

// Get all available time slots for a walker on a given date
export function getAvailableTimeSlots(walkerId: string, date: string): ('AM' | 'PM')[] {
  const availableSlots: ('AM' | 'PM')[] = [];
  
  if (isWalkerAvailable(walkerId, date, 'AM')) {
    availableSlots.push('AM');
  }
  
  if (isWalkerAvailable(walkerId, date, 'PM')) {
    availableSlots.push('PM');
  }
  
  return availableSlots;
}

// Helper function to convert time slot to start time
export function getTimeFromTimeSlot(timeSlot: 'AM' | 'PM'): string {
  return timeSlot === 'AM' ? '09:00' : '14:00';
}

// Create a new booking
export function createBooking(booking: Omit<Walk, 'id'>): Walk {
  const newBooking: Walk = {
    id: generateId('walk'),
    ...booking
  };
  
  // In a real app, this would save to a database
  // For demo, we simulate adding to the mock data
  // mockWalks.push(newBooking);
  
  return newBooking;
}

// Update a booking
export function updateBooking(bookingId: string, updates: Partial<Walk>): Walk | undefined {
  const booking = getBookingById(bookingId);
  if (!booking) return undefined;
  
  // In a real app, this would update the database
  // For demo, just return the updated booking
  return {
    ...booking,
    ...updates
  };
}

// Cancel a booking
export function cancelBooking(bookingId: string): Walk | undefined {
  return updateBooking(bookingId, { status: 'cancelled' });
}

// Complete a booking
export function completeBooking(bookingId: string, metrics?: Walk['metrics'], feedback?: Walk['feedback']): Walk | undefined {
  return updateBooking(bookingId, { 
    status: 'completed',
    metrics,
    feedback
  });
} 