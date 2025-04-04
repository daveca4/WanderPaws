'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import { useOwnerAssessments } from '@/lib/hooks/useAssessmentHooks';
import { useOwnerDogs } from '@/lib/hooks/useDataHooks';
import { Assessment, Dog } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AssessmentStatusPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [error, setError] = useState<string | null>(null);
  
  // Use React Query hooks for data
  const { 
    data: assessments = [], 
    isPending: isLoadingAssessments, 
    error: assessmentsError,
    refetch: refetchAssessments
  } = useOwnerAssessments();
  
  const { 
    data: dogs = [], 
    isPending: isLoadingDogs,
    error: dogsError 
  } = useOwnerDogs();
  
  // Handle errors from React Query
  useEffect(() => {
    if (assessmentsError) {
      console.error('Error fetching assessments:', assessmentsError);
      setError('Failed to load your assessments. Please try again later.');
    }
    
    if (dogsError) {
      console.error('Error fetching dogs:', dogsError);
      setError('Failed to load your dogs. Please try again later.');
    }
  }, [assessmentsError, dogsError]);
  
  // Get dog by ID
  const getDogById = (dogId: string): Dog | undefined => {
    return dogs.find((dog: Dog) => dog.id === dogId);
  };
  
  // Format assessment status for display
  const formatStatus = (status: string): { label: string; color: string } => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' };
      case 'scheduled':
        return { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
      case 'assigned':
        return { label: 'Assigned to Walker', color: 'bg-indigo-100 text-indigo-800' };
      case 'in_progress':
        return { label: 'In Progress', color: 'bg-blue-100 text-blue-800' };
      case 'completed':
        return { label: 'Completed', color: 'bg-green-100 text-green-800' };
      case 'feedback_submitted':
        return { label: 'Pending Review', color: 'bg-purple-100 text-purple-800' };
      case 'approved':
        return { label: 'Approved', color: 'bg-green-100 text-green-800' };
      case 'denied':
        return { label: 'Denied', color: 'bg-red-100 text-red-800' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' };
      default:
        // For unknown statuses, just capitalize the status value
        const label = status?.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ') || 'Unknown';
        return { label, color: 'bg-gray-100 text-gray-800' };
    }
  };
  
  // Handle requesting admin review
  const handleRequestAdminReview = async (assessmentId: string) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/data/assessments/${assessmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'user-id': user?.id || '',
          'user-role': user?.role || '',
          'user-profile-id': user?.profileId || ''
        },
        body: JSON.stringify({
          status: 'ready_for_review',
          adminNotes: 'Owner has confirmed assessment is ready for review'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update assessment status');
      }

      // Refresh data to update UI
      await refetchAssessments();
      
    } catch (err) {
      console.error('Error requesting admin review:', err);
      setError('Failed to request admin review. Please try again.');
    }
  };
  
  // Debug logging
  useEffect(() => {
    console.log('AssessmentStatusPage - Current user:', user);
    console.log('AssessmentStatusPage - Assessments:', assessments);
    console.log('AssessmentStatusPage - Dogs:', dogs);
  }, [user, assessments, dogs]);
  
  // Determine if we're loading
  const isLoading = isLoadingAssessments || isLoadingDogs;
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'dogs' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Assessment Status</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => refetchAssessments()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="-ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </span>
              )}
            </button>
            <Link
              href="/owner-dashboard/assessment"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Request New Assessment
            </Link>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
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
        
        {assessments.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h2 className="text-lg font-medium text-gray-900 mb-2">No Assessments Found</h2>
            <p className="text-gray-500 mb-4">You haven't requested any dog assessments yet.</p>
            <Link
              href="/owner-dashboard/assessment"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Request Assessment
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Your Dog Assessments
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Track the status of your dog assessments
              </p>
            </div>
            
            <ul className="divide-y divide-gray-200">
              {assessments.map((assessment: Assessment) => {
                const dog = getDogById(assessment.dogId);
                const status = formatStatus(assessment.status);
                
                return (
                  <li key={assessment.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded-full overflow-hidden">
                          {dog?.imageUrl ? (
                            <img src={dog.imageUrl} alt={dog.name} className="h-12 w-12 object-cover" />
                          ) : (
                            <div className="h-12 w-12 flex items-center justify-center bg-primary-100 text-primary-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {dog ? dog.name : 'Unknown Dog'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {dog ? `${dog.breed || 'Unknown breed'}, ${dog.age || '?'} years` : 'Dog details not available'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <span>
                            {assessment.scheduledDate ? format(new Date(assessment.scheduledDate), 'MMM d, yyyy') : 'Not scheduled'}
                          </span>
                        </div>
                        {/* Use type casting for assessmentType access */}
                        {((assessment as any).assessmentType) && (
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                            <span>{(assessment as any).assessmentType}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-end sm:mt-0">
                        {assessment.status === 'feedback_submitted' && (
                          <button
                            onClick={() => handleRequestAdminReview(assessment.id)}
                            className="mr-4 inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-primary-600 hover:bg-primary-700"
                          >
                            Request Review
                          </button>
                        )}
                        <Link
                          href={`/owner-dashboard/assessment/details/${assessment.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                    
                    {assessment.result && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">Result:</p>
                        <p className={`font-medium ${
                          assessment.result === 'approved' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {assessment.result.charAt(0).toUpperCase() + assessment.result.slice(1)}
                        </p>
                      </div>
                    )}
                    
                    {/* Use type casting for accessing properties that might not be in the type */}
                    {(assessment.adminNotes || (assessment as any).resultNotes) && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-500">Notes:</p>
                        <p className="text-gray-700">{(assessment as any).resultNotes || assessment.adminNotes}</p>
                      </div>
                    )}
                    
                    {assessment.status === 'completed' && assessment.result === 'approved' && (
                      <div className="mt-4">
                        <Link
                          href="/owner-dashboard/subscriptions"
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                        >
                          Choose a Subscription
                        </Link>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 