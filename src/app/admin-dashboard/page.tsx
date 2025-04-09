'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  useAdminDashboardStats,
  useAdminUsers,
  useAdminWalks,
  useAdminPendingAssessments,
} from '@/lib/hooks/useStandardizedAdminHooks';
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
  const { data, isPending } = useAdminUsers();
  
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

  const { data: stats = {} as AdminDashboardStats, isPending: statsLoading, error } = useAdminDashboardStats();

  // If loading, show loading state
  if (loading || statsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If user is not admin, redirect or show access denied
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

  // Handle error state
  if (error) {
     return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Error Loading Dashboard</h2>
        <p className="mt-2 text-gray-600">Could not load dashboard data. Please try again later.</p>
        <p className="mt-1 text-sm text-red-500">{error.message}</p>
        <button
          onClick={() => window.location.reload()} // Simple reload for now
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Reload Page
        </button>
      </div>
     )
  }

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin_dashboard' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <AdminMetricsCard title="Total Users" value={stats.totalUsers ?? 0} icon={<span>👥</span>} />
          <AdminMetricsCard title="Total Walks" value={stats.totalWalks ?? 0} icon={<span>🚶‍♀️</span>} color="green" />
          <AdminMetricsCard title="Pending Assessments" value={stats.pendingAssessments ?? 0} icon={<span>📝</span>} color="purple" />
          <AdminMetricsCard title="Monthly Revenue" value={`$${(stats.revenue?.monthly ?? 0).toFixed(2)}`} icon={<span>💰</span>} color="amber" />
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-1">
             <RecentUsers />
          </div>
          <div className="lg:col-span-1">
             <RecentWalks />
          </div>
           <div className="lg:col-span-1">
             <PendingAssessments />
           </div>
        </div>
      </div>
    </RouteGuard>
  );
} 