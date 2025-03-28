'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { Dog, Assessment, UserSubscription } from '@/lib/types';
import { DashboardSummary } from '@/components/DashboardSummary';
import { UpcomingWalks } from '@/components/UpcomingWalks';
import { DogList } from '@/components/DogList';
import { RecentActivities } from '@/components/RecentActivities';
import { AIRecommendations } from '@/components/AIRecommendations';
import Link from 'next/link';

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { dogs, assessments, userSubscriptions, refreshData } = useData();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userDogs, setUserDogs] = useState<Dog[]>([]);
  const [userAssessments, setUserAssessments] = useState<Assessment[]>([]);
  const [hasApprovedAssessment, setHasApprovedAssessment] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  // Redirect if not an owner or admin
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'owner' && user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Force refresh of data to ensure we have the latest assessment status
        await refreshData();
        if (user && user.profileId) {
          // Get all dogs for this owner
          const ownerDogs = dogs.filter(dog => dog.ownerId === user.profileId);
          setUserDogs(ownerDogs);
          
          // Get assessments for this owner
          const ownerAssessments = assessments.filter(
            assessment => assessment.ownerId === user.profileId
          );
          setUserAssessments(ownerAssessments);
          
          // Check if dog has passed assessment (needed for subscription eligibility)
          const hasApproved = !!ownerDogs.find(dog => dog.assessmentStatus === 'approved');
          setHasApprovedAssessment(hasApproved);
          
          // Check subscription status if subscription data exists
          // Note: Subscription feature is not yet implemented, so we'll default to false
          setHasActiveSubscription(false);
          
          /* Uncomment when subscription endpoints are implemented
          const hasSub = userSubscriptions.some(sub => 
            sub.ownerId === user.profileId && 
            new Date(sub.endDate) > new Date()
          );
          setHasActiveSubscription(hasSub);
          */
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user && !authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  // If loading or not owner/admin, show loading state
  if (loading || !user || (user.role !== 'owner' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
      
      <DashboardSummary 
        dogs={userDogs}
        assessments={userAssessments}
        hasApprovedAssessment={hasApprovedAssessment}
        hasActiveSubscription={hasActiveSubscription}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <UpcomingWalks userDogs={userDogs} />
          <RecentActivities userAssessments={userAssessments} />
        </div>
        
        {/* Sidebar content - 1/3 width on large screens */}
        <div className="space-y-6">
          <DogList userDogs={userDogs} />
          <AIRecommendations userDogs={userDogs} />
          
          {/* Subscription Plans Card */}
          <div className="bg-white shadow rounded-lg border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Subscription Plans</h2>
            <p className="text-sm text-gray-500 mb-4">
              Choose a subscription plan to start booking regular walks for your dogs.
            </p>
            <Link
              href="/owner-dashboard/subscriptions"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 