import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { getUpcomingWalks, getDogById, getWalkerById, formatDate, formatTime } from '@/utils/helpers';

export function UpcomingWalks() {
  const { user } = useAuth();
  const walkerId = user?.profileId || undefined;
  const walks = getUpcomingWalks(undefined, 5, walkerId); // Get next 5 upcoming walks for current walker
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Walks</h2>
        <Link href="/schedule" className="text-sm text-primary-600 hover:text-primary-700">
          View All
        </Link>
      </div>
      
      {walks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No upcoming walks scheduled</p>
        </div>
      ) : (
        <div className="space-y-4">
          {walks.map((walk) => {
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