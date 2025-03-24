import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { getUpcomingWalks, formatDate, formatTime } from '@/utils/helpers';
import { fetchDogs, fetchWalks, fetchWalkers } from '@/utils/dataHelpers';
import { Dog, Walker, Walk } from '@/lib/types';

export function UpcomingWalks() {
  const { user } = useAuth();
  const walkerId = user?.profileId || undefined;
  
  const [walks, setWalks] = useState<Walk[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch walks, dogs, and walkers
        const [walksData, dogsData, walkersData] = await Promise.all([
          fetchWalks(),
          fetchDogs(),
          fetchWalkers()
        ]);
        
        setWalks(walksData);
        setDogs(dogsData);
        setWalkers(walkersData);
      } catch (err) {
        setError('Error loading data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Filter to get 5 upcoming walks for the current walker
  const upcomingWalks = getUpcomingWalks(walks, 5, walkerId);
  
  // Helper functions to get dog and walker data
  const getDogById = (id: string): Dog | undefined => dogs.find(dog => dog.id === id);
  const getWalkerById = (id: string): Walker | undefined => walkers.find(walker => walker.id === id);
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Walks</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Walks</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500">Error loading walks. Please try again.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Walks</h2>
        <Link href="/schedule" className="text-sm text-primary-600 hover:text-primary-700">
          View All
        </Link>
      </div>
      
      {upcomingWalks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No upcoming walks scheduled</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingWalks.map((walk) => {
            const dog = getDogById(walk.dogId);
            const walker = getWalkerById(walk.walkerId);
            
            if (!dog || !walker) return null;
            
            return (
              <div key={walk.id} className="flex items-center border-b border-gray-100 pb-4 last:border-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                  <Image
                    src={dog.imageUrl || 'https://via.placeholder.com/48'}
                    alt={dog.name}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
                
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{dog.name}</p>
                      <p className="text-sm text-gray-500">with {walker.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatDate(walk.date)}</p>
                      <p className="text-sm text-gray-500">{formatTime(walk.startTime)} · {walk.duration} min</p>
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