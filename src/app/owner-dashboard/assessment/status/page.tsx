'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import S3Image from '@/components/S3Image';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { Assessment, Dog } from '@/lib/types';

export default function AssessmentStatusPage() {
  const { user } = useAuth();
  const { dogs, assessments, refreshData } = useData();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [userAssessments, setUserAssessments] = useState<Assessment[]>([]);
  const [userDogs, setUserDogs] = useState<Dog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadAssessments = async () => {
    if (!user || !user.profileId) return;
    
    try {
      setLoading(true);
      
      // Make sure to refresh data to get the latest assessment status
      await refreshData();
      
      // Filter assessments by owner ID
      const ownerAssessments = assessments.filter(assessment => 
        assessment.ownerId === user.profileId
      );
      
      // Filter dogs by owner ID
      const ownerDogs = dogs.filter(dog => 
        dog.ownerId === user.profileId
      );
      
      setUserAssessments(ownerAssessments);
      setUserDogs(ownerDogs);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError('Failed to load your assessments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAssessments();
    }
  }, [user]);
  
  // Function to manually refresh data
  const handleRefresh = async () => {
    setError(null);
    await loadAssessments();
  };
  
  // Get dog by ID
  const getDogById = (dogId: string): Dog | undefined => {
    return userDogs.find(dog => dog.id === dogId);
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
      setLoading(true);
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
      await refreshData();
      await loadAssessments();
      
    } catch (err) {
      console.error('Error requesting admin review:', err);
      setError('Failed to request admin review. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
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
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              {loading ? (
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
        
        {userAssessments.length === 0 ? (
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
            
            <div className="divide-y divide-gray-200">
              {userAssessments.map((assessment) => {
                const dog = getDogById(assessment.dogId);
                const statusInfo = formatStatus(assessment.status);
                
                return (
                  <div key={assessment.id} className="p-6">
                    <div className="flex items-start">
                      {dog && (
                        <div className="flex-shrink-0 h-16 w-16 relative rounded-full overflow-hidden mr-4">
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
                      )}
                      
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-xl font-medium text-gray-900">
                              {dog ? dog.name : 'Unknown Dog'}
                            </h3>
                            {dog && (
                              <p className="text-gray-500">
                                {dog.breed}, {dog.age} {dog.age === 1 ? 'year' : 'years'} old
                              </p>
                            )}
                          </div>
                          <div>
                            <span className={`px-2 py-1 text-xs rounded-full ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <p className="text-xs text-gray-400 mt-1 text-right">
                              Status: {assessment.status}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Requested:</p>
                            <p className="font-medium">
                              {format(new Date(assessment.createdDate), 'PPP')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Scheduled for:</p>
                            <p className="font-medium">
                              {format(new Date(assessment.scheduledDate), 'PPP')}
                            </p>
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
                        
                        {assessment.resultNotes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-500">Notes:</p>
                            <p className="text-gray-700">{assessment.resultNotes}</p>
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

                        {assessment.status === 'feedback_submitted' && (
                          <div className="mt-4">
                            <button
                              onClick={() => handleRequestAdminReview(assessment.id)}
                              disabled={loading}
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              {loading ? 'Processing...' : 'Notify Admin for Review'}
                            </button>
                            <p className="text-xs text-gray-500 mt-2">
                              Your walker has submitted feedback. Click the button above to notify our admin team to review the assessment.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
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
                  After your assessment is approved, you'll be able to purchase a subscription plan
                  and start booking walks for your dog. If you have any questions about the assessment
                  process, please contact our support team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 