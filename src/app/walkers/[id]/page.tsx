'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Walker } from '@/lib/types';

interface WalkerDetailPageProps {
  params: {
    id: string;
  };
}

export default function WalkerDetailPage({ params }: WalkerDetailPageProps) {
  const [walker, setWalker] = useState<Walker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWalker() {
      try {
        setLoading(true);
        const response = await fetch(`/api/data/walkers/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Walker not found');
          }
          throw new Error('Failed to fetch walker details');
        }
        
        const walkerData = await response.json();
        setWalker(walkerData);
      } catch (err) {
        console.error('Error fetching walker:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchWalker();
  }, [params.id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="w-full md:w-2/3 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-xl font-bold text-red-600">Error</h1>
        <p className="my-4">{error}</p>
        <Link 
          href="/walkers" 
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          Back to Walkers
        </Link>
      </div>
    );
  }

  if (!walker) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-xl font-bold text-red-600">Walker Not Found</h1>
        <p className="my-4">The walker you are looking for could not be found.</p>
        <Link 
          href="/walkers" 
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          Back to Walkers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link href="/walkers" className="text-primary-600 hover:text-primary-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Walkers
        </Link>
        <div className="flex space-x-2">
          <Link href={`/walkers/${walker.id}/edit`} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Edit Walker
          </Link>
          <Link href={`/walkers/${walker.id}/schedule`} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
            Schedule Walk
          </Link>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 p-6">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={walker.imageUrl || 'https://via.placeholder.com/400'}
                alt={walker.name}
                width={400}
                height={400}
                className="object-cover"
              />
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Contact Information</h3>
              <dl className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Email:</dt>
                  <dd className="text-sm text-gray-900">{walker.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Phone:</dt>
                  <dd className="text-sm text-gray-900">{walker.phone}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Preferred Dog Sizes</h3>
              <div className="mt-2 flex flex-wrap gap-1">
                {walker.preferredDogSizes.map((size) => (
                  <span key={size} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Certifications</h3>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                {walker.certificationsOrTraining.map((cert) => (
                  <li key={cert} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="md:col-span-2 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{walker.name}</h1>
                <div className="flex items-center mt-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg 
                        key={i} 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 ${i < Math.floor(walker.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Available
              </span>
            </div>
            
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900">About</h2>
              <p className="mt-2 text-gray-600">{walker.bio}</p>
            </div>
            
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900">Specialties</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {walker.specialties.map((specialty) => (
                  <span key={specialty} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900">Availability</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Object.entries(walker.availability).map(([day, slots]) => (
                  <div key={day} className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-medium text-gray-900 capitalize">{day}</h3>
                    <div className="mt-1 text-xs text-gray-600">
                      {slots.length > 0 ? (
                        slots.map((slot, index) => (
                          <div key={index}>
                            {slot.start} - {slot.end}
                          </div>
                        ))
                      ) : (
                        <span className="text-red-500">Not available</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 