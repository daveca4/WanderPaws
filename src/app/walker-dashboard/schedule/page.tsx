'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getUpcomingWalks, formatDate, formatTime, getDogById } from '@/utils/helpers';
import { Walk } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';

interface CalendarDay {
  date: Date;
  dateString: string;
  walks: Walk[];
}

export default function WalkerSchedulePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('calendar');

  // Redirect if not a walker or admin
  useEffect(() => {
    if (!loading && user && user.role !== 'walker' && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, loading, router]);

  // If loading or not walker/admin, show loading state
  if (loading || !user || (user.role !== 'walker' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const walkerId = user.profileId;
  const upcomingWalks = getUpcomingWalks(undefined, undefined, walkerId);

  // Group walks by date
  const walksByDate = upcomingWalks.reduce((acc, walk) => {
    if (!acc[walk.date]) {
      acc[walk.date] = [];
    }
    acc[walk.date].push(walk);
    return acc;
  }, {} as Record<string, typeof upcomingWalks>);

  // Sort dates
  const sortedDates = Object.keys(walksByDate).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  // Generate calendar weeks
  const getCalendarData = (): (CalendarDay | null)[][] => {
    // Use June 2025 for the mock data
    const mockDataDate = new Date(2025, 5, 1); // June 2025 (month is 0-indexed)
    const firstDay = new Date(mockDataDate.getFullYear(), mockDataDate.getMonth(), 1);
    const lastDay = new Date(mockDataDate.getFullYear(), mockDataDate.getMonth() + 1, 0);
    
    // Get the day of the week of the first day (0 is Sunday, 1 is Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Create an array with dates for the calendar
    const calendarDays: (CalendarDay | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(mockDataDate.getFullYear(), mockDataDate.getMonth(), i);
      const dateString = date.toISOString().split('T')[0];
      const walksForDay = walksByDate[dateString] || [];
      
      calendarDays.push({
        date,
        dateString,
        walks: walksForDay
      });
    }
    
    // Group days into weeks
    const weeks: (CalendarDay | null)[][] = [];
    let week: (CalendarDay | null)[] = [];
    
    calendarDays.forEach((day, index) => {
      week.push(day);
      
      if (index % 7 === 6 || index === calendarDays.length - 1) {
        // Ensure week has 7 days by padding with null
        while (week.length < 7) {
          week.push(null);
        }
        weeks.push(week);
        week = [];
      }
    });
    
    return weeks;
  };

  const calendarWeeks = getCalendarData();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentMonth = 'June 2025';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'upcoming'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upcoming Walks
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'calendar'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Calendar View
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'upcoming' ? (
            <div>
              {sortedDates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No upcoming walks scheduled</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {sortedDates.map(date => (
                    <div key={date}>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {formatDate(date).split(',')[0]}
                      </h2>
                      
                      <div className="space-y-4">
                        {walksByDate[date].map(walk => {
                          const dog = getDogById(walk.dogId);
                          
                          if (!dog) return null;
                          
                          return (
                            <div key={walk.id} className="flex items-center p-4 rounded-lg border border-gray-100 hover:bg-gray-50">
                              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                                <Image
                                  src={dog.imageUrl || 'https://via.placeholder.com/56'}
                                  alt={dog.name}
                                  width={56}
                                  height={56}
                                  className="object-cover"
                                />
                              </div>
                              
                              <div className="ml-4 flex-1">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                  <div>
                                    <p className="font-medium text-gray-900">{dog.name}</p>
                                    <p className="text-sm text-gray-500">{dog.breed} • {dog.size}</p>
                                  </div>
                                  <div className="mt-2 sm:mt-0">
                                    <p className="font-medium text-gray-900">
                                      {formatTime(walk.startTime)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {walk.duration} minutes
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                  {dog.specialNeeds && dog.specialNeeds.length > 0 && (
                                    <div className="flex items-center mr-4">
                                      <span className="mr-1">⚠️</span>
                                      <span>Special needs</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center">
                                    <span className="mr-1">🦮</span>
                                    <span>
                                      {dog.walkingPreferences.preferredTimes.join(', ')} walker
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="ml-2">
                                <Link 
                                  href={`/walker-dashboard/walks/${walk.id}`}
                                  className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md"
                                >
                                  Details
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 text-center mb-4">{currentMonth}</h2>
              
              <div className="overflow-hidden rounded-lg border border-gray-200">
                {/* Calendar header with weekdays */}
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                  {weekDays.map(day => (
                    <div key={day} className="px-2 py-3 text-center text-sm font-medium text-gray-600">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar body */}
                <div>
                  {calendarWeeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
                      {week.map((day, dayIndex) => (
                        <div 
                          key={dayIndex} 
                          className={`min-h-[100px] p-2 border-r border-gray-200 last:border-r-0 ${
                            day ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          {day && (
                            <>
                              <div className="text-sm font-medium mb-2">
                                {day.date.getDate()}
                              </div>
                              
                              {day.walks.length > 0 ? (
                                <div className="space-y-1">
                                  {day.walks.map(walk => {
                                    const dog = getDogById(walk.dogId);
                                    return (
                                      <Link
                                        key={walk.id}
                                        href={`/walker-dashboard/walks/${walk.id}`}
                                        className="block text-xs p-1 rounded bg-primary-100 text-primary-800 truncate"
                                      >
                                        {formatTime(walk.startTime)} - {dog?.name || 'Walk'}
                                      </Link>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400">No walks</div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 