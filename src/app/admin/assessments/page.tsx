'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import RouteGuard from '@/components/RouteGuard';
import { 
  mockAssessments, 
  getPendingAssessments, 
  getScheduledAssessments, 
  getCompletedAssessments 
} from '@/lib/mockAssessments';
import { getDogById } from '@/utils/helpers';
import { Assessment } from '@/lib/types';
import { formatDate } from '@/utils/helpers';

export default function AdminAssessmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'scheduled' | 'completed'>('all');
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    const loadAssessments = () => {
      let filteredAssessments: Assessment[];
      
      switch (filter) {
        case 'pending':
          filteredAssessments = getPendingAssessments();
          break;
        case 'scheduled':
          filteredAssessments = getScheduledAssessments();
          break;
        case 'completed':
          filteredAssessments = getCompletedAssessments();
          break;
        default:
          filteredAssessments = [...mockAssessments];
          break;
      }
      
      // Sort by date (most recent first)
      filteredAssessments.sort((a, b) => {
        return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      });
      
      setAssessments(filteredAssessments);
      setLoading(false);
    };
    
    // Simulate API call
    setTimeout(loadAssessments, 500);
  }, [filter]);

  const getStatusBadgeClasses = (status: string) => {
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

  const getResultBadgeClasses = (result?: string) => {
    switch (result) {
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
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dog Assessments</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage dog assessments, assign walkers, and review assessment feedback
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/admin/assessments/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Assessment
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <nav className="flex space-x-4">
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  filter === 'all' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  filter === 'pending' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setFilter('pending')}
              >
                Pending
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  filter === 'scheduled' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setFilter('scheduled')}
              >
                Scheduled
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  filter === 'completed' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
            </nav>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : assessments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 mb-4">No assessments found with the selected filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dog
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Walker
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assessments.map((assessment) => {
                    const dog = getDogById(assessment.dogId);
                    
                    return (
                      <tr key={assessment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 relative">
                              {dog?.imageUrl ? (
                                <Image
                                  src={dog.imageUrl}
                                  alt={dog.name}
                                  width={40}
                                  height={40}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{dog?.name}</div>
                              <div className="text-sm text-gray-500">{dog?.breed}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(assessment.createdDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(assessment.scheduledDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assessment.assignedWalkerId ? (
                            <Link href={`/walkers/${assessment.assignedWalkerId}`} className="text-primary-600 hover:text-primary-900">
                              View Walker
                            </Link>
                          ) : (
                            <span className="text-yellow-500">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(assessment.status)}`}>
                            {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {assessment.result ? (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getResultBadgeClasses(assessment.result)}`}>
                              {assessment.result.charAt(0).toUpperCase() + assessment.result.slice(1)}
                            </span>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/assessments/${assessment.id}`}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            View
                          </Link>
                          {assessment.status !== 'completed' && (
                            <Link
                              href={`/admin/assessments/${assessment.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
} 