import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns';
import { Dog, Walker, Walk, Owner } from '@/lib/types';
import { mockDogs, mockOwners, mockWalkers, mockWalks } from '@/lib/mockData';

// Date formatting functions
export function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

export function formatTime(timeString: string): string {
  const [hour, minute] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

// Data retrieval functions
export function getDogById(id: string): Dog | undefined {
  return mockDogs.find(dog => dog.id === id);
}

export function getOwnerById(id: string): Owner | undefined {
  return mockOwners.find(owner => owner.id === id);
}

export function getWalkerById(id: string): Walker | undefined {
  return mockWalkers.find(walker => walker.id === id);
}

export function getWalkById(walkId: string): Walk | undefined {
  return mockWalks.find(walk => walk.id === walkId);
}

export function getOwnersByDogId(dogId: string): Owner | undefined {
  const dog = getDogById(dogId);
  if (!dog) return undefined;
  return getOwnerById(dog.ownerId);
}

export function getDogsByOwnerId(ownerId: string): Dog[] {
  return mockDogs.filter(dog => dog.ownerId === ownerId);
}

export function getUpcomingWalks(dogId?: string, limit?: number, walkerId?: string): Walk[] {
  // Get walks that are scheduled in the future
  const now = new Date();
  
  // Check if we're using mock data with future dates
  const isMockData = mockWalks.some(walk => {
    const walkDate = new Date(walk.date);
    return walkDate.getFullYear() > now.getFullYear();
  });
  
  // If using mock data with future dates in 2024, don't filter by date
  // This is a temporary fix for development only
  let walks = mockWalks.filter(walk => {
    if (isMockData) {
      return (
        walk.status === 'scheduled' && 
        (dogId ? walk.dogId === dogId : true) &&
        (walkerId ? walk.walkerId === walkerId : true)
      );
    } else {
      // Normal date filtering for real data
      const walkDate = parseISO(walk.date);
      return (
        walk.status === 'scheduled' && 
        walkDate >= now && 
        (dogId ? walk.dogId === dogId : true) &&
        (walkerId ? walk.walkerId === walkerId : true)
      );
    }
  });
  
  // Sort by date and time
  walks.sort((a, b) => {
    const dateCompare = parseISO(a.date).getTime() - parseISO(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    
    // If dates are the same, compare times
    const [aHours, aMinutes] = a.startTime.split(':').map(Number);
    const [bHours, bMinutes] = b.startTime.split(':').map(Number);
    
    const aMinutesTotal = aHours * 60 + aMinutes;
    const bMinutesTotal = bHours * 60 + bMinutes;
    
    return aMinutesTotal - bMinutesTotal;
  });
  
  // Limit results if specified
  if (limit && limit > 0) {
    walks = walks.slice(0, limit);
  }
  
  return walks;
}

export function getPastWalks(dogId?: string, limit?: number, walkerId?: string): Walk[] {
  // Get completed walks
  let walks = mockWalks.filter(walk => 
    walk.status === 'completed' && 
    (dogId ? walk.dogId === dogId : true) &&
    (walkerId ? walk.walkerId === walkerId : true)
  );
  
  // Sort by date and time, most recent first
  walks.sort((a, b) => {
    const dateCompare = parseISO(b.date).getTime() - parseISO(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    
    // If dates are the same, compare times
    const [aHours, aMinutes] = a.startTime.split(':').map(Number);
    const [bHours, bMinutes] = b.startTime.split(':').map(Number);
    
    const aMinutesTotal = aHours * 60 + aMinutes;
    const bMinutesTotal = bHours * 60 + bMinutes;
    
    return bMinutesTotal - aMinutesTotal;
  });
  
  // Limit results if specified
  if (limit && limit > 0) {
    walks = walks.slice(0, limit);
  }
  
  return walks;
}

// Generate a unique ID for new records
export function generateId(prefix: string): string {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}${timestamp}${random}`;
}

function getExistingIds(type: 'dog' | 'owner' | 'walker' | 'walk'): string[] {
  switch (type) {
    case 'dog':
      return mockDogs.map(d => d.id);
    case 'owner':
      return mockOwners.map(o => o.id);
    case 'walker':
      return mockWalkers.map(w => w.id);
    case 'walk':
      return mockWalks.map(w => w.id);
  }
} 