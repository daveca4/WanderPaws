import Link from 'next/link';
import { useState } from 'react';
import { formatDate } from '@/utils/helpers';
import { DashboardWidget } from '../DashboardWidget';
import { useAdminPendingAssessments } from '@/lib/hooks/useStandardizedAdminHooks';
import { Assessment } from '@/lib/types';

export const PendingAssessmentsWidget = () => {
  const [retryCount, setRetryCount] = useState(0);
  const { data: pendingAssessments = [], isLoading, error, refetch } = useAdminPendingAssessments();

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    refetch();
  };

  if (isLoading) {
    return (
      <DashboardWidget title="Pending Assessments">
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </DashboardWidget>
    );
  }

  if (error) {
    return (
      <DashboardWidget title="Pending Assessments">
        <div className="bg-red-50 p-4 rounded-lg mb-4">
          <p className="text-red-700">Error loading assessments</p>
          <p className="text-sm text-red-600 mt-1">
            {error instanceof Error ? error.message : 'Database error occurred'}
          </p>
          <div className="flex space-x-2 mt-3">
            <button 
              onClick={handleRetry}
              className="px-4 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardWidget>
    );
  }

  return (
    <DashboardWidget title="Pending Assessments">
      <div className="flex justify-between items-center mb-4">
        <div></div>
        <Link href="/admin/assessments" className="text-sm text-primary-600 hover:text-primary-800">
          View All →
        </Link>
      </div>
      
      {!pendingAssessments || pendingAssessments.length === 0 ? (
        <div>
          <p className="text-gray-500">No pending assessments</p>
          <button 
            onClick={handleRetry}
            className="mt-2 text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {pendingAssessments.slice(0, 5).map((assessment: Assessment) => (
            <div key={assessment.id} className="py-3">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {assessment.dog?.name || 'Dog'} Assessment
                  </p>
                  <p className="text-sm text-gray-500">
                    Owner: {assessment.owner?.name || 'Unknown'} • ID: {assessment.id.substring(0, 8)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    {assessment.status}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(assessment.createdAt || assessment.createdDate || '')}
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
          ))}
          <div className="py-2 text-right">
            <button 
              onClick={handleRetry}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </DashboardWidget>
  );
}; 