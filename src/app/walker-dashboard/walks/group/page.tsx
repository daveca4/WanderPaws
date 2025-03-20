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
  
  // Get date, time, slot from URL if available
  const dateParam = searchParams.get('date');
  const timeParam = searchParams.get('time');
  const slotParam = searchParams.get('slot');
  
  const [groupWalks, setGroupWalks] = useState<GroupWalkSession[]>([]);
  const [activeSession, setActiveSession] = useState<GroupWalkSession | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Redirect if not a walker or admin
  useEffect(() => {
    if (!loading && user && user.role !== 'walker' && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, loading, router]);

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
      
      // If URL parameters are provided, expand the matching group
      if (dateParam && timeParam && slotParam) {
        const targetKey = `${dateParam}_${timeParam}_${slotParam}`;
        setExpandedGroups(new Set([targetKey]));
      }
    }
  }, [user, dateParam, timeParam, slotParam]);

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

  // If loading or not walker/admin, show loading state
  if (loading || !user || (user.role !== 'walker' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Group Walks</h1>
        <Link
          href="/walker-dashboard/walks?tab=group-walks"
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500"
        >
          Back to All Group Walks
        </Link>
      </div>
      
      {/* Instructions Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-md font-semibold text-blue-800 mb-2">How to Manage Group Walks</h2>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Dogs booked in the same time slot are grouped together</li>
          <li>Mark each dog as "Picked Up" before starting the walk</li>
          <li>You can mark dogs as "Absent" if they don't show up</li>
          <li>All dogs must be picked up or marked absent before you can start the walk</li>
          <li>After the walk, mark each dog as "Dropped Off"</li>
          <li>All dogs must be dropped off or marked absent before you can end the walk</li>
        </ol>
      </div>
      
      {groupWalks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500">No group walks scheduled. Group walks require multiple dogs booked in the same time slot.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupWalks.map(session => {
            const sessionKey = `${session.date}_${session.startTime}_${session.timeSlot}`;
            const isExpanded = expandedGroups.has(sessionKey);
            
            return (
              <div key={sessionKey} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div 
                  className="px-6 py-4 cursor-pointer flex justify-between items-center"
                  onClick={() => toggleGroupExpanded(sessionKey)}
                >
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {formatDate(session.date)} at {formatTime(session.startTime)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {session.dogs.length} dogs • {session.timeSlot} time slot
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      session.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {session.status === 'pending' ? 'Ready to Start' :
                       session.status === 'in_progress' ? 'In Progress' :
                       'Completed'}
                    </span>
                    <svg 
                      className={`ml-2 h-5 w-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {session.status === 'pending' && (
                          <button
                            onClick={() => startGroupWalk(sessionKey)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            Start Group Walk
                          </button>
                        )}
                        
                        {session.status === 'in_progress' && (
                          <button
                            onClick={() => endGroupWalk(sessionKey)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            End Group Walk
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-md font-medium text-gray-700 mb-4">Dogs in this Group</h3>
                      
                      <div className="space-y-4">
                        {session.dogs.map(dog => (
                          <div key={dog.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                            <div className="flex items-center">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                                <Image
                                  src={dog.dog.imageUrl || 'https://via.placeholder.com/48'}
                                  alt={dog.dog.name}
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                />
                              </div>
                              
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">{dog.dog.name}</p>
                                <p className="text-sm text-gray-500">{dog.dog.breed} • {dog.dog.size}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <span className={`mr-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                dog.walkStatus === 'pending' ? 'bg-gray-100 text-gray-800' :
                                dog.walkStatus === 'picked_up' ? 'bg-blue-100 text-blue-800' :
                                dog.walkStatus === 'dropped_off' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {dog.walkStatus === 'pending' ? 'Pending' :
                                 dog.walkStatus === 'picked_up' ? 'Picked Up' :
                                 dog.walkStatus === 'dropped_off' ? 'Dropped Off' :
                                 'Absent'}
                              </span>
                              
                              <select
                                value={dog.walkStatus}
                                onChange={(e) => handleDogStatusChange(
                                  sessionKey, 
                                  dog.id, 
                                  e.target.value as 'pending' | 'picked_up' | 'dropped_off' | 'absent'
                                )}
                                disabled={session.status === 'completed'}
                                className="block w-32 pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                              >
                                <option value="pending">Pending</option>
                                <option value="picked_up">Picked Up</option>
                                <option value="dropped_off">Dropped Off</option>
                                <option value="absent">Absent</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 