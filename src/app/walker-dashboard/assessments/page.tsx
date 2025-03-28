'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
// Removed mock data import
import { formatDate } from '@/utils/helpers';
import { Assessment } from '@/lib/types';
import { getAssessmentsByWalkerId } from '@/lib/dbOperations';

// Helper functions to fetch real data from the API
const getDogById = async (dogId: string) => {
  try {
    const response = await fetch(`/api/data/dogs/${dogId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch dog: ${response.status}`);
    }
    const dogData = await response.json();
    return dogData;
  } catch (error) {
    console.error(`Error fetching dog with ID ${dogId}:`, error);
    // Return placeholder data instead of failing completely
    return {
      id: dogId,
      name: "Loading...",
      breed: "Loading...",
      imageUrl: "https://via.placeholder.com/56"
    };
  }
};

const getOwnerById = async (ownerId: string) => {
  try {
    const response = await fetch(`/api/data/owners/${ownerId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch owner: ${response.status}`);
    }
    const ownerData = await response.json();
    return ownerData;
  } catch (error) {
    console.error(`Error fetching owner with ID ${ownerId}:`, error);
    // Return placeholder data instead of failing completely
    return {
      id: ownerId,
      name: "Loading...",
      email: "loading@example.com"
    };
  }
};

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [dogData, setDogData] = useState<{[key: string]: any}>({});
  const [ownerData, setOwnerData] = useState<{[key: string]: any}>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        if (!user) {
          router.push('/login');
          return;
        }
        
        if (user.role !== 'walker' && user.role !== 'admin') {
          router.push('/unauthorized');
          return;
        }

        // First check if the user object already has walkerId (from current-user API)
        let walkerId = (user as any).walkerId;
        
        // If not, try to get it from the current-user API
        if (!walkerId) {
          try {
            const response = await fetch('/api/auth/current-user');
            if (response.ok) {
              const userData = await response.json();
              walkerId = userData.walkerId;
            }
          } catch (error) {
            console.error('Error fetching current user data:', error);
          }
        }
        
        // If still no walkerId, fall back to profileId
        if (!walkerId && user.profileId) {
          walkerId = user.profileId;
        }
        
        if (!walkerId) {
          console.error('No walkerId or profileId found for user');
          setIsLoading(false);
          return;
        }
        
        // Try to get assessments using the walker ID
        const response = await fetch(`/api/walkers/${walkerId}/assessments`);
        if (!response.ok) {
          throw new Error(`Failed to fetch assessments: ${response.status}`);
        }
        const fetchedAssessments = await response.json();

        if (fetchedAssessments.length === 0) {
          // Fallback to the old method as a backup
          const backupAssessments = await getAssessmentsByWalkerId(walkerId);
          
          if (backupAssessments.length > 0) {
            setAssessments(backupAssessments as unknown as Assessment[]);
          } else {
            setAssessments([]);
          }
        } else {
          setAssessments(fetchedAssessments as unknown as Assessment[]);
        }
        
        // Fetch dog and owner data for each assessment
        const dogs: {[key: string]: any} = {};
        const owners: {[key: string]: any} = {};
        
        for (const assessment of fetchedAssessments) {
          if (!dogs[assessment.dogId]) {
            dogs[assessment.dogId] = await getDogById(assessment.dogId);
          }
          if (!owners[assessment.ownerId]) {
            owners[assessment.ownerId] = await getOwnerById(assessment.ownerId);
          }
        }
        
        setDogData(dogs);
        setOwnerData(owners);
      } catch (error) {
        console.error("Error fetching assessments:", error);
        setAssessments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
  }, [user, router, searchParams]);

  // If loading or not walker/admin, show loading state
  if (isLoading || !user || (user.role !== 'walker' && user.role !== 'admin')) {
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
              const dog = dogData[assessment.dogId];
              const owner = ownerData[assessment.ownerId];
              
              if (!dog || !owner) {
                return <div key={assessment.id} className="p-4 border border-red-200 bg-red-50 rounded">
                  <p className="text-red-600">Missing data for assessment {assessment.id}</p>
                  <p className="text-xs">Please try refreshing the page</p>
                </div>;
              }
              
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
                          {assessment.status === 'completed' ? 'Completed' : 
                           assessment.status === 'scheduled' ? 'Scheduled' : 
                           assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {assessment.scheduledDate && formatDate(assessment.scheduledDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      {assessment.status === 'completed' || assessment.feedback ? (
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