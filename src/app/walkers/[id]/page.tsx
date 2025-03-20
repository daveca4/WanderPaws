'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { mockWalkers } from '@/lib/mockData';
import { useAuth } from '@/lib/AuthContext';
import { TimeSlot } from '@/lib/types';

export default function WalkerDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [walker, setWalker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/auth/login');
      return;
    }

    // Fetch walker data
    const foundWalker = mockWalkers.find(w => w.id === params.id);
    if (foundWalker) {
      setWalker(foundWalker);
    }
    setLoading(false);
  }, [params.id, router, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!walker) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Walker not found. The walker may have been removed or you may have the wrong ID.
              </p>
            </div>
          </div>
        </div>
        <Link href="/walkers" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          Back to Walkers
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href="/walkers" className="mr-4 text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Walker Details</h1>
        </div>
        <div className="flex space-x-3">
          <Link 
            href={`/walkers/${params.id}/edit`} 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Walker
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row">
            <div className="flex-shrink-0 mb-4 md:mb-0">
              <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 relative">
                <Image
                  src={walker.imageUrl || 'https://via.placeholder.com/128'}
                  alt={walker.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            
            <div className="md:ml-6 flex-1">
              <div className="flex flex-col md:flex-row md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{walker.name}</h2>
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
                      <span className="ml-1 text-sm text-gray-600">{walker.rating.toFixed(1)} ({walker.reviews || 0} reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {walker.status || 'Active'}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Bio</h3>
                <p className="mt-2 text-gray-600">{walker.bio}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              <dl className="mt-2 space-y-3">
                <div className="flex">
                  <dt className="text-sm font-medium text-gray-500 w-24">Email:</dt>
                  <dd className="text-sm text-gray-900">{walker.email || 'Not provided'}</dd>
                </div>
                <div className="flex">
                  <dt className="text-sm font-medium text-gray-500 w-24">Phone:</dt>
                  <dd className="text-sm text-gray-900">{walker.phone || 'Not provided'}</dd>
                </div>
                <div className="flex">
                  <dt className="text-sm font-medium text-gray-500 w-24">Location:</dt>
                  <dd className="text-sm text-gray-900">{walker.location || 'Not provided'}</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Specialties</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {walker.specialties?.map((specialty: string) => (
                  <span key={specialty} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Experience & Certifications</h3>
            <div className="mt-2">
              <p className="text-gray-600">{walker.experience || 'No experience information provided.'}</p>
            </div>
            
            {walker.certifications && walker.certifications.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-medium text-gray-900">Certifications</h4>
                <ul className="mt-2 list-disc list-inside text-gray-600">
                  {walker.certifications.map((cert: string) => (
                    <li key={cert}>{cert}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Availability</h3>
            <div className="mt-4 grid grid-cols-1 gap-4">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const hasAMSlot = walker.availability && 
                  walker.availability[day] && 
                  walker.availability[day].some((slot: TimeSlot) => slot.start === '08:00');
                
                const hasPMSlot = walker.availability && 
                  walker.availability[day] && 
                  walker.availability[day].some((slot: TimeSlot) => slot.start === '13:00');
                
                return (
                  <div key={day} className="border rounded-md p-3">
                    <h4 className="text-md font-medium text-gray-900 capitalize">{day}</h4>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className={`p-2 rounded text-center ${hasAMSlot ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                        <span className="text-sm font-medium">AM (8:00 - 11:00)</span>
                      </div>
                      <div className={`p-2 rounded text-center ${hasPMSlot ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                        <span className="text-sm font-medium">PM (1:00 - 4:00)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 