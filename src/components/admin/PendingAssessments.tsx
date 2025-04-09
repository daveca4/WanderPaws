'use client';

import { useState } from 'react';
import { useReviewAssessment, useAdminPendingAssessments } from '@/lib/hooks/useStandardizedAdminHooks';
import { Assessment } from '@/lib/types';
import { formatDate } from '@/utils/helpers';

export default function PendingAssessments() {
  const { data: assessments = [], isPending: isLoading, error, refetch } = useAdminPendingAssessments();
  const { mutate: reviewAssessment, isPending } = useReviewAssessment();

  const handleApprove = (assessmentId: string) => {
    reviewAssessment({ assessmentId, status: "approved", notes: '' });
  };

  const handleReject = (assessmentId: string, feedback: string = 'Assessment rejected') => {
    reviewAssessment({ assessmentId, status: "rejected", notes: feedback });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <h2 className="text-xl font-semibold mb-4">Pending Assessments</h2>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border-b pb-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Pending Assessments</h2>
        <button
          onClick={() => refetch()}
          className="px-3 py-1 bg-gray-100 text-sm text-gray-700 rounded hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          <p>Error: {error instanceof Error ? error.message : 'Failed to fetch assessments'}</p>
          <button 
            onClick={() => refetch()}
            className="mt-2 px-3 py-1 bg-red-100 text-sm text-red-700 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      )}

      {!assessments || assessments.length === 0 ? (
        <div>
          <p className="text-gray-500">No pending assessments at this time.</p>
          <button 
            onClick={() => refetch()}
            className="mt-2 px-3 py-1 bg-gray-100 text-sm text-gray-700 rounded hover:bg-gray-200"
          >
            Check Again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment: Assessment) => (
            <div key={assessment.id} className="border-b pb-4 last:border-0">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium">
                    {assessment.dog?.name || 'Unknown Dog'} Assessment
                    <span className="text-sm text-gray-500 ml-2">
                      ID: {assessment.id.substring(0, 8)}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500">
                    Submitted: {formatDate(assessment.createdAt || assessment.createdDate || new Date().toISOString())}
                  </p>
                  <p className="text-sm text-gray-500">
                    Owner: {assessment.owner?.name || 'Unknown'} {assessment.owner?.email ? `(${assessment.owner.email})` : ''}
                  </p>
                  <p className="text-sm mt-2 text-gray-600">{assessment.notes || assessment.adminNotes || 'No notes provided'}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApprove(assessment.id)}
                    disabled={isPending}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(assessment.id)}
                    disabled={isPending}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 