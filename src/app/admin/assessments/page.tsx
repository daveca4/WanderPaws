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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessments Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage all dog assessments
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 bg-white p-4 rounded-lg shadow mb-4">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">Status:</label>
            <select
              id="statusFilter"
              name="statusFilter"
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
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
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeClass(assessment.status)}`}>
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