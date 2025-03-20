import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPendingAssessments } from '@/lib/mockAssessments';
import { mockDogs, mockOwners } from '@/lib/mockData';
import { formatDate } from '@/utils/helpers';
import { Assessment } from '@/lib/types';
import { DashboardWidget } from '../DashboardWidget';

// Helper functions to get objects by ID
const getDogById = (dogId: string) => {
  return mockDogs.find(dog => dog.id === dogId) || { name: 'Unknown dog', breed: 'Unknown' };
};

const getOwnerById = (ownerId: string) => {
  return mockOwners.find(owner => owner.id === ownerId) || { name: 'Unknown owner' };
};

export const PendingAssessmentsWidget = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    setAssessments(getPendingAssessments().slice(0, 5)); // Only show top 5
  }, []);

  return (
    <DashboardWidget title="Pending Assessments">
      <div className="flex justify-between items-center mb-4">
        <div></div>
        <Link href="/admin/assessments" className="text-sm text-primary-600 hover:text-primary-800">
          View All →
        </Link>
      </div>
      
      {assessments.length === 0 ? (
        <p className="text-gray-500">No pending assessments</p>
      ) : (
        <div className="divide-y divide-gray-200">
          {assessments.map((assessment) => {
            const dog = getDogById(assessment.dogId);
            const owner = getOwnerById(assessment.ownerId);
            return (
              <div key={assessment.id} className="py-3">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{dog.name}</p>
                    <p className="text-sm text-gray-500">{dog.breed} • Owner: {owner.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      {assessment.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(assessment.createdDate)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex">
                  <Link 
                    href={`/admin/assessments/${assessment.id}`}
                    className="text-xs px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 mr-2"
                  >
                    Assign Walker
                  </Link>
                  <Link 
                    href={`/admin/assessments/${assessment.id}/schedule`}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                  >
                    Schedule
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardWidget>
  );
}; 