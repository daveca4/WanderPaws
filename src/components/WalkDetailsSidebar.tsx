'use client';

import { Walk } from '@/lib/types';
import { format } from 'date-fns';
import Link from 'next/link';

export function WalkDetailsSidebar({ walk }: { walk: Walk }) {
  return (
    <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900">Walk Details</h2>
        <p className="mt-1 text-sm text-gray-500">Information about this walk</p>
      </div>
      
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
          <p className="mt-1 text-sm text-gray-900">
            {format(new Date(walk.date), 'EEEE, MMMM d, yyyy')}
          </p>
          <p className="text-sm text-gray-900">{walk.timeSlot}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500">Dog</h3>
          <div className="mt-1 flex items-center">
            {walk.dog?.profileImage ? (
              <img 
                src={walk.dog.profileImage} 
                alt={walk.dog.name}
                className="h-8 w-8 rounded-full mr-2"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                <span className="text-xs text-gray-500">🐾</span>
              </div>
            )}
            <span className="text-sm text-gray-900">
              {walk.dogName || walk.dog?.name || 'Unknown Dog'}
            </span>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500">Walker</h3>
          <div className="mt-1 flex items-center">
            {walk.walker?.profileImage ? (
              <img 
                src={walk.walker.profileImage} 
                alt={walk.walker.name}
                className="h-8 w-8 rounded-full mr-2"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                <span className="text-xs text-gray-500">👤</span>
              </div>
            )}
            <span className="text-sm text-gray-900">
              {walk.walkerName || walk.walker?.name || 'Unknown Walker'}
            </span>
          </div>
        </div>
        
        {walk.status === 'completed' && walk.metrics && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Walk Stats</h3>
            <div className="mt-2 grid grid-cols-3 gap-4 border-t border-b border-gray-200 py-3">
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">
                  {walk.metrics.distance ? `${walk.metrics.distance.toFixed(1)}` : '—'}
                </p>
                <p className="text-xs text-gray-500">kilometers</p>
              </div>
              <div className="text-center border-l border-r border-gray-200">
                <p className="text-lg font-medium text-gray-900">
                  {walk.metrics.duration ? `${Math.floor(walk.metrics.duration / 60)}` : '—'}
                </p>
                <p className="text-xs text-gray-500">minutes</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">
                  {walk.metrics.steps ? `${walk.metrics.steps}` : '—'}
                </p>
                <p className="text-xs text-gray-500">steps</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <Link 
          href="/owner-dashboard/walks"
          className="block w-full text-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Walks
        </Link>
      </div>
    </div>
  );
} 