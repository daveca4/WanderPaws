import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { formatDate } from '@/utils/helpers';
import { 
  fetchAssessments, 
  fetchDogs, 
  fetchOwners, 
  getAssessmentsByWalkerId 
} from '@/utils/dataHelpers';
import { Assessment, Dog, Owner } from '@/lib/types';

export function AssessmentList() {
  const { user } = useAuth();
  const walkerId = user?.profileId;
  
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!walkerId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch assessments, dogs, and owners
        const [assessmentsData, dogsData, ownersData] = await Promise.all([
          fetchAssessments(),
          fetchDogs(),
          fetchOwners()
        ]);
        
        setAssessments(assessmentsData);
        setDogs(dogsData);
        setOwners(ownersData);
      } catch (err) {
        setError('Error loading data');
        console.error('Error fetching assessment data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [walkerId]);
  
  // If no walkerId found, return early
  if (!walkerId) {
    return null;
  }
  
  // Handle loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Assessments</h2>
        </div>
        <div className="flex justify-center py-6">
          <p className="text-gray-500">Loading assessments...</p>
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Assessments</h2>
        </div>
        <div className="flex justify-center py-6">
          <p className="text-red-500">Failed to load assessments. Please try again.</p>
        </div>
      </div>
    );
  }
  
  // Get assessments assigned to this walker
  const walkerAssessments = getAssessmentsByWalkerId(assessments, walkerId)
    // Filter out completed assessments
    .filter(assessment => assessment.status !== 'completed')
    // Sort by scheduled date (soonest first)
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    // Limit to 3
    .slice(0, 3);
    
  // If no assessments, return early
  if (walkerAssessments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Assessments</h2>
          <Link href="/walker-dashboard/assessments" className="text-sm text-primary-600 hover:text-primary-700">
            View All
          </Link>
        </div>
        <div className="flex justify-center py-6">
          <p className="text-gray-500">No upcoming assessments scheduled.</p>
        </div>
      </div>
    );
  }
  
  // Helper functions
  const getDogById = (id: string): Dog | undefined => dogs.find(dog => dog.id === id);
  const getOwnerById = (id: string): Owner | undefined => owners.find(owner => owner.id === id);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Assessments</h2>
        <Link href="/walker-dashboard/assessments" className="text-sm text-primary-600 hover:text-primary-700">
          View All
        </Link>
      </div>
      
      <div className="space-y-4">
        {walkerAssessments.map((assessment) => {
          const dog = getDogById(assessment.dogId);
          const owner = getOwnerById(assessment.ownerId);
          
          if (!dog || !owner) return null;
          
          return (
            <Link 
              key={assessment.id} 
              href={`/walker-dashboard/assessments/${assessment.id}`} 
              className="flex items-center p-3 rounded-lg hover:bg-gray-50 border border-yellow-100 bg-yellow-50"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                <Image
                  src={dog.imageUrl || 'https://via.placeholder.com/48'}
                  alt={dog.name}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              
              <div className="ml-4 flex-1">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{dog.name} - Assessment</p>
                    <p className="text-sm text-gray-500">{dog.breed} · Owner: {owner.name}</p>
                  </div>
                  <div className="mt-1 sm:mt-0 sm:text-right">
                    <p className="text-sm font-medium text-yellow-700">
                      {assessment.status === 'scheduled' ? 'Scheduled' : 'Pending'}
                    </p>
                    {assessment.scheduledDate && (
                      <p className="text-xs text-gray-500">
                        {formatDate(assessment.scheduledDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 