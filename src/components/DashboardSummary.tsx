import { mockDogs, mockWalks, mockWalkers } from '@/lib/mockData';

export function DashboardSummary() {
  // Count scheduled walks
  const scheduledWalks = mockWalks.filter(walk => walk.status === 'scheduled').length;
  
  // Count total dogs
  const totalDogs = mockDogs.length;
  
  // Count total walkers
  const totalWalkers = mockWalkers.length;
  
  // Calculate total walk distance in completed walks
  const totalDistance = mockWalks.reduce((sum, walk) => {
    if (walk.status === 'completed' && walk.metrics) {
      return sum + walk.metrics.distanceCovered;
    }
    return sum;
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <SummaryCard 
        title="Scheduled Walks"
        value={scheduledWalks.toString()}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
        color="bg-primary-50 text-primary-700"
      />
      
      <SummaryCard 
        title="Total Dogs"
        value={totalDogs.toString()}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        }
        color="bg-blue-50 text-blue-700"
      />
      
      <SummaryCard 
        title="Walkers"
        value={totalWalkers.toString()}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
        color="bg-purple-50 text-purple-700"
      />
      
      <SummaryCard 
        title="Total Distance"
        value={`${totalDistance.toFixed(1)} km`}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        }
        color="bg-orange-50 text-orange-700"
      />
    </div>
  );
}

function SummaryCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`p-6 rounded-lg shadow-sm border border-gray-100 bg-white`}>
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
} 