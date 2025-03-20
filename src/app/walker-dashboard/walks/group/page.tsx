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
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Group Walks</h1>
        </div>
        <Link
          href="/walker-dashboard/walks?tab=group-walks"
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to All Group Walks
        </Link>
      </div>
      
      {/* Instructions Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-start mb-3">
          <div className="bg-blue-100 p-1.5 rounded-full mr-3 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-md font-semibold text-blue-800 mb-1">How to Manage Group Walks</h2>
            <p className="text-sm text-blue-700 mb-3">Follow these steps to efficiently manage multiple dogs in a group walk:</p>
          </div>
        </div>
        
        <ol className="list-decimal ml-12 text-sm text-blue-700 space-y-2">
          <li className="flex items-center">
            <span className="bg-blue-100 rounded-full w-5 h-5 mr-2 flex items-center justify-center text-xs font-bold text-blue-600">1</span>
            Dogs booked in the same time slot are grouped together
          </li>
          <li className="flex items-center">
            <span className="bg-blue-100 rounded-full w-5 h-5 mr-2 flex items-center justify-center text-xs font-bold text-blue-600">2</span>
            Mark each dog as "Picked Up" before starting the walk
          </li>
          <li className="flex items-center">
            <span className="bg-blue-100 rounded-full w-5 h-5 mr-2 flex items-center justify-center text-xs font-bold text-blue-600">3</span>
            You can mark dogs as "Absent" if they don't show up
          </li>
          <li className="flex items-center">
            <span className="bg-blue-100 rounded-full w-5 h-5 mr-2 flex items-center justify-center text-xs font-bold text-blue-600">4</span>
            All dogs must be picked up or marked absent before you can start the walk
          </li>
          <li className="flex items-center">
            <span className="bg-blue-100 rounded-full w-5 h-5 mr-2 flex items-center justify-center text-xs font-bold text-blue-600">5</span>
            After the walk, mark each dog as "Dropped Off"
          </li>
          <li className="flex items-center">
            <span className="bg-blue-100 rounded-full w-5 h-5 mr-2 flex items-center justify-center text-xs font-bold text-blue-600">6</span>
            All dogs must be dropped off or marked absent before you can end the walk
          </li>
        </ol>
      </div>
      
      {groupWalks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="p-4 bg-blue-50 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Group Walks Scheduled</h3>
            <p className="text-gray-500 max-w-md">
              Group walks require multiple dogs booked in the same time slot. Add more dogs to your schedule to create a group walk.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {groupWalks.map(session => {
            const sessionKey = `${session.date}_${session.startTime}_${session.timeSlot}`;
            const isExpanded = expandedGroups.has(sessionKey);
            
            return (
              <div key={sessionKey} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div 
                  className="px-6 py-4 cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors"
                  onClick={() => toggleGroupExpanded(sessionKey)}
                >
                  <div className="flex items-center">
                    <div className="mr-3 flex-shrink-0 bg-blue-100 text-blue-800 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm">
                      {session.dogs.length}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {formatDate(session.date)} at {formatTime(session.startTime)}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {session.dogs.length} dogs • {session.timeSlot} time slot
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      session.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {session.status === 'pending' ? 'Ready to Start' :
                       session.status === 'in_progress' ? 'In Progress' :
                       'Completed'}
                    </span>
                    <svg 
                      className={`ml-2 h-5 w-5 text-gray-500 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
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
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow-sm transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Start Group Walk
                          </button>
                        )}
                        
                        {session.status === 'in_progress' && (
                          <button
                            onClick={() => endGroupWalk(sessionKey)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            End Group Walk
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-medium text-gray-700">Dogs in this Group</h3>
                        <div className="text-sm text-gray-500 bg-gray-100 py-1 px-2 rounded-md">
                          {session.dogs.filter(d => d.walkStatus === 'picked_up').length} picked up
                          {session.dogs.filter(d => d.walkStatus === 'dropped_off').length > 0 && 
                            ` • ${session.dogs.filter(d => d.walkStatus === 'dropped_off').length} dropped off`
                          }
                          {session.dogs.filter(d => d.walkStatus === 'absent').length > 0 && 
                            ` • ${session.dogs.filter(d => d.walkStatus === 'absent').length} absent`
                          }
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {session.dogs.map(dog => (
                          <div key={dog.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-md hover:shadow-md transition-shadow bg-white">
                            <div className="flex items-center mb-3 sm:mb-0">
                              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0 border border-gray-200">
                                <Image
                                  src={dog.dog.imageUrl || 'https://via.placeholder.com/48'}
                                  alt={dog.dog.name}
                                  width={56}
                                  height={56}
                                  className="object-cover"
                                />
                              </div>
                              
                              <div className="ml-4">
                                <p className="font-medium text-gray-900">{dog.dog.name}</p>
                                <p className="text-sm text-gray-500">{dog.dog.breed} • {dog.dog.size}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col space-y-3 w-full sm:w-auto">
                              <span className={`self-start sm:self-auto sm:mr-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
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
                              
                              {session.status !== 'completed' && (
                                <div className="grid grid-cols-2 gap-2 sm:flex sm:space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDogStatusChange(sessionKey, dog.id, 'pending')}
                                    className={`flex justify-center items-center px-3 py-1.5 text-xs rounded-md transition-colors ${
                                      dog.walkStatus === 'pending' 
                                        ? 'bg-gray-700 text-white shadow-inner' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Pending
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDogStatusChange(sessionKey, dog.id, 'picked_up')}
                                    className={`flex justify-center items-center px-3 py-1.5 text-xs rounded-md transition-colors ${
                                      dog.walkStatus === 'picked_up' 
                                        ? 'bg-blue-600 text-white shadow-inner' 
                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                    }`}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                    Picked Up
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDogStatusChange(sessionKey, dog.id, 'dropped_off')}
                                    className={`flex justify-center items-center px-3 py-1.5 text-xs rounded-md transition-colors ${
                                      dog.walkStatus === 'dropped_off' 
                                        ? 'bg-green-600 text-white shadow-inner' 
                                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                                    }`}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Dropped Off
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDogStatusChange(sessionKey, dog.id, 'absent')}
                                    className={`flex justify-center items-center px-3 py-1.5 text-xs rounded-md transition-colors ${
                                      dog.walkStatus === 'absent' 
                                        ? 'bg-red-600 text-white shadow-inner' 
                                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                                    }`}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Absent
                                  </button>
                                </div>
                              )}
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