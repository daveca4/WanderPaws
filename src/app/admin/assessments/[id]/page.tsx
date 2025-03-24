'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import RouteGuard from '@/components/RouteGuard';
// Removed mock data import
import { getDogById, getWalkerById, getOwnerById } from '@/utils/helpers';
import { Assessment } from '@/lib/types';
import { formatDate } from '@/utils/helpers';

export default function AssessmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [resultNotes, setResultNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadAssessment = () => {
      const foundAssessment = getAssessmentById(params.id);
      if (foundAssessment) {
        setAssessment(foundAssessment);
        setResultNotes(foundAssessment.resultNotes || '');
      }
      setLoading(false);
    };
    
    // Simulate API call
    setTimeout(loadAssessment, 500);
  }, [params.id]);

  const handleApprove = async () => {
    if (!assessment) return;
    
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedAssessment = updateAssessment(assessment.id, {
        status: 'completed',
        result: 'approved',
        resultNotes
      });
      
      if (updatedAssessment) {
        setAssessment(updatedAssessment);
        alert('Dog assessment has been approved successfully.');
      }
      
      setSaving(false);
    }, 1000);
  };

  const handleDeny = async () => {
    if (!assessment) return;
    
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedAssessment = updateAssessment(assessment.id, {
        status: 'completed',
        result: 'denied',
        resultNotes
      });
      
      if (updatedAssessment) {
        setAssessment(updatedAssessment);
        alert('Dog assessment has been denied.');
      }
      
      setSaving(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Assessment Not Found</h2>
        <p className="text-gray-500 mb-4">The assessment you're looking for doesn't exist or has been removed.</p>
        <Link
          href="/admin/assessments"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Back to Assessments
        </Link>
      </div>
    );
  }

  const dog = getDogById(assessment.dogId);
  const owner = getOwnerById(assessment.ownerId);
  const walker = assessment.assignedWalkerId ? getWalkerById(assessment.assignedWalkerId) : null;

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Assessment for {dog?.name || 'Unknown Dog'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Created on {formatDate(assessment.createdDate)}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/admin/assessments"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to List
            </Link>
            {assessment.status !== 'completed' && (
              <Link
                href={`/admin/assessments/${assessment.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Edit Assessment
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Assessment Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Current status: 
              <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                assessment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                assessment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                assessment.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
              </span>
              {assessment.result && (
                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  assessment.result === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {assessment.result.charAt(0).toUpperCase() + assessment.result.slice(1)}
                </span>
              )}
            </p>
          </div>
          
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Dog</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {dog ? (
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        {dog.imageUrl ? (
                          <Image
                            src={dog.imageUrl}
                            alt={dog.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <Link href={`/dogs/${dog.id}`} className="text-primary-600 hover:text-primary-900">
                          {dog.name}
                        </Link>
                        <p className="text-gray-500">{dog.breed}, {dog.age} years old</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-red-500">Dog not found</span>
                  )}
                </dd>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Owner</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {owner ? (
                    <Link href={`/owners/${owner.id}`} className="text-primary-600 hover:text-primary-900">
                      {owner.name}
                    </Link>
                  ) : (
                    <span className="text-red-500">Owner not found</span>
                  )}
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Scheduled Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(assessment.scheduledDate)}
                </dd>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Assigned Walker</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {walker ? (
                    <Link href={`/walkers/${walker.id}`} className="text-primary-600 hover:text-primary-900">
                      {walker.name}
                    </Link>
                  ) : (
                    <span className="text-yellow-500">Not assigned</span>
                  )}
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Notes for Walker</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {assessment.adminNotes || <span className="text-gray-400">No notes provided</span>}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {assessment.feedback && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Walker Feedback
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Submitted on {formatDate(assessment.feedback.submittedDate)}
              </p>
            </div>
            
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Behavior Ratings</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500">Socialization</p>
                        <div className="flex items-center mt-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <svg 
                              key={index}
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`h-5 w-5 ${index < (assessment.feedback?.behaviorRatings?.socialization || 0) ? 'text-primary-500' : 'text-gray-300'}`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Leash Manners</p>
                        <div className="flex items-center mt-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <svg 
                              key={index}
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`h-5 w-5 ${index < (assessment.feedback?.behaviorRatings?.leashManners || 0) ? 'text-primary-500' : 'text-gray-300'}`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Aggression (lower is better)</p>
                        <div className="flex items-center mt-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <svg 
                              key={index}
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`h-5 w-5 ${index < (assessment.feedback?.behaviorRatings?.aggression || 0) ? 'text-red-500' : 'text-gray-300'}`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Obedience</p>
                        <div className="flex items-center mt-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <svg 
                              key={index}
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`h-5 w-5 ${index < (assessment.feedback?.behaviorRatings?.obedience || 0) ? 'text-primary-500' : 'text-gray-300'}`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Energy Level</p>
                        <div className="flex items-center mt-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <svg 
                              key={index}
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`h-5 w-5 ${index < (assessment.feedback?.behaviorRatings?.energyLevel || 0) ? 'text-primary-500' : 'text-gray-300'}`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                  </dd>
                </div>
                
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Strengths</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {assessment.feedback?.strengths.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {assessment.feedback?.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">No strengths listed</span>
                    )}
                  </dd>
                </div>
                
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Concerns</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {assessment.feedback?.concerns.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {assessment.feedback?.concerns.map((concern, index) => (
                          <li key={index}>{concern}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">No concerns listed</span>
                    )}
                  </dd>
                </div>
                
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Recommendations</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {assessment.feedback?.recommendations}
                  </dd>
                </div>
                
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Suitable for Group Walks</dt>
                  <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                    {assessment.feedback?.suitableForGroupWalks ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        No
                      </span>
                    )}
                  </dd>
                </div>
                
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Recommended Walker Experience</dt>
                  <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      assessment.feedback?.recommendedWalkerExperience === 'beginner' ? 'bg-green-100 text-green-800' :
                      assessment.feedback?.recommendedWalkerExperience === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {assessment.feedback?.recommendedWalkerExperience.charAt(0).toUpperCase() + 
                       assessment.feedback?.recommendedWalkerExperience.slice(1)}
                    </span>
                  </dd>
                </div>
                
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Additional Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {assessment.feedback.walkerNotes}
                  </dd>
                </div>
                
                {assessment.feedback.photosOrVideos && assessment.feedback.photosOrVideos.length > 0 && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Photos/Videos</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="grid grid-cols-3 gap-4">
                        {assessment.feedback.photosOrVideos.map((url, index) => (
                          <div key={index} className="relative h-24 rounded-md overflow-hidden">
                            <Image
                              src={url}
                              alt={`Assessment photo ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        {/* Admin Decision Section - Only show if assessment is scheduled or if it has feedback but no result yet */}
        {(assessment.status === 'scheduled' || (assessment.feedback && !assessment.result)) && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Assessment Decision
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Review the assessment and decide whether to approve or deny this dog for walking services.
              </p>
            </div>
            
            <div className="px-4 py-5 sm:px-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="resultNotes" className="block text-sm font-medium text-gray-700">
                    Decision Notes
                  </label>
                  <textarea
                    id="resultNotes"
                    name="resultNotes"
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Enter notes about your decision..."
                    value={resultNotes}
                    onChange={(e) => setResultNotes(e.target.value)}
                  />
                </div>
                
                <div className="flex space-x-3 justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={handleDeny}
                    disabled={saving}
                  >
                    {saving ? 'Processing...' : 'Deny Assessment'}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    onClick={handleApprove}
                    disabled={saving}
                  >
                    {saving ? 'Processing...' : 'Approve Assessment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Assessment Result - Only show if assessment has been completed with a result */}
        {assessment.status === 'completed' && assessment.result && (
          <div className={`bg-white shadow overflow-hidden sm:rounded-lg border ${
            assessment.result === 'approved' ? 'border-green-200' : 'border-red-200'
          }`}>
            <div className={`px-4 py-5 sm:px-6 ${
              assessment.result === 'approved' ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                {assessment.result === 'approved' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Assessment Approved
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Assessment Denied
                  </>
                )}
              </h3>
            </div>
            
            <div className="px-4 py-5 sm:px-6">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Decision Notes:</span> {assessment.resultNotes}
              </p>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 