import { mockWalks, mockDogs, mockWalkers } from '@/lib/mockData';
import { mockUserSubscriptions } from '@/lib/mockSubscriptions';
import { getPendingAssessments } from '@/lib/mockAssessments';

export function DashboardSummary() {
  // Count scheduled walks
  const scheduledWalks = mockWalks.filter(walk => walk.status === 'scheduled').length;
  
  // Count total dogs
  const totalDogs = mockDogs.length;
  
  // Count total walkers
  const totalWalkers = mockWalkers.length;
  
  // Calculate total walk distance in completed walks
  const totalDistance = mockWalks
    .filter(walk => walk.status === 'completed' && walk.metrics?.distanceCovered)
    .reduce((sum, walk) => sum + (walk.metrics?.distanceCovered || 0), 0);
  
  // Count active subscriptions
  const activeSubscriptions = mockUserSubscriptions.filter(sub => sub.status === 'active').length;
  
  // Count pending assessments
  const pendingAssessments = getPendingAssessments().length;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <SummaryCard 
        title="Scheduled Walks" 
        value={scheduledWalks.toString()} 
        icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        color="bg-blue-500"
      />
      <SummaryCard 
        title="Total Dogs" 
        value={totalDogs.toString()} 
        icon="M15 11a3 3 0 11-6 0 3 3 0 016 0z M3 15a6 6 0 1112 0 6 6 0 01-12 0z M5 15a4 4 0 108 0 4 4 0 00-8 0z"
        color="bg-yellow-500"
      />
      <SummaryCard 
        title="Total Walkers" 
        value={totalWalkers.toString()} 
        icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        color="bg-purple-500"
      />
      <SummaryCard 
        title="Distance Covered" 
        value={`${totalDistance.toFixed(1)} km`} 
        icon="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        color="bg-green-500"
      />
      <SummaryCard 
        title="Active Subscriptions" 
        value={activeSubscriptions.toString()} 
        icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        color="bg-pink-500"
      />
      <SummaryCard 
        title="Pending Assessments" 
        value={pendingAssessments.toString()} 
        icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        color="bg-orange-500"
      />
    </div>
  );
}

// Individual summary card component
function SummaryCard({ title, value, icon, color }: { 
  title: string; 
  value: string; 
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center">
        <div className={`${color} p-3 rounded-full`}>
          <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-lg font-semibold text-gray-700">{value}</p>
        </div>
      </div>
    </div>
  );
} 