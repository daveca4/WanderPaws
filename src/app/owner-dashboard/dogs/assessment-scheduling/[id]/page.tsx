'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import S3Image from '@/components/S3Image';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { format, addDays, isBefore, isAfter, parseISO } from 'date-fns';

export default function AssessmentSchedulingPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [dog, setDog] = useState<any>(null);
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

  // Load the assessment
  useEffect(() => {
    if (!user || !assessmentId) return;
    
    const loadAssessment = async () => {
      try {
        console.log('Loading assessment with ID:', assessmentId);
        // Fetch the assessment
        const response = await fetch(`/api/data/assessments/${assessmentId}`);
        
        if (!response.ok) {
          console.error('Assessment fetch error:', await response.text());
          throw new Error('Assessment not found');
        }
        
        const assessmentData = await response.json();
        console.log('Assessment data:', assessmentData);
        setAssessment(assessmentData);
        
        // Fetch the dog details
        const dogResponse = await fetch(`/api/data/dogs/${assessmentData.dogId}`);
        
        if (!dogResponse.ok) {
          console.error('Dog fetch error:', await dogResponse.text());
          throw new Error('Dog not found');
        }
        
        const dogData = await dogResponse.json();
        console.log('Dog data:', dogData);
        setDog(dogData);
        
        // Set default selected date to the scheduled date if it's in the future
        if (assessmentData.scheduledDate) {
          const scheduledDate = new Date(assessmentData.scheduledDate);
          if (isAfter(scheduledDate, new Date())) {
            setSelectedDate(scheduledDate);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading assessment:', err);
        setError('Failed to load assessment details. Please try again later.');
        setLoading(false);
      }
    };
    
    loadAssessment();
  }, [assessmentId, user]);
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleSubmit = async () => {
    if (!selectedDate || !assessment) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      console.log('Submitting assessment with date:', selectedDate.toISOString());
      
      // Update the assessment with the selected date
      const response = await fetch(`/api/data/assessments/${assessmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduledDate: selectedDate.toISOString(),
          status: 'scheduled'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Assessment update error:', errorData);
        throw new Error(errorData.error || 'Failed to schedule assessment');
      }
      
      const updatedAssessment = await response.json();
      console.log('Assessment scheduled:', updatedAssessment);
      
      // Redirect to subscription page
      router.push('/owner-dashboard/subscriptions');
    } catch (error) {
      console.error('Error scheduling assessment:', error);
      setError('Failed to schedule the assessment. Please try again.');
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
  
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Error</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <Link
          href="/owner-dashboard/dogs"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Back to My Dogs
        </Link>
      </div>
    );
  }
  
  if (!assessment || !dog) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Assessment Not Found</h2>
        <p className="text-gray-500 mb-4">We couldn't find this assessment.</p>
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
    <RouteGuard requiredPermission={{ action: 'read', resource: 'dogs' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Schedule Assessment</h1>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Assessment for {dog.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Select an available date for your dog's assessment
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-16 w-16 relative rounded-full overflow-hidden">
                {dog.imageUrl ? (
                  <S3Image
                    src={dog.imageUrl}
                    alt={dog.name}
                    fill
                    className="object-cover"
                    defaultImage="/images/default-dog.png"
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
                      Assessment appointments are typically 30 minutes. Our staff will meet with you and {dog.name} to assess
                      behavior, temperament, and compatibility with our walking service.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select a Date</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <div>{format(date, 'MMMM')}</div>
                  </button>
                ))}
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                All assessments take place between 9 AM and 5 PM. Our team will contact you to confirm the exact time.
              </div>
            </div>
            
            <div className="pt-5 border-t border-gray-200">
              <div className="flex justify-end">
                <Link
                  href="/owner-dashboard/dogs"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!selectedDate || submitting}
                  className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    !selectedDate
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                  }`}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : 'Schedule Assessment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 