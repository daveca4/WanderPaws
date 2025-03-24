import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
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
  const { walks, dogs, walkers, assessments } = useData();
  
  // Get stats based on user role
  let stats: StatItem[] = [];
  
  if (user?.role === 'walker') {
    // Get completed walks for this walker
    const completedWalks = walks.filter(walk => 
      walk.walkerId === user.profileId && 
      walk.status === 'completed'
    );
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
    // Get dogs for this owner
    const ownerDogs = dogs.filter(dog => 
      dog.ownerId === user.profileId
    );
    
    // Get upcoming walks for owner's dogs
    const today = new Date();
    const upcomingWalks = walks.filter(walk => {
      // Check if walk is for one of the owner's dogs
      if (!ownerDogs.some(dog => dog.id === walk.dogId)) return false;
      
      // Check if walk is scheduled
      if (walk.status !== 'scheduled') return false;
      
      // Check if walk is in the future
      const walkDate = new Date(walk.date);
      return walkDate >= today;
    });
    
    // Get all walks this month for the owner's dogs
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const walksThisMonth = walks.filter(walk => {
      // Check if walk is for one of the owner's dogs
      if (!ownerDogs.some(dog => dog.id === walk.dogId)) return false;
      
      // Check if walk was this month
      const walkDate = new Date(walk.date);
      return walkDate >= firstDayOfMonth;
    });
    
    stats = [
      { label: 'Active Dogs', value: ownerDogs.length },
      { label: 'Walks This Month', value: walksThisMonth.length },
      { label: 'Upcoming Walks', value: upcomingWalks.length },
    ];
  } else if (user?.role === 'admin') {
    // Pending assessments 
    const pendingAssessments = assessments.filter(assessment => 
      assessment.status === 'pending'
    );
    
    stats = [
      { label: 'Active Walkers', value: walkers.length },
      { label: 'Active Dogs', value: dogs.length },
      { 
        label: 'Pending Assessments', 
        value: pendingAssessments.length,
        highlight: pendingAssessments.length > 0,
        action: pendingAssessments.length > 0 ? {
          label: 'Review Assessments',
          href: '/admin/assessments'
        } : undefined
      },
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