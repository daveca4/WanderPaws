'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { Dog } from '@/lib/types';

export default function WalkerDogsPage() {
  const { user, loading } = useAuth();
  const { dogs, walks } = useData();
  const router = useRouter();
  const [assignedDogs, setAssignedDogs] = useState<Dog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Redirect if not a walker or admin
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && user.role !== 'walker' && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, loading, router]);

  // Load assigned dogs
  useEffect(() => {
    if (user?.profileId && dogs.length > 0 && walks.length > 0) {
      // Filter dogs based on the current walker's assigned walks
      const walkerDogs = dogs.filter(dog => 
        walks.some(walk => 
          walk.dogId === dog.id && 
          walk.walkerId === user.profileId && 
          (walk.status === 'scheduled' || walk.status === 'completed')
        )
      );
      setAssignedDogs(walkerDogs);
      setDataLoading(false);
    } else if (dogs.length > 0 && walks.length > 0) {
      setDataLoading(false);
    }
  }, [user, dogs, walks]);

  // If loading or not walker/admin, show loading state
  if (loading || dataLoading || !user || (user.role !== 'walker' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Assigned Dogs</h1>
      
      {assignedDogs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-500">No dogs assigned to you yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedDogs.map(dog => (
            <Link key={dog.id} href={`/dogs/${dog.id}`} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 relative">
                <Image
                  src={dog.imageUrl || '/images/default-dog.png'}
                  alt={dog.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{dog.name}</h2>
                    <p className="text-sm text-gray-500">{dog.breed}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    dog.size === 'small' 
                      ? 'bg-blue-100 text-blue-800' 
                      : dog.size === 'medium' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {dog.size.charAt(0).toUpperCase() + dog.size.slice(1)}
                  </span>
                </div>
                
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-gray-500">Age:</p>
                    <p className="text-gray-900">{dog.age} years</p>
                    
                    <p className="text-gray-500">Walk time:</p>
                    <p className="text-gray-900">30 min</p>
                  </div>
                  
                  {dog.specialNeeds && dog.specialNeeds.length > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded-md">
                      <p className="text-xs font-medium text-yellow-800">Special needs:</p>
                      <ul className="mt-1 text-xs text-yellow-700 list-disc pl-4">
                        {dog.specialNeeds.map((need, index) => (
                          <li key={index}>{need}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 