import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { formatDate, formatTime } from '@/utils/helpers';
import { Dog, Walker, Walk } from '@/lib/types';

interface UpcomingWalksProps {
  userDogs?: Dog[];
}

export function UpcomingWalks({ userDogs }: UpcomingWalksProps) {
  const { user } = useAuth();
  const [upcomingWalks, setUpcomingWalks] = useState<Walk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch upcoming walks directly from the API
  useEffect(() => {
    const fetchUpcomingWalks = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        console.log('Fetching real walk data from API with user:', user.id, user.role);
        
        const response = await fetch('/api/walks/upcoming', {
          headers: {
            'user-id': user.id || '',
            'user-role': user.role || '',
            'user-profile-id': user.profileId || ''
          }
        });
        
        if (!response.ok) {
          console.error('API returned error status:', response.status);
          throw new Error(`Failed to fetch upcoming walks: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('REAL upcoming walks data from database:', data);
        setUpcomingWalks(data);
      } catch (err) {
        console.error('Error fetching real walks data:', err);
        setError('Failed to load upcoming walks');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUpcomingWalks();
  }, [user]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Walks</h2>
          <div className="animate-pulse h-4 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center border-b border-gray-100 pb-4">
              <div className="w-12 h-12 rounded-full bg-gray-200"></div>
              <div className="ml-4 flex-1">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-3 w-32 bg-gray-200 rounded"></div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Walks</h2>
        </div>
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-red-600 hover:underline"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Walks</h2>
        <Link href="/owner-dashboard/bookings" className="text-sm text-primary-600 hover:text-primary-700">
          View All
        </Link>
      </div>
      
      {upcomingWalks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No upcoming walks scheduled</p>
          <Link 
            href="/owner-dashboard/create-booking" 
            className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Book a Walk
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingWalks.map((walk) => {
            if (!walk.dog || !walk.walker) return null;
            
            return (
              <div key={walk.id} className="flex items-center border-b border-gray-100 pb-4 last:border-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                  <Image
                    src={walk.dog.imageUrl || '/images/default-dog.png'}
                    alt={walk.dog.name}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
                
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{walk.dog.name}</p>
                      <p className="text-sm text-gray-500">with {walk.walker.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatDate(walk.date)}</p>
                      <p className="text-sm text-gray-500">{walk.timeSlot === 'AM' ? 'Morning' : 'Afternoon'} · {walk.duration || 60} min</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 