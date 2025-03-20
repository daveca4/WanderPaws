'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { mockWalks, mockDogs } from '@/lib/mockData';
import { Walk, Dog } from '@/lib/types';

// Function to format date
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Function to format time
const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return new Date(0, 0, 0, hours, minutes).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Function to get dog details by ID
const getDogById = (dogId: string): Dog | undefined => {
  return mockDogs.find(dog => dog.id === dogId);
};

interface DogWalkStatus {
  id: string;
  dogId: string;
  walkerId: string;
  date: string;
  startTime: string;
  timeSlot: 'AM' | 'PM';
  duration: number;
  dog: Dog;
  walkStatus: 'pending' | 'picked_up' | 'dropped_off' | 'absent';
  notes?: string;
}

interface GroupWalkSession {
  date: string;
  startTime: string;
  timeSlot: 'AM' | 'PM';
  dogs: DogWalkStatus[];
  status: 'pending' | 'in_progress' | 'completed';
}

export default function GroupWalksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [groupWalks, setGroupWalks] = useState<GroupWalkSession[]>([]);
  const [activeSession, setActiveSession] = useState<GroupWalkSession | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Redirect to the new location
  useEffect(() => {
    if (!loading) {
      // Preserve any query parameters
      const date = searchParams.get('date');
      const time = searchParams.get('time');
      const slot = searchParams.get('slot');
      
      let queryParams = '?tab=group-walks';
      if (date) queryParams += `&date=${date}`;
      if (time) queryParams += `&time=${time}`;
      if (slot) queryParams += `&slot=${slot}`;
      
      router.push(`/walker-dashboard/walks${queryParams}`);
    }
  }, [loading, router, searchParams]);

  // Group walks by date and time slot
  useEffect(() => {
    if (user?.profileId) {
      // Get all scheduled walks for this walker
      const walkerWalks = mockWalks.filter(
        walk => walk.walkerId === user.profileId && walk.status === 'scheduled'
      );
      
      // Group walks by date and time slot
      const walkGroups: Record<string, Record<string, Walk[]>> = {};
      
      walkerWalks.forEach(walk => {
        if (!walkGroups[walk.date]) {
          walkGroups[walk.date] = {};
        }
        
        const timeKey = `${walk.startTime}_${walk.timeSlot}`;
        if (!walkGroups[walk.date][timeKey]) {
          walkGroups[walk.date][timeKey] = [];
        }
        
        walkGroups[walk.date][timeKey].push(walk);
      });
      
      // Convert to group walk sessions
      const sessions: GroupWalkSession[] = [];
      
      Object.entries(walkGroups).forEach(([date, timeSlots]) => {
        Object.entries(timeSlots).forEach(([timeKey, walks]) => {
          // Only include time slots with multiple dogs
          if (walks.length > 1) {
            const [startTime, timeSlot] = timeKey.split('_') as [string, 'AM' | 'PM'];
            
            // Convert to dogs with status
            const dogsWithStatus = walks.map(walk => {
              const dog = getDogById(walk.dogId);
              if (!dog) throw new Error(`Dog not found: ${walk.dogId}`);
              
              return {
                ...walk,
                dog,
                walkStatus: 'pending' as const
              };
            });
            
            sessions.push({
              date,
              startTime,
              timeSlot,
              dogs: dogsWithStatus,
              status: 'pending'
            });
          }
        });
      });
      
      // Sort by date and time
      sessions.sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        
        const [aHours, aMinutes] = a.startTime.split(':').map(Number);
        const [bHours, bMinutes] = b.startTime.split(':').map(Number);
        
        const aMinutesTotal = aHours * 60 + aMinutes;
        const bMinutesTotal = bHours * 60 + bMinutes;
        
        return aMinutesTotal - bMinutesTotal;
      });
      
      setGroupWalks(sessions);
    }
  }, [user]);

  // Toggle a group's expanded state
  const toggleGroupExpanded = (sessionKey: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (newExpandedGroups.has(sessionKey)) {
      newExpandedGroups.delete(sessionKey);
    } else {
      newExpandedGroups.add(sessionKey);
    }
    setExpandedGroups(newExpandedGroups);
  };

  // Handle dog status change
  const handleDogStatusChange = (sessionKey: string, walkId: string, newStatus: 'pending' | 'picked_up' | 'dropped_off' | 'absent') => {
    setGroupWalks(prevGroups => 
      prevGroups.map(group => {
        if (`${group.date}_${group.startTime}_${group.timeSlot}` === sessionKey) {
          return {
            ...group,
            dogs: group.dogs.map(dog => {
              if (dog.id === walkId) {
                return { ...dog, walkStatus: newStatus };
              }
              return dog;
            })
          };
        }
        return group;
      })
    );
  };

  // Start a group walk
  const startGroupWalk = (sessionKey: string) => {
    setGroupWalks(prevGroups => 
      prevGroups.map(group => {
        if (`${group.date}_${group.startTime}_${group.timeSlot}` === sessionKey) {
          // Check if all dogs are picked up or absent
          const allReady = group.dogs.every(dog => dog.walkStatus === 'picked_up' || dog.walkStatus === 'absent');
          if (!allReady) {
            alert('All dogs must be picked up or marked as absent before starting the walk.');
            return group;
          }
          
          return {
            ...group,
            status: 'in_progress'
          };
        }
        return group;
      })
    );
  };

  // End a group walk
  const endGroupWalk = (sessionKey: string) => {
    setGroupWalks(prevGroups => 
      prevGroups.map(group => {
        if (`${group.date}_${group.startTime}_${group.timeSlot}` === sessionKey) {
          // Check if all dogs are dropped off or absent
          const allDroppedOff = group.dogs.every(dog => dog.walkStatus === 'dropped_off' || dog.walkStatus === 'absent');
          if (!allDroppedOff) {
            alert('All dogs must be dropped off or marked as absent before ending the walk.');
            return group;
          }
          
          return {
            ...group,
            status: 'completed'
          };
        }
        return group;
      })
    );
  };

  // Loading state while redirect happens
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );
} 