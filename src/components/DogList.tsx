import Image from 'next/image';
import Link from 'next/link';
import { mockDogs, mockWalks } from '@/lib/mockData';
import { useAuth } from '@/lib/AuthContext';

export function DogList() {
  const { user } = useAuth();
  
  // Filter dogs based on the current walker's assigned walks
  const walkerDogs = user?.profileId ? 
    mockDogs.filter(dog => 
      mockWalks.some(walk => 
        walk.dogId === dog.id && 
        walk.walkerId === user.profileId && 
        (walk.status === 'scheduled' || walk.status === 'completed')
      )
    ) : [];
  
  // If no dogs are found, or we can't determine the walker, fall back to showing first 4 dogs
  const dogsToShow = walkerDogs.length > 0 ? walkerDogs.slice(0, 4) : mockDogs.slice(0, 4);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Dogs</h2>
        <Link href="/dogs" className="text-sm text-primary-600 hover:text-primary-700">
          View All
        </Link>
      </div>
      
      {dogsToShow.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No dogs assigned to you yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dogsToShow.map((dog) => (
            <Link key={dog.id} href={`/dogs/${dog.id}`} className="flex items-center p-3 rounded-lg hover:bg-gray-50">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                <Image
                  src={dog.imageUrl || 'https://via.placeholder.com/48'}
                  alt={dog.name}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              
              <div className="ml-4">
                <p className="font-medium text-gray-900">{dog.name}</p>
                <p className="text-sm text-gray-500">{dog.breed} · {dog.size}</p>
              </div>
              
              <div className="ml-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button className="w-full flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:text-primary-600 hover:border-primary-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add a Dog
        </button>
      </div>
    </div>
  );
} 