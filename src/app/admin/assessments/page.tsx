'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { useData } from '@/lib/DataContext';
import { Assessment } from '@/lib/types';
import { formatDate } from '@/utils/helpers';

export default function AssessmentsPage() {
  const { assessments, dogs, owners, getDogById, getOwnerById } = useData();
  const [loading, setLoading] = useState(true);
  const [displayAssessments, setDisplayAssessments] = useState<Assessment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (assessments.length > 0) {
      setLoading(false);
      applyFilters();
    }
  }, [assessments, statusFilter]);

  const applyFilters = () => {
    let filtered = [...assessments];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assessment => assessment.status === statusFilter);
    }
    
    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    
    setDisplayAssessments(filtered);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'feedback_submitted':
        return 'bg-purple-100 text-purple-800';
      case 'ready_for_review':
        return 'bg-indigo-100 text-indigo-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingReviewCount = assessments.filter(
    assessment => assessment.status === 'feedback_submitted' || assessment.status === 'ready_for_review'
  ).length;
  
  // Filter assessments based on search term and status filter
  const filteredAssessments = assessments.filter(assessment => {
    const dog = getDogById(assessment.dogId);
    const owner = getOwnerById(assessment.ownerId);
    
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'needs_review') {
        // Special filter for assessments needing review
        if (assessment.status !== 'feedback_submitted' && assessment.status !== 'ready_for_review') {
          return false;
        }
      } else if (assessment.status !== statusFilter) {
        return false;
      }
    }
    
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const dogMatch = dog && dog.name.toLowerCase().includes(searchLower);
      const ownerMatch = owner && owner.name.toLowerCase().includes(searchLower);
      const statusMatch = assessment.status.toLowerCase().includes(searchLower);
      
      return dogMatch || ownerMatch || statusMatch;
    }
    
    return true;
  });

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <Link
            href="/admin/assessments/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Create Assessment
          </Link>
        </div>
        
        {pendingReviewCount > 0 && (
          <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-indigo-700">
                  You have <span className="font-medium">{pendingReviewCount}</span> assessment{pendingReviewCount !== 1 ? 's' : ''} waiting for review.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 bg-white p-4 rounded-lg shadow mb-4">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">Status:</label>
            <select
              id="statusFilter"
              name="statusFilter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="all">All Statuses</option>
              <option value="needs_review">Needs Review ({pendingReviewCount})</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="feedback_submitted">Feedback Submitted</option>
              <option value="ready_for_review">Ready for Review</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {displayAssessments.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-gray-500">No assessments found matching the current filters.</p>
              </div>
            ) : (
              <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Dog</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Owner</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created Date</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Scheduled Date</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {displayAssessments.map((assessment) => {
                      const dog = getDogById(assessment.dogId);
                      const owner = getOwnerById(assessment.ownerId);
                      return (
                        <tr key={assessment.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="font-medium text-gray-900">
                              {dog?.name || 'Unknown dog'}
                            </div>
                            <div className="text-gray-500">{dog?.breed || 'Unknown breed'}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="text-gray-900">{owner?.name || 'Unknown owner'}</div>
                            <div className="text-gray-500">{owner?.email || 'No email'}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeColor(assessment.status)}`}>
                              {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(assessment.createdDate)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {assessment.scheduledDate ? formatDate(assessment.scheduledDate) : 'Not scheduled'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <Link
                                href={`/admin/assessments/${assessment.id}`}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none"
                              >
                                View
                              </Link>
                              
                              {assessment.status === 'pending' && (
                                <Link
                                  href={`/admin/assessments/${assessment.id}/schedule`}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none"
                                >
                                  Schedule
                                </Link>
                              )}
                              
                              {(assessment.status === 'feedback_submitted' || assessment.status === 'ready_for_review') && (
                                <Link
                                  href={`/admin/assessments/${assessment.id}`}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none"
                                >
                                  Review
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </RouteGuard>
  );
} 