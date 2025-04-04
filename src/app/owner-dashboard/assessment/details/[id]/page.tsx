'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import S3Image from '@/components/S3Image';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import { Dog, Assessment } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import apiClient from '@/lib/api/client';

export default function AssessmentDetailsPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [dog, setDog] = useState<Dog | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user || !assessmentId) return;
    
    const loadAssessment = async () => {
      try {
        console.log('Loading assessment details for ID:', assessmentId);
        setLoading(true);
        
        // First fetch the assessment
        const assessmentResponse = await apiClient.get(`/data/assessments/${assessmentId}`, {
          headers: {
            'user-id': user?.id || '',
            'user-role': user?.role || '',
            'user-profile-id': user?.profileId || ''
          }
        });
        
        if (!assessmentResponse?.data) {
          setError('Assessment not found');
          setLoading(false);
          return;
        }

        const foundAssessment = assessmentResponse.data;
        
        // Verify the assessment belongs to the current user if they're an owner
        if (user.role === 'owner' && foundAssessment.ownerId !== user.profileId) {
          setError('You do not have permission to view this assessment');
          setLoading(false);
          return;
        }
        
        setAssessment(foundAssessment);
        
        // Get the dog information
        const dogResponse = await apiClient.get(`/data/dogs/${foundAssessment.dogId}`, {
          headers: {
            'user-id': user?.id || '',
            'user-role': user?.role || '',
            'user-profile-id': user?.profileId || ''
          }
        });
        
        if (!dogResponse?.data) {
          setError('Dog information not found');
        } else {
          setDog(dogResponse.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading assessment details:', err);
        setError('Failed to load assessment details');
        setLoading(false);
      }
    };
    
    loadAssessment();
  }, [assessmentId, user]);
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'feedback_submitted':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get human-readable status
  const getReadableStatus = (assessment: Assessment) => {
    if (assessment.status === 'completed') {
      return assessment.result === 'approved' ? 'Approved' : 'Not Approved';
    }
    
    return assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1).replace(/_/g, ' ');
  };
  
  // Safe date format helper
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Not scheduled';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  // This is used for TypeScript type compatibility with API responses
  // that might include additional fields not in our type definition
  type ExtendedAssessment = Assessment & {
    resultNotes?: string;
    cancelled?: boolean;
  };

  // Check if an assessment is cancelled - allows for both status="cancelled" 
  // and cancelled=true in API responses
  const isAssessmentCancelled = (assessment: ExtendedAssessment): boolean => {
    return (assessment as any).status === 'cancelled' || Boolean(assessment.cancelled);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error || !assessment || !dog) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Error</h2>
        <p className="text-gray-500 mb-4">{error || 'Assessment information not found'}</p>
        <Link
          href="/owner-dashboard/assessment/status"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Back to Assessments
        </Link>
      </div>
    );
  }
  
  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'dogs' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessment Details</h1>
            <p className="text-sm text-gray-500 mt-1">
              View details for your dog's assessment
            </p>
          </div>
          
          <Link
            href="/owner-dashboard/assessment/status"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to All Assessments
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header with dog info */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center">
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
                <h2 className="text-lg font-medium text-gray-900">{dog.name}</h2>
                <p className="text-sm text-gray-500">
                  {dog.breed}, {dog.age} {dog.age === 1 ? 'year' : 'years'} old
                </p>
              </div>
              <div className="ml-auto">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(assessment.status)}`}>
                  {getReadableStatus(assessment)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Assessment details */}
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">Assessment Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Status:</span>
                    <span className="text-sm font-medium text-gray-900">{getReadableStatus(assessment)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Requested On:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(assessment.createdDate)}
                    </span>
                  </div>
                  
                  {assessment.scheduledDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">
                        {assessment.status === 'scheduled' ? 'Scheduled For:' : 'Assessment Date:'}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(assessment.scheduledDate)}
                      </span>
                    </div>
                  )}
                  
                  {assessment.assignedWalkerId && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Walker Assigned:</span>
                      <span className="text-sm font-medium text-gray-900">Yes</span>
                    </div>
                  )}
                  
                  {assessment.status === 'completed' && assessment.result && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Result:</span>
                      <span className={`text-sm font-medium ${assessment.result === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                        {assessment.result === 'approved' ? 'Approved' : 'Not Approved'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">Next Steps</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {assessment.status === 'pending' && (
                    <>
                      <p className="text-sm text-gray-700 mb-4">
                        Your assessment has been requested but not yet scheduled. Please schedule a time for the assessment.
                      </p>
                      <Link
                        href="/owner-dashboard/assessment"
                        className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
                      >
                        Schedule Assessment
                      </Link>
                    </>
                  )}
                  
                  {assessment.status === 'scheduled' && assessment.scheduledDate && (
                    <>
                      <p className="text-sm text-gray-700 mb-4">
                        Your assessment is scheduled for {format(new Date(assessment.scheduledDate), 'PPPP')}. 
                        Please make sure you and your dog are available at the scheduled time.
                      </p>
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                        <p className="text-sm text-blue-700">
                          After the assessment is completed, you'll be notified of the result.
                        </p>
                      </div>
                    </>
                  )}
                  
                  {assessment.status === 'completed' && assessment.result === 'approved' && (
                    <>
                      <p className="text-sm text-gray-700 mb-4">
                        Congratulations! Your dog has been approved. You can now purchase a subscription to start booking walks.
                      </p>
                      <Link
                        href="/owner-dashboard/subscriptions"
                        className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
                      >
                        Buy Subscription
                      </Link>
                    </>
                  )}
                  
                  {assessment.status === 'completed' && assessment.result === 'denied' && (
                    <>
                      <p className="text-sm text-gray-700 mb-4">
                        We're sorry, but your dog was not approved at this time. Please contact us for more information
                        about why and what steps you might take to prepare for another assessment.
                      </p>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                        <p className="text-sm text-yellow-700">
                          If you believe this was an error or would like to discuss the assessment, please contact our support team.
                        </p>
                      </div>
                      <Link
                        href="/owner-dashboard/assessment"
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Request New Assessment
                      </Link>
                    </>
                  )}
                  
                  {isAssessmentCancelled(assessment as ExtendedAssessment) && (
                    <>
                      <p className="text-sm text-gray-700 mb-4">
                        This assessment was cancelled. You can request a new assessment if you'd like to proceed.
                      </p>
                      <Link
                        href="/owner-dashboard/assessment"
                        className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
                      >
                        Request New Assessment
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {(assessment as ExtendedAssessment).resultNotes && (
              <div className="mt-6">
                <h3 className="text-base font-medium text-gray-900 mb-3">Assessment Notes</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{(assessment as ExtendedAssessment).resultNotes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 