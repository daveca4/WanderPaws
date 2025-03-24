'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
// Removed mock data import
import { getDogById, getOwnerById, formatDate } from '@/utils/helpers';
import { Assessment } from '@/lib/types';

export default function AssessmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  // Redirect if not a walker or admin
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'walker' && user.role !== 'admin') {
        router.push('/unauthorized');
      } else if (user.profileId) {
        // Get assessments for this walker
        const walkerAssessments = getAssessmentsByWalkerId(user.profileId);
        setAssessments(walkerAssessments);
      }
    }
  }, [user, loading, router]);

  // If loading or not walker/admin, show loading state
  if (loading || !user || (user.role !== 'walker' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dog Assessments</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <p className="text-gray-600">
            Dog assessments help us understand each dog's needs and behaviors. Complete the assessment form for each assigned dog.
          </p>
        </div>

        {assessments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No assessments assigned to you</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment) => {
              const dog = getDogById(assessment.dogId);
              const owner = getOwnerById(assessment.ownerId);
              
              if (!dog || !owner) return null;
              
              return (
                <div 
                  key={assessment.id} 
                  className={`flex items-center p-4 rounded-lg border ${
                    assessment.status === 'completed' 
                      ? 'border-green-100 bg-green-50' 
                      : assessment.status === 'scheduled' 
                      ? 'border-yellow-100 bg-yellow-50'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                    <Image
                      src={dog.imageUrl || 'https://via.placeholder.com/56'}
                      alt={dog.name}
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div>
                        <p className="font-medium text-gray-900">{dog.name}</p>
                        <p className="text-sm text-gray-500">{dog.breed} · Owner: {owner.name}</p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assessment.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : assessment.status === 'scheduled' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {assessment.scheduledDate && formatDate(assessment.scheduledDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      {assessment.status === 'completed' ? (
                        <Link 
                          href={`/walker-dashboard/assessments/${assessment.id}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          View Details
                        </Link>
                      ) : (
                        <Link 
                          href={`/walker-dashboard/assessments/${assessment.id}/feedback`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          {assessment.status === 'scheduled' ? 'Submit Feedback' : 'View Details'}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 