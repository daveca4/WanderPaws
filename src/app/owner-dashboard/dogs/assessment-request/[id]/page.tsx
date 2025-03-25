'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { getDogById, generateId } from '@/utils/helpers';
import { Dog, Assessment } from '@/lib/types';
import { use } from 'react';

// Helper function to create a new assessment
function createAssessment(dogId: string, ownerId: string): Assessment {
  const today = new Date();
  const scheduledDate = new Date(today);
  scheduledDate.setDate(today.getDate() + 3); // Schedule 3 days from now
  
  return {
    id: generateId('assessment'),
    dogId,
    ownerId,
    createdDate: today.toISOString(),
    scheduledDate: scheduledDate.toISOString(),
    status: 'pending',
  };
}

export default function AssessmentRequestPage() {
  const params = useParams();
  const dogId = params.id as string;
  const { user } = useAuth();
  const { dogs } = useData();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dog, setDog] = useState<Dog | null>(null);
  
  // Load the dog
  useEffect(() => {
    if (!user) return;
    
    const loadDog = () => {
      console.log("Loading dog with ID:", dogId);
      // First attempt to get dog directly from context
      const foundDog = getDogById(dogs, dogId);
      console.log("Found dog:", foundDog);
      
      if (foundDog && foundDog.ownerId === user.profileId) {
        setDog(foundDog);
        setLoading(false);
      } else {
        // Fallback: try to fetch the dog directly from API
        fetch(`/api/data/dogs/${dogId}`)
          .then(res => {
            if (!res.ok) throw new Error('Dog not found');
            return res.json();
          })
          .then(dogData => {
            if (dogData && dogData.ownerId === user.profileId) {
              setDog(dogData);
            }
            setLoading(false);
          })
          .catch(err => {
            console.error('Error fetching dog:', err);
            setLoading(false);
          });
      }
    };
    
    loadDog();
  }, [dogId, user, dogs]);
  
  const handleRequestAssessment = async () => {
    if (!dog || !user) return;
    
    setSubmitting(true);
    
    try {
      // Create an actual assessment in the database
      const response = await fetch('/api/data/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dogId: dog.id,
          ownerId: user.profileId || '',
          status: 'pending',
          scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
        })
      });
      
      if (response.ok) {
        console.log('Assessment created successfully');
        // Redirect to subscription page to continue the flow
        router.push('/owner-dashboard/subscriptions');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create assessment');
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
      alert('Failed to create assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!dog) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Dog Not Found</h2>
        <p className="text-gray-500 mb-4">We couldn't find this dog in your profile.</p>
        <Link
          href="/owner-dashboard/dogs"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Back to My Dogs
        </Link>
      </div>
    );
  }
  
  return (
    <RouteGuard requiredPermission={{ action: 'create', resource: 'dogs' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Request an Assessment</h1>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Dog Assessment Information
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              All dogs need to be assessed before they can be walked with WanderPaws.
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-16 w-16 relative rounded-full overflow-hidden">
                {dog.imageUrl ? (
                  <Image
                    src={dog.imageUrl}
                    alt={dog.name}
                    fill
                    unoptimized={true}
                    className="object-cover"
                    onError={(e) => {
                      console.error('Error loading dog image:', e);
                      // Fallback to initial
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-2xl text-primary-600">
                      {dog.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{dog.name}</h3>
                <p className="text-sm text-gray-500">{dog.breed}, {dog.age} {dog.age === 1 ? 'year' : 'years'} old</p>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Assessment Required</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Before we can start walking {dog.name}, we need to conduct a brief assessment to ensure 
                      safety and compatibility with our walkers. This is a standard procedure for all dogs.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">What happens next?</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li className="text-gray-700">
                  <span className="font-medium">Request assessment:</span> Submit your request for {dog.name}'s assessment
                </li>
                <li className="text-gray-700">
                  <span className="font-medium">Schedule:</span> Our admin team will review and assign a qualified walker
                </li>
                <li className="text-gray-700">
                  <span className="font-medium">Assessment:</span> The walker will meet with you and {dog.name} to assess behavior and compatibility
                </li>
                <li className="text-gray-700">
                  <span className="font-medium">Approval:</span> Once approved, you can book walks for {dog.name}
                </li>
              </ol>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <Link
                    href="/owner-dashboard/dogs"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="button"
                    onClick={handleRequestAssessment}
                    disabled={submitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Request Assessment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 