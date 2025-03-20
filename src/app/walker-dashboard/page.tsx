'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { DashboardSummary } from '@/components/DashboardSummary';
import { UpcomingWalks } from '@/components/UpcomingWalks';
import { DogList } from '@/components/DogList';
import { RecentActivities } from '@/components/RecentActivities';
import { AIRecommendations } from '@/components/AIRecommendations';
import { AssessmentList } from '@/components/AssessmentList';
import { getPastWalks } from '@/utils/helpers';
import Link from 'next/link';
import Image from 'next/image';

function PendingFeedback() {
  const { user } = useAuth();
  
  if (!user?.profileId) return null;
  
  // Get completed walks without feedback
  const completedWalks = getPastWalks(undefined, undefined, user.profileId);
  const pendingFeedback = completedWalks.filter(walk => !walk.feedback);
  
  if (pendingFeedback.length === 0) return null;
  
  return (
    <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-amber-800">
          <span className="inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Pending Feedback
          </span>
        </h2>
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
          {pendingFeedback.length}
        </span>
      </div>
      
      <p className="text-amber-700 mb-4">
        You have completed walks that require feedback. Please provide feedback to help owners track their dogs' progress.
      </p>
      
      <div className="space-y-3">
        {pendingFeedback.slice(0, 3).map(walk => (
          <div key={walk.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="mr-3">
                <p className="font-medium">{new Date(walk.date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-500">{walk.dogId}</p>
              </div>
            </div>
            
            <Link 
              href={`/walker-dashboard/walks/${walk.id}/feedback`}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700"
            >
              Provide Feedback
            </Link>
          </div>
        ))}
        
        {pendingFeedback.length > 3 && (
          <Link 
            href="/walker-dashboard/walks"
            className="block text-center text-sm text-amber-700 hover:text-amber-800 mt-2"
          >
            View all {pendingFeedback.length} walks needing feedback
          </Link>
        )}
      </div>
    </div>
  );
}

export default function WalkerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if not a walker or admin
  useEffect(() => {
    if (!loading && user && user.role !== 'walker' && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, loading, router]);

  // If loading or not walker/admin, show loading state
  if (loading || !user || (user.role !== 'walker' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Walker Dashboard</h1>
      
      <DashboardSummary />
      
      <PendingFeedback />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <UpcomingWalks />
          <RecentActivities />
        </div>
        
        {/* Sidebar content - 1/3 width on large screens */}
        <div className="space-y-6">
          <AssessmentList />
          <DogList />
          <AIRecommendations />
        </div>
      </div>
    </div>
  );
} 