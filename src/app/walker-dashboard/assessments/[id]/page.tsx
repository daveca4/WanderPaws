'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { getAssessmentById } from '@/lib/mockAssessments';
import { getDogById, getOwnerById, formatDate } from '@/utils/helpers';
import { Assessment, AssessmentFeedback } from '@/lib/types';

export default function AssessmentDetailsPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'walker' && user.role !== 'admin') {
        router.push('/unauthorized');
      } else {
        // Load assessment
        const foundAssessment = getAssessmentById(params.id);
        
        // Redirect if assessment doesn't exist or doesn't belong to this walker
        if (!foundAssessment || (user.role === 'walker' && foundAssessment.assignedWalkerId !== user.profileId)) {
          router.push('/walker-dashboard/assessments');
        } else {
          setAssessment(foundAssessment);
        }
      }
    }
  }, [params.id, user, loading, router]);

  // If loading or assessment not found, show loading state
  if (loading || !assessment || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const dog = getDogById(assessment.dogId);
  const owner = getOwnerById(assessment.ownerId);
  const feedback = assessment.feedback;

  if (!dog || !owner) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error: Dog or owner information not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link 
            href="/walker-dashboard/assessments" 
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Assessments
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Assessment for {dog.name}</h1>
        </div>
        
        <div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            assessment.status === 'completed' 
              ? 'bg-green-100 text-green-800' 
              : assessment.status === 'scheduled' 
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dog & Assessment Info */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                <Image
                  src={dog.imageUrl || 'https://via.placeholder.com/64'}
                  alt={dog.name}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">{dog.name}</h2>
                <p className="text-sm text-gray-500">{dog.breed} • {dog.size} • {dog.age} years</p>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Owner Information</h3>
              <p className="text-sm text-gray-900">{owner.name}</p>
              <p className="text-sm text-gray-700">{owner.email}</p>
              <p className="text-sm text-gray-700">{owner.phone}</p>
            </div>
            
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Assessment Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-gray-600">Scheduled:</p>
                <p className="text-gray-900">{formatDate(assessment.scheduledDate)}</p>
                
                <p className="text-gray-600">Created:</p>
                <p className="text-gray-900">{formatDate(assessment.createdDate)}</p>
                
                {assessment.status === 'completed' && assessment.result && (
                  <>
                    <p className="text-gray-600">Result:</p>
                    <p className={`font-medium ${assessment.result === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                      {assessment.result.charAt(0).toUpperCase() + assessment.result.slice(1)}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Feedback Section */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Feedback</h2>
            
            {assessment.status !== 'completed' || !feedback ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Feedback not available yet</p>
                {assessment.status === 'scheduled' && (
                  <div className="mt-4">
                    <Link
                      href={`/walker-dashboard/assessments/${assessment.id}/feedback`}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Submit Feedback
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-3">Behavior Ratings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <RatingItem label="Socialization" value={feedback.behaviorRatings.socialization} />
                    <RatingItem label="Leash Manners" value={feedback.behaviorRatings.leashManners} />
                    <RatingItem label="Aggression" value={feedback.behaviorRatings.aggression} />
                    <RatingItem label="Obedience" value={feedback.behaviorRatings.obedience} />
                    <RatingItem label="Energy Level" value={feedback.behaviorRatings.energyLevel} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-md font-medium text-gray-800 mb-2">Strengths</h3>
                    {feedback.strengths.length === 0 ? (
                      <p className="text-gray-500 italic">No strengths noted</p>
                    ) : (
                      <ul className="list-disc pl-5 text-gray-700 space-y-1">
                        {feedback.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium text-gray-800 mb-2">Concerns</h3>
                    {feedback.concerns.length === 0 ? (
                      <p className="text-gray-500 italic">No concerns noted</p>
                    ) : (
                      <ul className="list-disc pl-5 text-gray-700 space-y-1">
                        {feedback.concerns.map((concern, index) => (
                          <li key={index}>{concern}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-2">Group Walks</h3>
                  <p className={`text-sm ${feedback.suitableForGroupWalks ? 'text-green-600' : 'text-red-600'}`}>
                    {feedback.suitableForGroupWalks 
                      ? 'Suitable for group walks' 
                      : 'Not recommended for group walks'}
                  </p>
                </div>
                
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-md font-medium text-gray-800 mb-2">Recommendations</h3>
                  <p className="text-gray-700">
                    {feedback.recommendations || 'No recommendations provided'}
                  </p>
                </div>
                
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-md font-medium text-gray-800 mb-2">Additional Notes</h3>
                  <p className="text-gray-700">
                    {feedback.walkerNotes || 'No additional notes'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RatingItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{value}/5</span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-blue-500' : value >= 2 ? 'bg-yellow-500' : 'bg-red-500'}`} 
          style={{ width: `${(value / 5) * 100}%` }}
        ></div>
      </div>
    </div>
  );
} 