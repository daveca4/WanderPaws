'use client';

import { useState } from 'react';
import { useReviewAssessment, useAdminPendingAssessments } from '@/lib/hooks/useAdminHooks';
import { Assessment } from '@/lib/types';
import { formatDate } from '@/utils/helpers';

export default function PendingAssessments() {
  const { data: assessments = [], isPending: isLoading } = useAdminPendingAssessments();
  const { mutate: reviewAssessment, isPending } = useReviewAssessment();

  const handleApprove = (assessmentId: string) => {
    reviewAssessment({ assessmentId, status: "approved", feedback: '' });
  };

  const handleReject = (assessmentId: string, feedback: string = 'Assessment rejected') => {
    reviewAssessment({ assessmentId, status: "denied", feedback });
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

  if (assessments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Assessments</h2>
        <p className="text-gray-500">No pending assessments at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Pending Assessments</h2>
      <div className="space-y-4">
        {assessments.map((assessment) => (
          <div key={assessment.id} className="border-b pb-4 last:border-0">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium">{assessment.walker?.name || 'Unknown Walker'}</h3>
                <p className="text-sm text-gray-500">
                  Submitted: {formatDate(assessment.createdAt)}
                </p>
                <p className="text-sm mt-2">{assessment.notes || 'No notes provided'}</p>
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
    </div>
  );
} 