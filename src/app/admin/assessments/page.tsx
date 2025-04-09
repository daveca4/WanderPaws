'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { Assessment, Dog, Owner } from '@/lib/types';
import { formatDate } from '@/utils/helpers';
import { useAdminAssessments } from '@/lib/hooks/useStandardizedAdminHooks'; // Assuming a general hook exists or is created
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// You might need a dedicated hook `useAdminAssessments` that fetches all assessments
// For now, we might need to adapt or create one. If `useAdminPendingAssessments` 
// is the only one available, this page might need adjustment to only show pending ones
// or fetch all assessments through a different mechanism.

// Let's assume `useAdminAssessments` exists and fetches based on filters

export default function AssessmentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15); // Example limit

  // Define filters based on state
  const filters = useMemo(() => {
    const activeFilters: Record<string, any> = { search: searchTerm || undefined };
    if (statusFilter !== 'all') {
      if (statusFilter === 'needs_review') {
         // API needs to support this special filter, or filter client-side
        activeFilters.status = ['feedback_submitted', 'ready_for_review'];
      } else {
        activeFilters.status = statusFilter;
      }
    }
    return activeFilters;
  }, [statusFilter, searchTerm]);

  // Fetch assessments using the standardized hook
  const { 
    data: assessmentData, 
    isPending: loading, 
    error, 
    refetch 
  } = useAdminAssessments(page, limit, filters); // Pass filters to the hook

  const displayAssessments = assessmentData?.assessments || [];
  const totalAssessments = assessmentData?.total || 0;
  const totalPages = Math.ceil(totalAssessments / limit);

  // Calculate pending count client-side for the badge if needed
  // (Ideally, the API would provide this count based on filters)
  const pendingReviewCount = useMemo(() => {
     // This count might be inaccurate if pagination is used and not all assessments are loaded
    return displayAssessments.filter(
      assessment => assessment.status === 'feedback_submitted' || assessment.status === 'ready_for_review'
    ).length;
  }, [displayAssessments]); 

  // Refetch when filters or pagination change
  useEffect(() => {
    refetch();
  }, [page, limit, filters, refetch]);

  const getStatusBadgeColor = (status?: string) => {
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

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Assessments ({totalAssessments})</h1>
          <Link
            href="/admin/assessments/new" // Assuming a creation page
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Create Assessment
          </Link>
        </div>

        {/* Notification for pending reviews */}
        {/* This count might only reflect the current page if not fetched separately */}
        {pendingReviewCount > 0 && (
          <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4">
             {/* ... notification content ... */}
              <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-indigo-700">
                  <span className="font-medium">{pendingReviewCount}</span> assessment{pendingReviewCount !== 1 ? 's' : ''} on this page need review.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */} 
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700">Search</label>
                <input
                    type="text"
                    id="searchTerm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Dog or Owner Name..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
            </div>
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                id="statusFilter"
                name="statusFilter"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="needs_review">Needs Review</option>
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                {/* Add other relevant statuses */}
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          {loading && page === 1 ? (
            <div className="flex items-center justify-center h-60">
              <LoadingSpinner />
            </div>
          ) : error ? (
             <div className="p-6 text-center text-red-600">
                Error loading assessments: {error.message}
                <button onClick={() => refetch()} className="ml-2 text-sm text-primary-600 underline">Retry</button>
             </div>
          ) : displayAssessments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No assessments found matching the current filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Dog</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Owner</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Scheduled</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {displayAssessments.map((assessment: Assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                       {/* Display Dog Name - Requires fetching/joining dog data or including it in API response */}
                      <div className="font-medium text-gray-900">
                         {assessment.dog?.name || assessment.dogId?.substring(0,8) || 'Unknown dog'} 
                      </div>
                       <div className="text-gray-500">{assessment.dog?.breed || 'Unknown breed'}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {/* Display Owner Name - Requires fetching/joining owner data or including it in API response */}
                       <div className="text-gray-900">{assessment.owner?.name || assessment.ownerId?.substring(0,8) || 'Unknown owner'}</div>
                       <div className="text-gray-500">{assessment.owner?.email || 'No email'}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeColor(assessment.status)}`}>
                         {assessment.status ? assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1) : 'N/A'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDate(assessment.createdDate || assessment.createdAt)}
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
                            href={`/admin/assessments/${assessment.id}/review`} // Assuming review page
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none"
                          >
                            Review
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
         {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-lg shadow mt-4">
                <div>
                <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalAssessments)}</span> of{' '}
                    <span className="font-medium">{totalAssessments}</span> results
                </p>
                </div>
                <div className="flex space-x-1">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="relative inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                    className="relative inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
                </div>
            </div>
            )}

      </div>
    </RouteGuard>
  );
} 