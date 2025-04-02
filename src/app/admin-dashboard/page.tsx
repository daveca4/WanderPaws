'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
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

// Pending Assessments component
function PendingAssessments() {
  const { data = [], isPending } = useAdminPendingAssessments();
  const reviewAssessment = useReviewAssessment();
  
  const handleApprove = (assessmentId: string) => {
    reviewAssessment.mutate({ 
      assessmentId, 
      status: 'approved' 
    });
  };
  
  const handleReject = (assessmentId: string) => {
    reviewAssessment.mutate({ 
      assessmentId, 
      status: 'denied'
    });
  };
  
  if (isPending) {
    return <div className="animate-pulse bg-gray-100 h-64 rounded-lg"></div>;
  }
  
  const assessments = Array.isArray(data) ? data : [];
  
  if (assessments.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-amber-800">
          <span className="inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending Assessments
          </span>
        </h2>
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
          {assessments.length}
        </span>
      </div>
      
      <p className="text-amber-700 mb-4">
        Walker assessments awaiting your review
      </p>
      
      <div className="space-y-3">
        {assessments.map((assessment: Assessment) => (
          <div key={assessment.id} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="font-medium">{assessment.walker?.name || 'Walker'}</p>
                <p className="text-sm text-gray-500">Submitted: {format(new Date(assessment.createdAt), 'MMM d, yyyy')}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleApprove(assessment.id)}
                  disabled={reviewAssessment.isPending}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(assessment.id)}
                  disabled={reviewAssessment.isPending}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-700">
              <p><strong>Dog Types:</strong> {assessment.dogTypes.join(', ')}</p>
              <p><strong>Experience:</strong> {assessment.experience} years</p>
              {assessment.notes && <p className="mt-2">{assessment.notes}</p>}
            </div>
          </div>
        ))}
        
        {assessments.length > 3 && (
          <Link 
            href="/admin-dashboard/assessments"
            className="block text-center text-sm text-amber-700 hover:text-amber-800 mt-2"
          >
            View all {assessments.length} pending assessments
          </Link>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Use React Query hooks and provide fallback values that match the actual response structure
  const { 
    data: stats = { 
      totalUsers: 0, 
      totalWalkers: 0, 
      totalOwners: 0, 
      totalDogs: 0, 
      totalWalks: 0, 
      revenue: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        total: 0
      },
      activeWalks: 0,
      pendingAssessments: 0,
      recentSignups: 0
    }, 
    isPending: isLoadingStats 
  } = useAdminDashboardStats();

  // Redirect if not an admin
  useEffect(() => {
    if (!loading && user && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, loading, router]);
  
  // Loading state
  const isPending = loading || isLoadingStats;
  if (isPending || !user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminMetricsCard 
          title="Total Users"
          value={stats.totalUsers}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          color="blue"
        />
        
        <AdminMetricsCard 
          title="Total Walks"
          value={stats.totalWalks}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          }
          color="green"
        />
        
        <AdminMetricsCard 
          title="Active Walkers"
          value={stats.activeWalks || 0}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
          color="purple"
        />
        
        <AdminMetricsCard 
          title="Total Revenue"
          value={`$${stats.revenue?.total.toFixed(2) || '0.00'}`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="amber"
        />
      </div>
      
      <PendingAssessments />
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentUsers />
        <RecentWalks />
      </div>
    </div>
  );
} 