'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Walker } from '@/lib/types';

export default function WalkersPage() {
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWalkers() {
      try {
        setLoading(true);
        const response = await fetch('/api/data/walkers');
        
        if (!response.ok) {
          throw new Error('Failed to fetch walkers');
        }
        
        const data = await response.json();
        setWalkers(data);
      } catch (err) {
        console.error('Error fetching walkers:', err);
        setError('Failed to load walkers. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchWalkers();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Walkers</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
              <div className="p-6">
                <div className="animate-pulse flex items-start">
                  <div className="rounded-full bg-gray-200 h-16 w-16"></div>
                  <div className="ml-4 flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Walkers</h1>
        </div>
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="text-red-500">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Walkers</h1>
        <Link href="/walkers/add" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Walker
        </Link>
      </div>
      
      {walkers.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg p-6 text-center">
          <p className="text-gray-500">No walkers found. Add a new walker to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {walkers.map((walker) => (
            <Link key={walker.id} href={`/walkers/${walker.id}`} className="block">
              <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 relative">
                        <Image
                          src={walker.imageUrl || 'https://via.placeholder.com/100'}
                          alt={walker.name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{walker.name}</h3>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i} 
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`h-4 w-4 ${i < Math.floor(walker.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                              viewBox="0 0 20 20" 
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-1 text-sm text-gray-600">{walker.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-600 line-clamp-2">
                    {walker.bio}
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Specialties</h4>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {walker.specialties.slice(0, 3).map((specialty) => (
                        <span key={specialty} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {specialty}
                        </span>
                      ))}
                      {walker.specialties.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          +{walker.specialties.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Available for bookings</span>
                    </div>
                    
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 