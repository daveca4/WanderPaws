'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import PermissionGate from './PermissionGate';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { useMessages } from '@/lib/MessageContext';
import { getPendingHolidayRequestsCount } from '@/lib/holidayRequestService';

// Helper function to get count of walks needing feedback
function getWalkerPendingFeedbackCount(walkerId: string, walks: any[]): number {
  if (!walkerId) return 0;
  
  return walks.filter(walk => 
    walk.walkerId === walkerId && 
    walk.status === 'completed' && 
    !walk.feedback
  ).length;
}

// Get count of real pending owner requests
async function getOwnerPendingRequestsCount(ownerId?: string) {
  // Return 0 until real API is implemented
  return 0;
}

// Get count of new dog profiles pending approval
async function getNewDogProfilesCount() {
  // Return 0 until real API is implemented
  return 0;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { walks } = useData();
  const { unreadCount } = useMessages();
  const [pendingHolidayCount, setPendingHolidayCount] = useState(0);
  
  // Fetch pending holiday requests count
  useEffect(() => {
    async function fetchPendingHolidayCount() {
      try {
        const count = await getPendingHolidayRequestsCount();
        setPendingHolidayCount(count);
      } catch (error) {
        console.error('Error fetching pending holiday count:', error);
      }
    }
    
    if (user?.role === 'admin') {
      fetchPendingHolidayCount();
    }
  }, [user?.role]);
  
  // Get pending feedback count for the current walker
  const pendingFeedbackCount = user?.role === 'walker' && user?.profileId 
    ? getWalkerPendingFeedbackCount(user.profileId, walks)
    : 0;
  
  // Common menu items that appear for all users
  const commonMenuItems = [
    { name: 'Dashboard', href: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { 
      name: 'Messages', 
      href: '/messages', 
      icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
      badge: unreadCount
    },
  ];
  
  // Admin-specific menu items
  const adminMenuItems = [
    { name: 'Dogs', href: '/dogs', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
    { name: 'Walkers', href: '/walkers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Owners', href: '/owners', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'Schedule', href: '/schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { 
      name: 'Holiday Requests', 
      href: '/admin/holiday-requests', 
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      badge: pendingHolidayCount
    },
    { name: 'Assessments', href: '/admin/assessments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Media Gallery', href: '/admin/media', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Content AI', href: '/admin/content-ai', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { name: 'AI Insights', href: '/admin/insights', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Marketing', href: '/admin/marketing', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
    { name: 'Reports', href: '/admin/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Settings', href: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];
  
  // Owner-specific menu items
  const ownerMenuItems = [
    { name: 'Dashboard', href: '/owner-dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'My Dogs', href: '/owner-dashboard/dogs', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
    { 
      name: 'Upcoming Walks', 
      href: '/owner-dashboard/walks', 
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      badge: getOwnerPendingRequestsCount(user?.profileId)
    },
    { name: 'My Walkers', href: '/owner-dashboard/walkers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Book a Walk', href: '/owner-dashboard/book', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Subscription', href: '/owner-dashboard/subscription', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Profile', href: '/owner-dashboard/profile', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];
  
  // Walker-specific menu items
  const walkerMenuItems = [
    { name: 'My Schedule', href: '/walker-dashboard/schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { 
      name: 'My Walks', 
      href: '/walker-dashboard/walks', 
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      badge: pendingFeedbackCount
    },
    { name: 'Assigned Dogs', href: '/walker-dashboard/dogs', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
    { name: 'Media Gallery', href: '/walker-dashboard/media', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Assessments', href: '/walker-dashboard/assessments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { name: 'Reports', href: '/walker-dashboard/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Profile', href: '/walker-dashboard/profile', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];
  
  // Render a menu item
  const renderMenuItem = (item: { name: string; href: string; icon: string; badge?: number }) => {
    const isActive = pathname === item.href;
    
    return (
      <Link
        href={item.href}
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
          isActive
            ? 'bg-primary-100 text-primary-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
        </svg>
        <span className="flex-1">{item.name}</span>
        
        {item.badge && item.badge > 0 && (
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 py-6 px-4 overflow-y-auto">
      <nav className="space-y-1">
        {/* Common menu items for all users */}
        {commonMenuItems.map(item => (
          <div key={item.href}>
            {renderMenuItem(item)}
          </div>
        ))}
        
        {/* Admin menu items - only show if the user's primary role is admin */}
        {user?.role === 'admin' && (
          <div className="pt-4 mt-4 border-t border-gray-100">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Admin
            </p>
            <div className="mt-3 space-y-1">
              {adminMenuItems.map(item => (
                <div key={item.href}>
                  {renderMenuItem(item)}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Owner menu items - only show if the user's primary role is owner */}
        {user?.role === 'owner' && (
          <div className="pt-4 mt-4 border-t border-gray-100">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Owner
            </p>
            <div className="mt-3 space-y-1">
              {ownerMenuItems.map(item => (
                <div key={item.href}>
                  {renderMenuItem(item)}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Walker menu items - only show if the user's primary role is walker */}
        {user?.role === 'walker' && (
          <div className="pt-4 mt-4 border-t border-gray-100">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Walker
            </p>
            <div className="mt-3 space-y-1">
              {walkerMenuItems.map(item => (
                <div key={item.href}>
                  {renderMenuItem(item)}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>
      
      <div className="mt-10 pt-6 border-t border-gray-200">
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Quick Actions
          </h3>
          
          {/* Quick action buttons based on role */}
          {user?.role === 'admin' && (
            <div className="mt-3">
              <Link href="/schedule/new" className="w-full flex items-center px-3 py-2 text-sm rounded-md text-white bg-primary-600 hover:bg-primary-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Schedule Walk
              </Link>
            </div>
          )}
          
          {user?.role === 'owner' && (
            <div className="mt-3">
              <Link href="/schedule/new" className="w-full flex items-center px-3 py-2 text-sm rounded-md text-white bg-primary-600 hover:bg-primary-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Book a Walk
              </Link>
            </div>
          )}
          
          {user?.role === 'walker' && (
            <div className="mt-3">
              <Link href="/walker-dashboard/schedule" className="w-full flex items-center px-3 py-2 text-sm rounded-md text-white bg-primary-600 hover:bg-primary-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Manage Walks
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 