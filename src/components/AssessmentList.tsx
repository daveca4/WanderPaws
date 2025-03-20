import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { getAssessmentsByWalkerId } from '@/lib/mockAssessments';
import { getDogById, getOwnerById, formatDate } from '@/utils/helpers';

export function AssessmentList() {
  const { user } = useAuth();
  const walkerId = user?.profileId;
  
  // If no walkerId found, return early
  if (!walkerId) {
    return null;
  }
  
  // Get assessments assigned to this walker
  const assessments = getAssessmentsByWalkerId(walkerId)
    // Filter out completed assessments
    .filter(assessment => assessment.status !== 'completed')
    // Sort by scheduled date (soonest first)
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    // Limit to 3
    .slice(0, 3);
    
  // If no assessments, return early
  if (assessments.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Assessments</h2>
        <Link href="/walker-dashboard/assessments" className="text-sm text-primary-600 hover:text-primary-700">
          View All
        </Link>
      </div>
      
      <div className="space-y-4">
        {assessments.map((assessment) => {
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