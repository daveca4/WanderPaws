'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import apiClient from '@/lib/api/client';

export default function AssessmentRequestPage() {
  const params = useParams();
  const dogId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [dog, setDog] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  useEffect(() => {
    const loadDogDetails = async () => {
      if (!dogId || !user) return;
      
      try {
        const response = await apiClient.get(`/data/dogs/${dogId}`);
        
        if (!response.ok) {
          throw new Error(response.error || 'Failed to load dog details');
        }
        
        setDog(response.data);
      } catch (err) {
        console.error('Error loading dog details:', err);
        setError('Failed to load dog details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadDogDetails();
  }, [dogId, user]);
  
  const handleDateSelect = (date: string) => {
    setSelectedDate(new Date(date));
  };
  
  const handleRequestAssessment = async () => {
    if (!dog || !selectedDate || !user || !user.profileId) {
      setError('Please select a date for the assessment.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Create an assessment in the database
      const response = await apiClient.post('/data/assessments', {
        dogId: dog.id,
        ownerId: user.profileId,
        status: 'scheduled',
        scheduledDate: selectedDate.toISOString()
      });
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to create assessment');
      }
      
      console.log('Assessment created successfully');
      router.push('/owner-dashboard/dogs');
    } catch (err) {
      console.error('Error creating assessment:', err);
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
  
  if (error && !dog) {
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
  
  return (
    <RouteGuard requiredPermission={{ action: 'create', resource: 'dogs' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Request Assessment</h1>
          <Link
            href="/owner-dashboard/dogs"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to My Dogs
          </Link>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Assessment Request for {dog?.name}
              </h2>
              <p className="text-gray-500">
                Please select a date for your dog's assessment. Our staff will review your request
                and contact you to confirm the details.
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Assessment Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                onChange={(e) => handleDateSelect(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div className="pt-4">
              <button
                type="button"
                onClick={handleRequestAssessment}
                disabled={submitting || !selectedDate}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Request Assessment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}


