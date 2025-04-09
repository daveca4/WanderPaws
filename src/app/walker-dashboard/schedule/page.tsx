'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
// import { useData } from '@/lib/DataContext'; // Remove useData
import {
  useWalkerSchedule,
  useWalkerHolidayRequests,
  useSubmitHolidayRequest,
  useCancelHolidayRequest
} from '@/lib/hooks/useStandardizedWalkerHooks';
import { formatDate, formatTime } from '@/utils/helpers'; // Keep necessary helpers
import { Walk, HolidayRequest, Dog } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
// import Modal from '@/components/ui/Modal'; // Modal component path might be incorrect or missing

interface CalendarDay {
  date: Date;
  dateString: string;
  walks: Walk[];
  holidayRequest?: HolidayRequest;
}

export default function WalkerSchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('month');
  const [showHolidayRequestForm, setShowHolidayRequestForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const walkerId = useMemo(() => user?.profileId || '', [user]);

  // --- Data Fetching with Standardized Hooks ---

  // Calculate date range based on view (simplified for now)
  const { startDate, endDate } = useMemo(() => {
    // TODO: Implement more precise date range calculation based on calendarView and currentDate
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return {
       startDate: start.toISOString().split('T')[0],
       endDate: end.toISOString().split('T')[0]
    };
  }, [currentDate]);

  // Fetch walks for the current view
  const { 
    data: scheduleData, 
    isPending: walksLoading, 
    error: walksError 
  } = useWalkerSchedule(walkerId, startDate, endDate); 
  const walks = scheduleData?.walks || [];

  // Fetch holiday requests
  const { 
    data: holidayRequests = [], 
    isPending: holidaysLoading, 
    error: holidaysError, 
    refetch: refetchHolidays 
  } = useWalkerHolidayRequests(walkerId);

  // --- Mutations ---
  const { 
    mutate: submitHoliday, 
    isPending: isSubmittingHoliday, 
    error: submitHolidayError 
  } = useSubmitHolidayRequest();
  
  const { 
    mutate: cancelHoliday, 
    isPending: isCancellingHoliday, 
    error: cancelHolidayError 
  } = useCancelHolidayRequest();

  // --- State and Logic ---

  const loading = authLoading || walksLoading || holidaysLoading;
  const dataError = walksError || holidaysError;
  const mutationError = submitHolidayError || cancelHolidayError;

  // Group walks by date (client-side)
  const walksByDate = useMemo(() => {
    return walks.reduce((acc, walk) => {
      const dateKey = walk.date.split('T')[0]; // Ensure date key format matches holiday request date format
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(walk);
      return acc;
    }, {} as Record<string, Walk[]>);
  }, [walks]);

  // Map holiday requests by date for quick lookup
  const holidaysByDate = useMemo(() => {
     return holidayRequests.reduce((acc, req) => {
       acc[req.date] = req;
       return acc;
     }, {} as Record<string, HolidayRequest>)
  }, [holidayRequests]);

  // Redirect if not a walker
  useEffect(() => {
    if (!authLoading && user && user.role !== 'walker') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  // Loading state
  if (loading && !dataError) { // Show loading only if no error
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner />
      </div>
    );
  }

  // --- Event Handlers ---

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
    setCurrentDate(new Date());
  };

  // Restore getWeekRange implementation
  const getWeekRange = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, etc.
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    return { startOfWeek, endOfWeek };
  };

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

  const getWalksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return walksByDate[dateString] || [];
  };

  const getHolidayRequestForDate = (date: Date): HolidayRequest | undefined => {
    const dateString = date.toISOString().split('T')[0];
    return holidaysByDate[dateString];
  };

  const getHolidayStyle = (status?: string) => { 
     switch (status) {
      case 'approved':
        return "bg-green-100 text-green-800 border-green-200";
      case 'denied':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200"; // pending
    }
  };
  const getWalkStyle = (walk: Walk, allWalks: Walk[]) => { 
     if (isGroupWalk(walk, allWalks)) {
      return "bg-blue-100 text-blue-800 border-blue-200"; // Group walks
    }
    // Basic style for now
    return "bg-primary-100 text-primary-800 border-primary-200";
  };
  const isGroupWalk = (walk: Walk, allWalks: Walk[]) => { 
     const sameTimeSlotWalks = allWalks.filter(w => 
      w.startTime === walk.startTime && 
      w.timeSlot === walk.timeSlot && 
      w.date === walk.date
    );
    return sameTimeSlotWalks.length > 1;
   };
  
  // Use walk.duration instead of durationMinutes
  const calculateEndTime = (startTime: string, duration: number): string => { 
    if (!startTime || typeof duration !== 'number') return '--:--'; // Basic validation
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    // Use UTC methods to avoid potential timezone issues if times are meant to be local but stored without TZ
    startDate.setUTCHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + duration * 60000);
    const endHours = endDate.getUTCHours().toString().padStart(2, '0');
    const endMinutes = endDate.getUTCMinutes().toString().padStart(2, '0');
    
    return `${endHours}:${endMinutes}`;
  };

  // Generate view data functions (getDayViewData, getWeekViewData, getCalendarData)
  // Need to be adapted to use holidaysByDate map
 const getDayViewData = () => {
    const walksForDay = getWalksForDate(currentDate);
    const holidayRequest = getHolidayRequestForDate(currentDate);
    
    const walksByHour: Record<number, Walk[]> = {};
    walksForDay.forEach(walk => {
      const hour = parseInt(walk.startTime.split(':')[0]);
      if (!walksByHour[hour]) walksByHour[hour] = [];
      walksByHour[hour].push(walk);
    });

    return { walksByHour, holidayRequest };
  };

  const getWeekViewData = () => {
    const { startOfWeek } = getWeekRange();
    const weekData: { date: Date; walks: Walk[]; holiday?: HolidayRequest }[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekData.push({
        date: day,
        walks: getWalksForDate(day),
        holiday: getHolidayRequestForDate(day),
      });
    }
    return weekData;
  };

  const getCalendarData = (): (CalendarDay | null)[][] => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon, ...
    const daysInMonth = lastDayOfMonth.getDate();

    const calendar: (CalendarDay | null)[][] = [];
    let dayCounter = 1;
    let week: (CalendarDay | null)[] = [];

    // Add padding for days before the 1st of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      week.push(null);
    }

    // Fill the calendar with actual days
    while (dayCounter <= daysInMonth) {
      const date = new Date(year, month, dayCounter);
      const dateString = date.toISOString().split('T')[0];
      week.push({
        date,
        dateString,
        walks: walksByDate[dateString] || [],
        holidayRequest: holidaysByDate[dateString],
      });

      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
      dayCounter++;
    }

    // Add padding for days after the last day of the month
    while (week.length > 0 && week.length < 7) {
      week.push(null);
    }
    if (week.length > 0) {
       calendar.push(week);
    }

    return calendar;
  };


  // --- Holiday Request Form Handlers ---
  const openHolidayRequestForm = (date?: string) => {
    setSelectedDate(date || new Date().toISOString().split('T')[0]);
    setReason('');
    setShowHolidayRequestForm(true);
    setFormError(null);
    setFormSuccess(null);
  };

  const closeHolidayRequestForm = () => {
    setShowHolidayRequestForm(false);
  };

  const handleHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !reason || !walkerId) {
      setFormError('Date and reason are required.');
      return;
    }
    setFormError(null);
    setFormSuccess(null);

    submitHoliday({ date: selectedDate, reason, walkerId }, {
      onSuccess: () => {
        setFormSuccess('Holiday request submitted successfully!');
        setShowHolidayRequestForm(false);
        // refetchHolidays(); // Invalidation should handle this via onSuccessQueryKey
      },
      onError: (err) => {
         setFormError(err instanceof Error ? err.message : 'Failed to submit request');
      }
    });
  };

  const handleCancelHoliday = async (id: string) => {
     if (!walkerId) return;
     cancelHoliday({ requestId: id, walkerId }, {
        onSuccess: () => {
           // Show temporary success message or rely on list update
        },
        onError: (err) => {
           // Show error message
           console.error("Failed to cancel request:", err);
           alert("Error cancelling request: " + (err instanceof Error ? err.message : 'Unknown error'));
        }
     });
  };

  // --- Render Logic ---

  const renderWalkItem = (walk: Walk, allWalksForDay: Walk[]): React.ReactNode => {
    const dogName = walk.dog?.name || 'Unknown Dog';
    const dogImage = walk.dog?.profileImage || '/default-dog.png';
    const endTime = calculateEndTime(walk.startTime, walk.duration);

    return (
      <Link href={`/walker-dashboard/walks/${walk.id}`} key={walk.id}>
        <div className={`p-2 rounded border ${getWalkStyle(walk, allWalksForDay)} mb-1 hover:shadow-md transition-shadow duration-200`}>
           <div className="flex items-center space-x-2">
              <Image src={dogImage} alt={dogName} width={24} height={24} className="rounded-full object-cover" /> 
              <div>
                 <p className="text-xs font-medium truncate">{dogName}</p>
                 <p className="text-xs opacity-80">{formatTime(walk.startTime)} - {formatTime(endTime)}</p> 
              </div>
           </div>
           {isGroupWalk(walk, allWalksForDay) && <span className="text-xs font-bold text-blue-600 block text-right">Group</span>}
        </div>
      </Link>
    );
  }

  const renderHolidayItem = (holiday: HolidayRequest): React.ReactNode => {
     return (
        <div key={holiday.id} className={`p-2 rounded border ${getHolidayStyle(holiday.status)} mb-1 flex justify-between items-center`}>
           <div>
              <p className="text-xs font-medium">Holiday Request</p>
              <p className="text-xs opacity-80">Status: {holiday.status}</p>
           </div>
           {holiday.status === 'pending' && (
              <button 
                 onClick={(e) => { e.stopPropagation(); handleCancelHoliday(holiday.id); }} // Prevent day click
                 disabled={isCancellingHoliday}
                 className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 p-1"
              >
                 Cancel
              </button>
           )}
        </div>
     );
  }

  const renderDayCell = (dayData: CalendarDay | null, index: number): React.ReactNode => {
     if (!dayData) {
        return <td key={`empty-${index}`} className="border p-1 h-28 bg-gray-50"></td>;
     }
     const { date, dateString, walks, holidayRequest } = dayData;
     const isToday = new Date().toDateString() === date.toDateString();

     return (
       <td 
         key={dateString} 
         className={`border p-1 h-28 align-top relative ${isToday ? 'bg-blue-50' : 'bg-white'} cursor-pointer hover:bg-gray-100`} // Add cursor/hover
         onClick={() => openHolidayRequestForm(dateString)} // Click day to request holiday
       >
         <span className={`text-xs font-semibold ${isToday ? 'text-primary-600' : 'text-gray-600'}`}>{date.getDate()}</span>
         <div className="mt-1 space-y-0.5 max-h-20 overflow-y-auto text-xs scrollbar-thin scrollbar-thumb-gray-300">
            {holidayRequest && renderHolidayItem(holidayRequest)}
            {walks.map(walk => renderWalkItem(walk, walks))} 
         </div>
       </td>
     );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
       {/* Header and View Controls */}
       <div className="flex flex-col sm:flex-row justify-between items-center">
         <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
         <div className="flex items-center space-x-2 mt-3 sm:mt-0">
           {/* View Type Buttons */}
           <div className="flex space-x-1 bg-gray-100 p-0.5 rounded-lg">
             <button onClick={() => setCalendarView('day')} className={`px-3 py-1 rounded-md text-sm ${calendarView === 'day' ? 'bg-white shadow text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>Day</button>
             <button onClick={() => setCalendarView('week')} className={`px-3 py-1 rounded-md text-sm ${calendarView === 'week' ? 'bg-white shadow text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>Week</button>
             <button onClick={() => setCalendarView('month')} className={`px-3 py-1 rounded-md text-sm ${calendarView === 'month' ? 'bg-white shadow text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>Month</button>
           </div>
           {/* Navigation Buttons */}
           <div className="flex items-center space-x-1">
             <button onClick={goToPrev} className="p-1 text-gray-500 hover:text-gray-700"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
             <button onClick={goToToday} className="px-3 py-1 text-sm text-primary-600 border border-primary-200 rounded-md hover:bg-primary-50">Today</button>
             <button onClick={goToNext} className="p-1 text-gray-500 hover:text-gray-700"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
           </div>
            {/* Holiday Request Button */}
            <button 
               onClick={() => openHolidayRequestForm()}
               className="ml-4 px-3 py-1.5 bg-amber-500 text-white text-sm rounded-md hover:bg-amber-600 shadow"
             >
               Request Time Off
             </button>
         </div>
       </div>

       {/* Display Current View Title */}
        <h2 className="text-lg font-semibold text-center text-gray-700">{getViewTitleDisplay()}</h2>

       {/* Error Display */}
       {dataError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
             <strong className="font-bold">Error!</strong>
             <span className="block sm:inline"> Failed to load schedule data: {dataError.message}</span>
          </div>
        )}
        {mutationError && (
           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-2" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {mutationError.message}</span>
           </div>
        )}

       {/* Calendar View Content */}
        {calendarView === 'month' && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
             <table className="w-full border-collapse">
               <thead>
                 <tr className="bg-gray-100 text-gray-600 text-xs font-semibold uppercase">
                   <th className="p-2 border">Sun</th>
                   <th className="p-2 border">Mon</th>
                   <th className="p-2 border">Tue</th>
                   <th className="p-2 border">Wed</th>
                   <th className="p-2 border">Thu</th>
                   <th className="p-2 border">Fri</th>
                   <th className="p-2 border">Sat</th>
                 </tr>
               </thead>
               <tbody>
                 {getCalendarData().map((week, i) => (
                   <tr key={`week-${i}`} className="text-center">
                     {week.map(renderDayCell)}
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}

        {/* TODO: Implement Day View and Week View rendering */}
         {calendarView === 'day' && (
            <div className="bg-white shadow-lg rounded-lg p-4">
               {/* Implement Day View Layout Here */}
               <p>Day View for {getViewTitleDisplay()} - Placeholder</p>
            </div>
         )}
         {calendarView === 'week' && (
            <div className="bg-white shadow-lg rounded-lg p-4">
                {/* Implement Week View Layout Here */}
               <p>Week View for {getViewTitleDisplay()} - Placeholder</p>
            </div>
         )}

       {/* Holiday Request Modal placeholder */}
       {showHolidayRequestForm && (
           <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
             <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full my-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Request Holiday/Time Off</h3>
                 <form onSubmit={handleHolidaySubmit} className="space-y-4">
                    <div>
                      <label htmlFor="holidayDate" className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        id="holidayDate"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason (Optional)</label>
                      <textarea
                        id="reason"
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      ></textarea>
                    </div>
                    {formError && <p className="text-sm text-red-600">{formError}</p>}
                    {formSuccess && <p className="text-sm text-green-600">{formSuccess}</p>}
                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={closeHolidayRequestForm}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingHoliday}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                      >
                        {isSubmittingHoliday ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
            </div>{/* Closing div for modal content */}
          </div>/* Closing div for modal overlay */
        )}

    </div> // Closing main page div
  );
} 