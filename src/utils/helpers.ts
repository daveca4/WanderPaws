import { format, isToday, isTomorrow, addDays, parseISO } from 'date-fns';
import { Dog, Owner, Walker, Walk } from '@/lib/types';

// Format a date string to a readable format
export const formatDate = (dateString: string): string => {
  const date = parseISO(dateString);
  return format(date, 'MMMM d, yyyy');
};

// Format a time string to a readable format with AM/PM
export const formatTime = (timeString: string): string => {
  // Assuming timeString is in format "HH:MM:SS" or "HH:MM"
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${displayHour}:${minutes} ${suffix}`;
};

// Generate a unique ID with an optional prefix
export const generateId = (prefix: string = ''): string => {
  return `${prefix}${Math.random().toString(36).substring(2, 9)}`;
};

// These functions now expect to be given data rather than using mockData
export const getDogById = (dogs: Dog[], id: string): Dog | undefined => {
  return dogs.find(dog => dog.id === id);
};

export const getOwnerById = (owners: Owner[], id: string): Owner | undefined => {
  return owners.find(owner => owner.id === id);
};

export const getWalkerById = (walkers: Walker[], id: string): Walker | undefined => {
  return walkers.find(walker => walker.id === id);
};

export const getWalkById = (walks: Walk[], walkId: string): Walk | undefined => {
  return walks.find(walk => walk.id === walkId);
};

// Check if a date is in the past
export const isPastDate = (dateString: string): boolean => {
  const date = parseISO(dateString);
  return date < new Date();
};

export const getDogsByOwnerId = (dogs: Dog[], ownerId: string): Dog[] => {
  return dogs.filter(dog => dog.ownerId === ownerId);
};

export const getWalksByDateRange = (walks: Walk[], startDate: Date, endDate: Date): Walk[] => {
  // This function will filter walks by a date range
  return walks.filter(walk => {
    const walkDate = parseISO(walk.date);
    return walkDate >= startDate && walkDate <= endDate;
  });
};

// Get upcoming walks sorted by date
export const getUpcomingWalks = (walks: Walk[] = [], limit?: number, walkerId?: string): Walk[] => {
  const now = new Date();
  let filteredWalks = (walks || []).filter(walk => {
    const walkDate = parseISO(walk.date);
    return walkDate >= now && (!walkerId || walk.walkerId === walkerId);
  })
  .sort((a, b) => {
    const dateA = parseISO(a.date);
    const dateB = parseISO(b.date);
    return dateA.getTime() - dateB.getTime();
  });
  
  if (limit) {
    filteredWalks = filteredWalks.slice(0, limit);
  }
  
  return filteredWalks;
};

// Get past walks sorted by date, newest first
export const getPastWalks = (walks: Walk[] = [], limit?: number, walkerId?: string): Walk[] => {
  const now = new Date();
  let filteredWalks = (walks || [])
    .filter(walk => {
      const walkDate = parseISO(walk.date);
      return walkDate < now && (!walkerId || walk.walkerId === walkerId);
    })
    .sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
    
  if (limit) {
    filteredWalks = filteredWalks.slice(0, limit);
  }
  
  return filteredWalks;
};

// Get walks for a specific dog
export const getWalksByDogId = (walks: Walk[], dogId: string): Walk[] => {
  return walks.filter(walk => walk.dogId === dogId);
};

// Get walks for a specific walker
export const getWalksByWalkerId = (walks: Walk[], walkerId: string): Walk[] => {
  return walks.filter(walk => walk.walkerId === walkerId);
};

// Helper function to create a date with a specific time
export const createDateWithTime = (dateString: string, timeString: string): Date => {
  const date = parseISO(dateString);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  date.setHours(hours);
  date.setMinutes(minutes);
  
  return date;
};

// Get walks occurring on a specific date
export const getWalksByDate = (walks: Walk[], date: Date): Walk[] => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0); // Start of the day
  
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1); // Start of the next day
  
  return walks.filter(walk => {
    const walkDate = parseISO(walk.date);
    return walkDate >= targetDate && walkDate < nextDay;
  });
};

// Get all existing IDs of a certain type to avoid duplicates
export const getExistingIds = (array: { id: string }[]): string[] => {
  return array.map(item => item.id);
}; 