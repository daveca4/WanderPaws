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
  hasHolidayRequest?: boolean;
  holidayStatus?: 'pending' | 'approved' | 'denied';
}

// Types for holiday requests
interface HolidayRequest {
  id: string;
  walkerId: string;
  date: string;
  status: 'pending' | 'approved' | 'denied';
  reason: string;
  createdAt?: string; // When the request was submitted
  updatedAt?: string; // When the request was last updated (approved/denied)
  adminNotes?: string; // Admin notes on the request
}

// Mock holiday requests data - in a real app, this would come from a database
const mockHolidayRequests: HolidayRequest[] = [
  { id: 'h1', walkerId: 'w1', date: '2025-06-05', status: 'approved', reason: 'Family vacation', updatedAt: '2025-05-20T14:30:00Z', adminNotes: 'Approved, coverage arranged' },
  { id: 'h2', walkerId: 'w1', date: '2025-06-15', status: 'pending', reason: 'Doctor appointment', createdAt: '2025-05-25T10:15:00Z' },
  { id: 'h3', walkerId: 'w1', date: '2025-06-25', status: 'denied', reason: 'Personal day', updatedAt: '2025-05-22T09:45:00Z', adminNotes: 'Denied due to high demand' },
  { id: 'h4', walkerId: 'w2', date: '2025-06-10', status: 'pending', reason: 'Wedding attendance', createdAt: '2025-05-26T16:20:00Z' },
  { id: 'h5', walkerId: 'w2', date: '2025-07-04', status: 'approved', reason: 'Independence Day', updatedAt: '2025-06-01T11:10:00Z' },
  { id: 'h6', walkerId: 'w3', date: '2025-06-30', status: 'pending', reason: 'Family emergency', createdAt: '2025-06-02T08:45:00Z' },
];

export default function WalkerSchedulePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1)); // Starting with June 2025 for mock data
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('month'); // Add calendar view state
  const [holidayRequests, setHolidayRequests] = useState<HolidayRequest[]>(mockHolidayRequests);
  const [showHolidayRequestForm, setShowHolidayRequestForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');

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

  // Get walker's holiday requests
  const walkerHolidayRequests = holidayRequests.filter(req => req.walkerId === walkerId);

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

  // Check if a date has multiple walks at the same time (group walks)
  const hasGroupWalks = (walksForDay: Walk[]) => {
    const walksByTime: Record<string, number> = {};
    walksForDay.forEach(walk => {
      const timeKey = `${walk.startTime}_${walk.timeSlot}`;
      walksByTime[timeKey] = (walksByTime[timeKey] || 0) + 1;
    });
    return Object.values(walksByTime).some(count => count > 1);
  };

  // Function to determine if a walk is a group walk
  const isGroupWalk = (walk: Walk, allWalks: Walk[]) => {
    const sameTimeSlotWalks = allWalks.filter(w => 
      w.startTime === walk.startTime && 
      w.timeSlot === walk.timeSlot && 
      w.date === walk.date
    );
    return sameTimeSlotWalks.length > 1;
  };

  // Function to determine holiday status for a date
  const getHolidayForDate = (dateString: string): HolidayRequest | undefined => {
    return walkerHolidayRequests.find(h => h.date === dateString);
  };

  // Function to get color styling based on holiday status
  const getHolidayStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return "bg-green-100 text-green-800 border-green-200";
      case 'denied':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200"; // pending
    }
  };

  // Function to determine walk styling based on type
  const getWalkStyle = (walk: Walk, allWalks: Walk[]) => {
    if (isGroupWalk(walk, allWalks)) {
      return "bg-blue-100 text-blue-800 border-blue-200"; // Group walks
    }
    
    // For mocking purposes, let's add some variety
    if (walk.id.includes('1') || walk.id.includes('5')) {
      return "bg-primary-100 text-primary-800 border-primary-200"; // Regular walks
    } else if (walk.id.includes('2') || walk.id.includes('7')) {
      return "bg-purple-100 text-purple-800 border-purple-200"; // Special walks
    } else if (walk.id.includes('3')) {
      return "bg-red-100 text-red-800 border-red-200"; // Holidays
    } else {
      return "bg-amber-100 text-amber-800 border-amber-200"; // Time off/other
    }
  };

  // Handle date navigation for all views
  const goToNext = () => {
    if (calendarView === 'day') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
    } else if (calendarView === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const goToPrev = () => {
    if (calendarView === 'day') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
    } else if (calendarView === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const goToToday = () => {
    // For demo purposes, we'll stay in 2025 to show the mock data
    setCurrentDate(new Date(2025, 5, 1));
  };

  // Get the week range for the week view
  const getWeekRange = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day); // Set to the first day of the current week (Sunday)
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6); // Set to the last day of the current week (Saturday)
    
    return { startOfWeek, endOfWeek };
  };

  // Get display format for each view type
  const getViewTitleDisplay = () => {
    if (calendarView === 'day') {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
    } else if (calendarView === 'week') {
      const { startOfWeek, endOfWeek } = getWeekRange();
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
  };

  // Get walks for a specific date
  const getWalksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return walksByDate[dateString] || [];
  };
  
  // Get holiday request for a specific date
  const getHolidayRequestForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return getHolidayForDate(dateString) || undefined;
  };

  // Generate day view data - walks organized by hour
  const getDayViewData = () => {
    const walksForDay = getWalksForDate(currentDate);
    const holidayRequest = getHolidayRequestForDate(currentDate);
    
    // Group walks by hour
    const walksByHour: Record<number, Walk[]> = {};
    walksForDay.forEach(walk => {
      const hour = parseInt(walk.startTime.split(':')[0]);
      if (!walksByHour[hour]) {
        walksByHour[hour] = [];
      }
      walksByHour[hour].push(walk);
    });
    
    // Create time slots from 6am to 9pm
    const timeSlots = [];
    for (let hour = 6; hour <= 21; hour++) {
      timeSlots.push({
        hour,
        timeDisplay: `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 ? 'AM' : 'PM'}`,
        walks: walksByHour[hour] || []
      });
    }
    
    return { timeSlots, holidayRequest };
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    
    return `${endHours}:${endMinutes}`;
  };

  // Generate week view data - walks for each day of the week
  const getWeekViewData = () => {
    const { startOfWeek } = getWeekRange();
    
    // Create array of days in the week
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const walksForDay = walksByDate[dateString] || [];
      const holidayRequest = getHolidayForDate(dateString);
      
      weekDays.push({
        date,
        dateString,
        dayOfMonth: date.getDate(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        walks: walksForDay,
        hasHolidayRequest: !!holidayRequest,
        holidayStatus: holidayRequest?.status as ('pending' | 'approved' | 'denied' | undefined),
      });
    }
    
    return weekDays;
  };

  // Generate calendar weeks
  const getCalendarData = (): (CalendarDay | null)[][] => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
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
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dateString = date.toISOString().split('T')[0];
      const walksForDay = walksByDate[dateString] || [];
      
      // Check for holiday
      const holidayRequest = getHolidayForDate(dateString);
      
      calendarDays.push({
        date,
        dateString,
        walks: walksForDay,
        hasHolidayRequest: !!holidayRequest,
        holidayStatus: holidayRequest?.status as ('pending' | 'approved' | 'denied' | undefined),
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
  
  // Format the title based on view
  const currentViewTitle = getViewTitleDisplay();

  // Holiday request functions
  const openHolidayRequestForm = (date?: string) => {
    if (date) {
      setSelectedDate(date);
    } else {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
    setReason('');
    setShowHolidayRequestForm(true);
  };

  const closeHolidayRequestForm = () => {
    setShowHolidayRequestForm(false);
    setSelectedDate('');
    setReason('');
  };

  const submitHolidayRequest = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if date has walks scheduled
    if (walksByDate[selectedDate]?.length > 0) {
      alert("You cannot request time off for days with scheduled walks. Please reschedule your walks first.");
      return;
    }
    
    // Check if already requested
    if (walkerHolidayRequests.some(req => req.date === selectedDate)) {
      alert("You have already submitted a time off request for this date.");
      return;
    }
    
    // Create new request
    const newRequest: HolidayRequest = {
      id: `h${Date.now()}`,
      walkerId,
      date: selectedDate,
      status: 'pending',
      reason,
      createdAt: new Date().toISOString(),
    };
    
    // Add to holiday requests
    setHolidayRequests([...holidayRequests, newRequest]);
    closeHolidayRequestForm();
    
    // Show success message
    alert("Your time off request has been submitted successfully and is awaiting approval.");
  };

  const cancelHolidayRequest = (id: string) => {
    if (confirm("Are you sure you want to cancel this holiday request?")) {
      setHolidayRequests(holidayRequests.filter(req => req.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex">
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
              onClick={() => setActiveTab('holidays')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'holidays'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Time Off Requests
              {walkerHolidayRequests.some(h => h.status === 'pending') && (
                <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                  {walkerHolidayRequests.filter(h => h.status === 'pending').length}
                </span>
              )}
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'calendar' && (
            <div>
              {/* Calendar navigation and view controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{currentViewTitle}</h2>
                </div>
                <div className="flex justify-between items-center">
                  <div className="inline-flex rounded-md shadow-sm mr-4" role="group">
                    <button
                      onClick={() => setCalendarView('day')}
                      className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                        calendarView === 'day' 
                          ? 'bg-primary-50 text-primary-700 border-primary-300' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Day
                    </button>
                    <button
                      onClick={() => setCalendarView('week')}
                      className={`px-4 py-2 text-sm font-medium border-t border-b ${
                        calendarView === 'week' 
                          ? 'bg-primary-50 text-primary-700 border-primary-300' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setCalendarView('month')}
                      className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
                        calendarView === 'month' 
                          ? 'bg-primary-50 text-primary-700 border-primary-300' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Month
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={goToPrev}
                      className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button 
                      onClick={goToToday}
                      className="px-3 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      Today
                    </button>
                    <button 
                      onClick={goToNext}
                      className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Color coding legend */}
              <div className="flex flex-wrap gap-3 mb-4 bg-gray-50 p-3 rounded-md">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-primary-400 mr-1"></span>
                  <span className="text-xs text-gray-600">Individual Walks</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-blue-400 mr-1"></span>
                  <span className="text-xs text-gray-600">Group Walks</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-purple-400 mr-1"></span>
                  <span className="text-xs text-gray-600">Special Requests</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-amber-400 mr-1"></span>
                  <span className="text-xs text-gray-600">Pending Time Off</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-400 mr-1"></span>
                  <span className="text-xs text-gray-600">Approved Time Off</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-red-400 mr-1"></span>
                  <span className="text-xs text-gray-600">Denied Time Off</span>
                </div>
              </div>
              
              {/* Day View Calendar */}
              {calendarView === 'day' && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {(() => {
                    const { timeSlots, holidayRequest } = getDayViewData();
                    return (
                      <>
                        {holidayRequest && (
                          <div className={`p-3 ${
                            holidayRequest.status === 'approved' ? 'bg-green-50 border-green-200' :
                            holidayRequest.status === 'denied' ? 'bg-red-50 border-red-200' :
                            'bg-amber-50 border-amber-200'
                          } border-b`}>
                            <div className="flex items-center">
                              <span className={`inline-block h-2 w-2 rounded-full mr-2 ${
                                holidayRequest.status === 'approved' ? 'bg-green-500' :
                                holidayRequest.status === 'denied' ? 'bg-red-500' :
                                'bg-amber-500'
                              }`}></span>
                              <span className="text-sm font-medium">
                                Time Off Request {holidayRequest.status === 'approved' ? '(Approved)' : 
                                holidayRequest.status === 'denied' ? '(Denied)' : '(Pending)'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Reason: {holidayRequest.reason}</p>
                          </div>
                        )}
                        <div className="divide-y divide-gray-200">
                          {timeSlots.map(slot => (
                            <div key={slot.hour} className="flex min-h-[60px]">
                              <div className="w-20 py-2 px-2 bg-gray-50 flex-shrink-0 border-r border-gray-200">
                                <div className="text-xs font-medium text-gray-500">{slot.timeDisplay}</div>
                              </div>
                              <div className="flex-1 p-2 relative">
                                {slot.walks.length === 0 ? (
                                  <div className="h-full flex items-center justify-center">
                                    <span className="text-xs text-gray-400">No walks scheduled</span>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {slot.walks.map(walk => {
                                      const dog = getDogById(walk.dogId);
                                      return (
                                        <Link
                                          key={walk.id}
                                          href={`/walker-dashboard/walks/${walk.id}`}
                                          className={`block text-xs p-2 rounded border ${getWalkStyle(walk, slot.walks)} hover:opacity-80 transition-opacity`}
                                        >
                                          <div className="flex justify-between items-center">
                                            <div className="font-medium">{dog?.name || 'Walk'}</div>
                                            <div>{walk.duration} min</div>
                                          </div>
                                          <div className="text-xs mt-1 flex items-center">
                                            {dog?.breed} • {formatTime(walk.startTime)} - {formatTime(calculateEndTime(walk.startTime, walk.duration))}
                                            {isGroupWalk(walk, slot.walks) && (
                                              <span className="ml-1 text-xs">👥 Group</span>
                                            )}
                                          </div>
                                        </Link>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
              
              {/* Week View Calendar */}
              {calendarView === 'week' && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {getWeekViewData().map(day => (
                      <div key={day.dateString} className="px-2 py-3 text-center border-r border-gray-200 last:border-r-0">
                        <div className="text-xs text-gray-500">{day.dayName}</div>
                        <div className={`text-sm font-medium mt-1 ${
                          day.hasHolidayRequest ? 
                            day.holidayStatus === 'approved' ? 'text-green-600' : 
                            day.holidayStatus === 'denied' ? 'text-red-600' : 
                            'text-amber-600' 
                            : ''
                        }`}>
                          {day.dayOfMonth}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 divide-x divide-gray-200">
                    {getWeekViewData().map(day => (
                      <div 
                        key={day.dateString} 
                        className={`min-h-[300px] p-2 ${
                          day.hasHolidayRequest ? 
                            day.holidayStatus === 'approved' ? 'bg-green-50' : 
                            day.holidayStatus === 'denied' ? 'bg-red-50' : 
                            'bg-amber-50' 
                            : 'bg-white'
                        } ${
                          !day.walks.length && !day.hasHolidayRequest ? 'cursor-pointer hover:bg-gray-50' : ''
                        }`}
                        onClick={() => !day.walks.length && !day.hasHolidayRequest ? openHolidayRequestForm(day.dateString) : null}
                      >
                        {day.walks.length > 0 ? (
                          <div className="space-y-1">
                            {day.walks.map(walk => {
                              const dog = getDogById(walk.dogId);
                              return (
                                <Link
                                  key={walk.id}
                                  href={`/walker-dashboard/walks/${walk.id}`}
                                  className={`block text-xs p-1 rounded border ${getWalkStyle(walk, day.walks)} truncate hover:opacity-80 transition-opacity`}
                                >
                                  <div className="font-medium">{formatTime(walk.startTime)}</div>
                                  <div>{dog?.name || 'Walk'}</div>
                                  {isGroupWalk(walk, day.walks) && (
                                    <span className="text-xs">👥 Group</span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        ) : day.hasHolidayRequest ? (
                          <div className={`text-xs p-1 rounded border ${getHolidayStyle(day.holidayStatus || 'pending')} truncate`}>
                            {day.holidayStatus === 'approved' ? '✓ ' : day.holidayStatus === 'denied' ? '✗ ' : '⌛ '}
                            Time Off{day.holidayStatus === 'pending' ? ' (Pending)' : ''}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <span className="text-xs text-gray-400">Click to request time off</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Month View Calendar - keep existing markup but wrap in condition */}
              {calendarView === 'month' && (
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
                            } ${
                              day && !day.walks.length && !day.hasHolidayRequest ? 'cursor-pointer hover:bg-gray-50' : ''
                            }`}
                            onClick={() => day && !day.walks.length && !day.hasHolidayRequest ? openHolidayRequestForm(day.dateString) : null}
                          >
                            {day && (
                              <>
                                <div className="text-sm font-medium mb-2 flex justify-between items-center">
                                  <span className={day.hasHolidayRequest ? 
                                    day.holidayStatus === 'approved' ? 'text-green-600' : 
                                    day.holidayStatus === 'denied' ? 'text-red-600' : 
                                    'text-amber-600' 
                                    : ''
                                  }>
                                    {day.date.getDate()}
                                  </span>
                                  {day.hasHolidayRequest && (
                                    <span className={`inline-flex h-4 w-4 rounded-full ${
                                      day.holidayStatus === 'approved' ? 'bg-green-400' :
                                      day.holidayStatus === 'denied' ? 'bg-red-400' : 'bg-amber-400'
                                    }`}></span>
                                  )}
                                </div>
                                
                                {day.walks.length > 0 ? (
                                  <div className="space-y-1">
                                    {day.walks.map(walk => {
                                      const dog = getDogById(walk.dogId);
                                      return (
                                        <Link
                                          key={walk.id}
                                          href={`/walker-dashboard/walks/${walk.id}`}
                                          className={`block text-xs p-1 rounded border ${getWalkStyle(walk, day.walks)} truncate hover:opacity-80 transition-opacity`}
                                        >
                                          {formatTime(walk.startTime)} - {dog?.name || 'Walk'}
                                          {isGroupWalk(walk, day.walks) && (
                                            <span className="ml-1 text-xs">👥</span>
                                          )}
                                        </Link>
                                      );
                                    })}
                                  </div>
                                ) : day.hasHolidayRequest ? (
                                  <div className={`text-xs p-1 rounded border ${getHolidayStyle(day.holidayStatus || 'pending')} truncate`}>
                                    {day.holidayStatus === 'approved' ? '✓ ' : day.holidayStatus === 'denied' ? '✗ ' : '⌛ '}
                                    Time Off{day.holidayStatus === 'pending' ? ' (Pending)' : ''}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400">Click to request time off</div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'upcoming' && (
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
          )}
          
          {activeTab === 'holidays' && (
            <div>
              <div className="flex justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Time Off Requests</h2>
                <button
                  onClick={() => openHolidayRequestForm()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Request Time Off
                </button>
              </div>
              
              {walkerHolidayRequests.length === 0 ? (
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-gray-900 font-medium mb-2">No Time Off Requests</h3>
                  <p className="text-gray-500 mb-4">You haven't requested any time off yet.</p>
                  <button
                    onClick={() => openHolidayRequestForm()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Request Time Off
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {walkerHolidayRequests
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(request => (
                      <div 
                        key={request.id} 
                        className={`p-4 rounded-lg border ${
                          request.status === 'approved' ? 'border-green-200 bg-green-50' :
                          request.status === 'denied' ? 'border-red-200 bg-red-50' :
                          'border-amber-200 bg-amber-50'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                          <div>
                            <div className="flex items-center mb-1">
                              <span className={`inline-block h-2 w-2 rounded-full mr-2 ${
                                request.status === 'approved' ? 'bg-green-500' :
                                request.status === 'denied' ? 'bg-red-500' :
                                'bg-amber-500'
                              }`}></span>
                              <h3 className="font-medium text-gray-900">
                                {new Date(request.date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600">Reason: {request.reason}</p>
                            {request.status === 'pending' && (
                              <p className="text-xs text-amber-600 font-medium mt-1">Pending approval</p>
                            )}
                            {request.status === 'approved' && (
                              <p className="text-xs text-green-600 font-medium mt-1">Approved ✓</p>
                            )}
                            {request.status === 'denied' && (
                              <p className="text-xs text-red-600 font-medium mt-1">Denied ✗</p>
                            )}
                            {request.adminNotes && (
                              <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                                <span className="font-medium">Admin Note:</span> {request.adminNotes}
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 md:mt-0">
                            {request.status === 'pending' && (
                              <button
                                onClick={() => cancelHolidayRequest(request.id)}
                                className="text-sm text-gray-600 hover:text-red-600"
                              >
                                Cancel Request
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Holiday Request Modal */}
      {showHolidayRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Request Time Off</h2>
              <button 
                onClick={closeHolidayRequestForm}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={submitHolidayRequest}>
              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Time Off
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  placeholder="Please provide a reason for your time off request"
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeHolidayRequestForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 