'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { DashboardSummary } from '@/components/DashboardSummary';
import { UpcomingWalks } from '@/components/UpcomingWalks';
import { RecentActivities } from '@/components/RecentActivities';
import { AIRecommendations } from '@/components/AIRecommendations';
import { mockUserSubscriptions } from '@/lib/mockSubscriptions';
import { getSubscriptionPlanById, formatPrice } from '@/lib/mockSubscriptions';
import { getPendingAssessments } from '@/lib/mockAssessments';
import { mockDogs, mockOwners } from '@/lib/mockData';
import { formatDate } from '@/utils/helpers';
import { Assessment, UserSubscription } from '@/lib/types';

// Helper functions to get objects by ID
const getDogById = (dogId: string) => {
  return mockDogs.find(dog => dog.id === dogId) || { name: 'Unknown dog', breed: 'Unknown' };
};

const getOwnerById = (ownerId: string) => {
  return mockOwners.find(owner => owner.id === ownerId) || { name: 'Unknown owner' };
};

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pendingAssessments, setPendingAssessments] = useState<Assessment[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState<UserSubscription[]>([]);

  useEffect(() => {
    // If user is not an admin, redirect to login page
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/login');
    }

    // Load pending assessments
    setPendingAssessments(getPendingAssessments());

    // Load active subscriptions
    setActiveSubscriptions(
      mockUserSubscriptions
        .filter(sub => sub.status === 'active')
        .slice(0, 5) // Only show top 5
    );
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      
      <DashboardSummary />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Assessments</h2>
            <Link href="/admin/assessments" className="text-sm text-primary-600 hover:text-primary-800">
              View All →
            </Link>
          </div>
          
          {pendingAssessments.length === 0 ? (
            <p className="text-gray-500">No pending assessments</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingAssessments.map((assessment) => {
                const dog = getDogById(assessment.dogId);
                const owner = getOwnerById(assessment.ownerId);
                return (
                  <div key={assessment.id} className="py-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{dog.name}</p>
                        <p className="text-sm text-gray-500">{dog.breed} • Owner: {owner.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          {assessment.status}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(assessment.createdDate)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex">
                      <Link 
                        href={`/admin/assessments/${assessment.id}`}
                        className="text-xs px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 mr-2"
                      >
                        Assign Walker
                      </Link>
                      <Link 
                        href={`/admin/assessments/${assessment.id}/schedule`}
                        className="text-xs px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                      >
                        Schedule
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Subscriptions</h2>
            <Link href="/admin/subscriptions" className="text-sm text-primary-600 hover:text-primary-800">
              View All →
            </Link>
          </div>
          
          {activeSubscriptions.length === 0 ? (
            <p className="text-gray-500">No active subscriptions</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {activeSubscriptions.map((subscription) => {
                const owner = getOwnerById(subscription.ownerId);
                const plan = getSubscriptionPlanById(subscription.planId);
                return (
                  <div key={subscription.id} className="py-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{owner.name}</p>
                        <p className="text-sm text-gray-500">{plan?.name || 'Unknown'} Plan • {subscription.creditsRemaining} credits left</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          Expires: {formatDate(subscription.endDate)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <span className="font-medium text-gray-700">
                        {formatPrice(subscription.purchaseAmount)}
                      </span> • Purchased {formatDate(subscription.purchaseDate)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UpcomingWalks />
        </div>
        <div>
          <AIRecommendations />
        </div>
      </div>
      
      <div className="mt-6">
        <RecentActivities />
      </div>
    </div>
  );
} 