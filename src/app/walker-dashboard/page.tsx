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