'use client';

import { Walk } from '@/lib/types';
import { format } from 'date-fns';

export function WalkStatusBar({ walk }: { walk: Walk }) {
  // Determine color based on status
  const getStatusColor = () => {
    switch (walk.status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Get status text
  const getStatusText = () => {
    switch (walk.status) {
      case 'scheduled':
        return 'Upcoming Walk';
      case 'completed':
        return 'Walk Completed';
      case 'cancelled':
        return 'Walk Cancelled';
      default:
        return 'Unknown Status';
    }
  };
  
  return (
    <div className={`flex items-center justify-between rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center">
        <div className="mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <div>
          <h2 className="font-medium">{getStatusText()}</h2>
          <p className="text-sm">
            {format(new Date(walk.date), 'MMM d, yyyy')} • {walk.timeSlot}
          </p>
        </div>
      </div>
      
      <div className="flex items-center">
        {walk.status === 'scheduled' && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white">
            <span className="animate-pulse mr-1.5 h-2 w-2 rounded-full bg-blue-600"></span>
            Scheduled
          </span>
        )}
        
        {walk.status === 'completed' && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Completed
          </span>
        )}
        
        {walk.status === 'cancelled' && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancelled
          </span>
        )}
      </div>
    </div>
  );
} 