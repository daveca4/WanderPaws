'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, addDays } from 'date-fns';
import S3Image from '@/components/S3Image';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { getDogsByOwnerId, generateId } from '@/utils/helpers';
import { Dog } from '@/lib/types';

export default function AssessmentPage() {
  const { user } = useAuth();
  const { dogs } = useData();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userDogs, setUserDogs] = useState<Dog[]>([]);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Generate available dates (next 7 days excluding today)
  useEffect(() => {
    const dates = [];
    const currentDate = new Date();
    
    // Start from tomorrow
    for (let i = 1; i <= 7; i++) {
      const date = addDays(currentDate, i);
      // Only include weekdays (Monday to Friday)
      if (date.getDay() > 0 && date.getDay() < 6) {
        dates.push(date);
      }
    }
    
    setAvailableDates(dates);
  }, []);

  // Load user's dogs
  useEffect(() => {
    if (!user) return;
    
    const loadUserDogs = async () => {
      try {
        // Get dogs from context
        const ownedDogs = getDogsByOwnerId(dogs, user.profileId || '');
        
        if (ownedDogs.length > 0) {
          setUserDogs(ownedDogs);
          // Pre-select the first dog that doesn't have an approved assessment
          const dogNeedingAssessment = ownedDogs.find(dog => 
            !dog.assessmentStatus || 
            !['approved', 'completed'].includes(dog.assessmentStatus)
          );
          
          if (dogNeedingAssessment) {
            setSelectedDog(dogNeedingAssessment);
          } else {
            setSelectedDog(ownedDogs[0]);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading dogs:', err);
        setError('Failed to load your dogs. Please try again later.');
        setLoading(false);
      }
    };
    
    loadUserDogs();
  }, [user, dogs]);
  
  const handleDogSelect = (dog: Dog) => {
    setSelectedDog(dog);
  };
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleRequestAssessment = async () => {
    if (!selectedDog || !selectedDate || !user) {
      setError('Please select both a dog and a date for the assessment.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Create an assessment in the database
      const response = await fetch('/api/data/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dogId: selectedDog.id,
          ownerId: user.profileId || '',
          status: 'scheduled',
          scheduledDate: selectedDate.toISOString()
        })
      });
      
      if (response.ok) {
        console.log('Assessment created successfully');
        // Redirect to assessment status page instead of subscription page
        router.push('/owner-dashboard/assessment/status');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create assessment');
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
      setError('Failed to request assessment. Please try again.');
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
  
  if (userDogs.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">No Dogs Found</h2>
        <p className="text-gray-500 mb-4">You need to add a dog before you can request an assessment.</p>
        <Link
          href="/owner-dashboard/dogs/add"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Add a Dog
        </Link>
      </div>
    );
  }
  
  return (
    <RouteGuard requiredPermission={{ action: 'create', resource: 'dogs' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Schedule a Dog Assessment</h1>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Dog Assessment
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              All dogs need to be assessed before they can be walked with WanderPaws.
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              {/* Step 1: Select your dog */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Step 1: Select Your Dog</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userDogs.map((dog) => (
                    <div
                      key={dog.id}
                      onClick={() => handleDogSelect(dog)}
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedDog?.id === dog.id
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 relative rounded-full overflow-hidden">
                            {dog.imageUrl ? (
                              <S3Image
                                src={dog.imageUrl}
                                alt={dog.name}
                                fill
                                className="object-cover"
                                defaultImage="/images/default-dog.png"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-xl text-primary-600">
                                  {dog.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <h4 className="text-base font-medium text-gray-900">{dog.name}</h4>
                            <p className="text-sm text-gray-500">{dog.breed}, {dog.age} {dog.age === 1 ? 'year' : 'years'} old</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Step 2: Select a date */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Step 2: Select a Date</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {availableDates.map((date) => (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => handleDateSelect(date)}
                      className={`p-4 border rounded-lg text-center ${
                        selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{format(date, 'EEEE')}</div>
                      <div className="text-2xl font-bold my-1">{format(date, 'd')}</div>
                      <div className="text-gray-500">{format(date, 'MMM yyyy')}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Assessment Information</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Assessment appointments are typically 30 minutes. Our staff will meet with you and your dog to assess
                        behavior, temperament, and compatibility with our walking service. Once approved, you'll be able to 
                        select a subscription plan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">What happens next?</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li className="text-gray-700">
                    <span className="font-medium">Schedule assessment:</span> Submit your request with your preferred date
                  </li>
                  <li className="text-gray-700">
                    <span className="font-medium">Assessment:</span> A walker will meet with you and your dog to assess behavior and compatibility
                  </li>
                  <li className="text-gray-700">
                    <span className="font-medium">Approval:</span> Once approved, you'll be directed to choose a subscription
                  </li>
                  <li className="text-gray-700">
                    <span className="font-medium">Book walks:</span> After subscribing, you can start booking walks
                  </li>
                </ol>
              </div>
              
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
                    disabled={submitting || !selectedDog || !selectedDate}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Schedule Assessment'}
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