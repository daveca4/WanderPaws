'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PermissionGate from './PermissionGate';
import { useAuth } from '@/lib/AuthContext';
import { mockWalks } from '@/lib/mockData';

// Helper function to get count of walks needing feedback
function getWalkerPendingFeedbackCount(walkerId?: string): number {
  if (!walkerId) return 0;
  
  return mockWalks.filter(walk => 
    walk.walkerId === walkerId && 
    walk.status === 'completed' && 
    !walk.feedback
  ).length;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Common menu items that appear for all users
  const commonMenuItems = [
    { name: 'Dashboard', href: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  ];
  
  // Admin-specific menu items
  const adminMenuItems = [
    { name: 'Dogs', href: '/dogs', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
    { name: 'Walkers', href: '/walkers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Owners', href: '/owners', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'Schedule', href: '/schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Assessments', href: '/admin/assessments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'AI Insights', href: '/admin/insights', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Reports', href: '/admin/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Settings', href: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];
  
  // Owner-specific menu items
  const ownerMenuItems = [
    { name: 'My Dogs', href: '/owner-dashboard/dogs', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
    { name: 'My Subscriptions', href: '/owner-dashboard/subscriptions', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Upcoming Bookings', href: '/owner-dashboard/bookings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Walk History', href: '/owner-dashboard/history', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Dog Insights', href: '/owner-dashboard/insights', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Profile', href: '/owner-dashboard/profile', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];
  
  // Walker-specific menu items
  const walkerMenuItems = [
    { name: 'My Schedule', href: '/walker-dashboard/schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { 
      name: 'My Walks', 
      href: '/walker-dashboard/walks', 
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      badge: getWalkerPendingFeedbackCount(user?.profileId)
    },
    { name: 'Assigned Dogs', href: '/walker-dashboard/dogs', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
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
        {commonMenuItems.map(renderMenuItem)}
        
        {/* Admin menu items - only show if the user's primary role is admin */}
        {user?.role === 'admin' && (
          <div className="pt-4 mt-4 border-t border-gray-100">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Admin
            </p>
            <div className="mt-3 space-y-1">
              {adminMenuItems.map(renderMenuItem)}
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
              {ownerMenuItems.map(renderMenuItem)}
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
              {walkerMenuItems.map(renderMenuItem)}
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