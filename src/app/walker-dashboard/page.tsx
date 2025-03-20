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
import { mockWalks, mockDogs } from '@/lib/mockData';
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

// New component to display upcoming group walks
function UpcomingGroupWalks() {
  const { user } = useAuth();
  
  if (!user?.profileId) return null;
  
  // Find upcoming walks that are part of group walks (multiple dogs in same time slot)
  const upcomingWalks = mockWalks.filter(
    walk => walk.walkerId === user.profileId && walk.status === 'scheduled'
  );
  
  // Group by date and time slot
  const walksByTimeSlot: Record<string, typeof upcomingWalks> = {};
  
  upcomingWalks.forEach(walk => {
    const key = `${walk.date}_${walk.startTime}_${walk.timeSlot}`;
    if (!walksByTimeSlot[key]) {
      walksByTimeSlot[key] = [];
    }
    walksByTimeSlot[key].push(walk);
  });
  
  // Filter to only show groups with multiple dogs
  const groupWalks = Object.entries(walksByTimeSlot)
    .filter(([_, walks]) => walks.length > 1)
    .map(([key, walks]) => {
      const [date, timeRaw] = key.split('_');
      const time = timeRaw.split('_')[0]; // Extract just the time part
      return { date, time, count: walks.length };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3); // Show only the next 3 group walks
  
  if (groupWalks.length === 0) return null;
  
  return (
    <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-blue-800">
          <span className="inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Upcoming Group Walks
          </span>
        </h2>
      </div>
      
      <p className="text-blue-700 mb-4">
        You have {groupWalks.length} upcoming group walks scheduled. Remember to check in with each dog owner before the walk.
      </p>
      
      <div className="space-y-3">
        {groupWalks.map((group, index) => (
          <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
            <div>
              <p className="font-medium text-gray-900">{new Date(group.date).toLocaleDateString()} at {group.time}</p>
              <p className="text-sm text-gray-500">{group.count} dogs in this group</p>
            </div>
            
            <Link 
              href={`/walker-dashboard/walks/group?date=${group.date}&time=${group.time}&slot=AM`}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Manage Group
            </Link>
          </div>
        ))}
        
        <Link 
          href="/walker-dashboard/walks?tab=group-walks"
          className="block text-center text-sm text-blue-700 hover:text-blue-800 mt-2"
        >
          Manage All Group Walks
        </Link>
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
  
  // Get completed walks without feedback
  const completedWalks = getPastWalks(undefined, undefined, user.profileId);
  const needsFeedbackCount = completedWalks.filter(walk => !walk.feedback).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Walker Dashboard</h1>
        
        {needsFeedbackCount > 0 && (
          <Link 
            href="/walker-dashboard/walks?tab=needs-feedback"
            className="flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Provide Dog Feedback ({needsFeedbackCount})
          </Link>
        )}
      </div>
      
      {needsFeedbackCount > 0 && (
        <div className="bg-white border-l-4 border-amber-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Feedback Required</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>You have <strong>{needsFeedbackCount}</strong> completed walks that need your feedback. Providing feedback after walks helps owners track their dogs' progress and improves our service.</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Link
                    href="/walker-dashboard/walks?tab=needs-feedback"
                    className="bg-amber-100 px-2 py-1.5 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  >
                    View Walks Needing Feedback
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <DashboardSummary />
      
      <PendingFeedback />
      
      <UpcomingGroupWalks />
      
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