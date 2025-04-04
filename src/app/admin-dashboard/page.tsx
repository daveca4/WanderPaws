'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  useAdminDashboardStats,
  useAllUsers,
  useAllWalkers, 
  useAllOwners,
  useAdminWalks,
  useAdminPendingAssessments,
  useUpdateUserRole,
  useReviewAssessment
} from '@/lib/hooks/useAdminHooks';
import Link from 'next/link';
import { format } from 'date-fns';
import { User, Walk, Assessment } from '@/lib/types';
import RouteGuard from '@/components/RouteGuard';
import PendingAssessments from '@/components/admin/PendingAssessments';

// Define interface for admin dashboard stats
interface AdminDashboardStats {
  totalUsers: number;
  totalWalks: number;
  totalDogs: number;
  pendingAssessments: number;
  recentSignups: number;
  activeWalks: number;
  revenue: {
    daily: number;
    weekly: number;
    monthly: number;
    total: number;
  };
}

interface AdminMetricsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'amber';
}

// AdminMetricsCard component for displaying statistics
function AdminMetricsCard({ title, value, icon, color = 'blue' }: AdminMetricsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    amber: 'bg-amber-100 text-amber-800',
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-center">
      <div className={`rounded-full w-12 h-12 flex items-center justify-center mr-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

// Recent Users component
function RecentUsers() {
  const { data, isPending } = useAllUsers();
  
  // Extract users array from response
  const users = Array.isArray(data) ? data : data?.users || [];
  
  if (isPending) {
    return <div className="animate-pulse bg-gray-100 h-64 rounded-lg"></div>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Users</h2>
        <Link 
          href="/admin-dashboard/users" 
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View All
        </Link>
      </div>
      
      <div className="space-y-4">
        {users.slice(0, 5).map((user: User) => (
          <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden mr-3">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.name || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-gray-600">
                    {(user.name || 'User').substring(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium">{user.name || 'Unknown User'}</p>
                <p className="text-sm text-gray-500">{user.role}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
              </p>
            </div>
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}

// Recent Walks component
function RecentWalks() {
  const { data, isPending } = useAdminWalks();
  
  // Extract walks array from response with safe access
  const walks = data?.walks || [];
  
  if (isPending) {
    return <div className="animate-pulse bg-gray-100 h-64 rounded-lg"></div>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Walks</h2>
        <Link 
          href="/admin-dashboard/walks" 
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View All
        </Link>
      </div>
      
      <div className="space-y-4">
        {walks.slice(0, 5).map((walk: Walk) => (
          <div key={walk.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">
                {format(new Date(walk.date), 'MMM d, yyyy')} ({walk.timeSlot})
              </p>
              <div className="flex text-sm text-gray-500">
                <span>Dog: {walk.dogName || walk.dog?.name || 'Unknown'}</span>
                <span className="mx-2">•</span>
                <span>Walker: {walk.walkerName || walk.walker?.name || 'Unknown'}</span>
              </div>
            </div>
            <div className="flex">
              <span 
                className={`px-2 py-1 text-xs rounded-full ${
                  walk.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : walk.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {walk.status}
              </span>
            </div>
          </div>
        ))}
        
        {walks.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No walks found
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const { data: stats = {} as AdminDashboardStats, isPending: statsLoading } = useAdminDashboardStats();
  
  // Initialize state values
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalWalks, setTotalWalks] = useState(0);
  const [revenue, setRevenue] = useState(0);
  
  // Process the stats data when it changes
  useEffect(() => {
    if (stats) {
      setTotalUsers((stats as AdminDashboardStats).totalUsers || 0);
      setTotalWalks((stats as AdminDashboardStats).totalWalks || 0);
      setRevenue((stats as AdminDashboardStats).revenue?.total || 0);
    }
  }, [stats]);
  
  // If loading, show loading state
  if (loading || statsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // If user is not admin, redirect
  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Go Home
        </button>
      </div>
    );
  }
  
  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin_dashboard' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          
          <div className="flex space-x-2">
            <Link 
              href="/admin-dashboard/analytics"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              View Analytics
            </Link>
            <Link 
              href="/admin-dashboard/settings"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Settings
            </Link>
          </div>
        </div>
        
        {/* Metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <AdminMetricsCard 
            title="Total Users"
            value={(stats as AdminDashboardStats).totalUsers || 0}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            color="blue"
          />
          
          <AdminMetricsCard 
            title="Total Walks"
            value={(stats as AdminDashboardStats).totalWalks || 0}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            }
            color="green"
          />
          
          <AdminMetricsCard 
            title="Total Revenue"
            value={`$${((stats as AdminDashboardStats).revenue?.total || 0).toFixed(2)}`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="amber"
          />
          
          <AdminMetricsCard 
            title="Pending Assessments"
            value={(stats as AdminDashboardStats).pendingAssessments || 0}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            color="purple"
          />
        </div>
        
        <div className="mt-8">
          <PendingAssessments />
        </div>
        
        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <RecentUsers />
          <RecentWalks />
        </div>
      </div>
    </RouteGuard>
  );
} 