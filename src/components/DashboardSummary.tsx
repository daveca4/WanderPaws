import { mockWalks, mockDogs, mockWalkers } from '@/lib/mockData';
import { mockUserSubscriptions } from '@/lib/mockSubscriptions';
import { getPendingAssessments } from '@/lib/mockAssessments';
import { useAuth } from '@/lib/AuthContext';
import { getPastWalks } from '@/utils/helpers';
import Link from 'next/link';

interface StatItem {
  label: string;
  value: number;
  highlight?: boolean;
  action?: {
    label: string;
    href: string;
  };
}

export function DashboardSummary() {
  const { user } = useAuth();
  
  // Get stats based on user role
  let stats: StatItem[] = [];
  
  if (user?.role === 'walker') {
    // Get completed walks that need feedback (no feedback property)
    const completedWalks = getPastWalks(undefined, undefined, user.profileId);
    const needsFeedback = completedWalks.filter(walk => !walk.feedback);
    
    stats = [
      { label: 'Total Completed Walks', value: completedWalks.length },
      { 
        label: 'Pending Feedback', 
        value: needsFeedback.length,
        highlight: needsFeedback.length > 0,
        action: needsFeedback.length > 0 ? {
          label: 'Provide Feedback',
          href: '/walker-dashboard/walks'
        } : undefined
      },
      // Add more stats as needed
    ];
  } else if (user?.role === 'owner') {
    stats = [
      { label: 'Active Dogs', value: 3 },
      { label: 'Walks This Month', value: 12 },
      { label: 'Upcoming Walks', value: 2 },
    ];
  } else if (user?.role === 'admin') {
    stats = [
      { label: 'Active Walkers', value: 12 },
      { label: 'Active Owners', value: 28 },
      { label: 'Walks Today', value: 15 },
    ];
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Summary</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="relative">
            <div className={`p-4 rounded-lg ${stat.highlight ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.highlight ? 'text-amber-700' : 'text-gray-900'}`}>{stat.value}</p>
              
              {stat.action && (
                <Link 
                  href={stat.action.href} 
                  className="mt-2 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {stat.action.label}
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
            
            {stat.highlight && (
              <span className="absolute top-0 right-0 transform -translate-y-1/3 translate-x-1/3">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                  {stat.value}
                </span>
              </span>
            )}
          </div>
        ))}
      </div>
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
    <div className="bg-white rounded-lg shadow p-3">
      <div className="flex items-center">
        <div className={`${color} p-2 rounded-full`}>
          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="text-base font-semibold text-gray-700">{value}</p>
        </div>
      </div>
    </div>
  );
} 