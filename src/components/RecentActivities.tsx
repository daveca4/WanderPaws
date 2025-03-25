import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { getPastWalks, formatDate, formatTime } from '@/utils/helpers';

export function RecentActivities() {
  const { user } = useAuth();
  const { walks, dogs, walkers } = useData();
  const walkerId = user?.profileId || undefined;
  const recentWalks = getPastWalks(walks, 5, walkerId);
  
  // Helper functions
  const getDogById = (id: string) => dogs.find(dog => dog.id === id);
  const getWalkerById = (id: string) => walkers.find(walker => walker.id === id);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
      
      {recentWalks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No recent activities</p>
        </div>
      ) : (
        <div className="space-y-6">
          {recentWalks.map((walk) => {
            const dog = getDogById(walk.dogId);
            const walker = getWalkerById(walk.walkerId);
            
            if (!dog || !walker) return null;
            
            return (
              <div key={walk.id} className="flex">
                <div className="mr-4 relative">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  {/* Connector line */}
                  <div className="absolute top-10 bottom-0 left-1/2 -ml-px w-0.5 bg-gray-200" />
                </div>
                
                <div className="flex-1 pb-6">
                  <div className="flex items-center mb-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {dog.name} completed a {walk.metrics?.distanceCovered ? walk.metrics.distanceCovered.toFixed(1) : '0'} km walk
                    </h3>
                    <span className="ml-auto text-xs text-gray-500">
                      {formatDate(walk.date)} at {formatTime(walk.startTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center mt-2 bg-gray-50 p-3 rounded-lg">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 relative flex-shrink-0">
                      <Image
                        src={dog.imageUrl || '/images/default-dog.png'}
                        alt={dog.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                    
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{walker.name}</span> noted: "{walk.notes || 'Great walk!'}"
                      </p>
                      
                      {walk.metrics && (
                        <div className="mt-1 flex items-center space-x-4">
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="mr-1">🕒</span>
                            <span>{walk.metrics.totalTime} min</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="mr-1">💩</span>
                            <span>{walk.metrics.poopCount}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="mr-1">💧</span>
                            <span>{walk.metrics.peeCount}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="mr-1">😊</span>
                            <span>{walk.metrics.moodRating}/5</span>
                          </div>
                        </div>
                      )}
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