'use client';

import Link from 'next/link';
import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';

// Mock audience segments data
const audienceSegments = [
  {
    id: 'seg1',
    name: 'Active Subscribers',
    description: 'Users who have actively used the service in the last 30 days',
    memberCount: 452,
    createdAt: '2023-04-12',
    lastUpdated: '2023-07-15',
    criteria: ['subscription:active', 'login:last-30-days']
  },
  {
    id: 'seg2',
    name: 'Churned Customers',
    description: 'Former subscribers who have cancelled in the last 90 days',
    memberCount: 128,
    createdAt: '2023-05-20',
    lastUpdated: '2023-07-10',
    criteria: ['subscription:cancelled', 'cancellation:last-90-days']
  },
  {
    id: 'seg3',
    name: 'Premium Plan Users',
    description: 'Subscribers on the premium plan tier',
    memberCount: 215,
    createdAt: '2023-03-05',
    lastUpdated: '2023-07-14',
    criteria: ['plan:premium', 'subscription:active']
  },
  {
    id: 'seg4',
    name: 'Low Usage Subscribers',
    description: 'Active subscribers with low app engagement',
    memberCount: 163,
    createdAt: '2023-06-18',
    lastUpdated: '2023-07-12',
    criteria: ['subscription:active', 'activity:low', 'login:last-60-days']
  },
  {
    id: 'seg5',
    name: 'Expiring Subscriptions',
    description: 'Users whose subscriptions are expiring in the next 30 days',
    memberCount: 78,
    createdAt: '2023-05-11',
    lastUpdated: '2023-07-16',
    criteria: ['subscription:active', 'expiration:next-30-days']
  }
];

export default function AudienceManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter segments based on search term
  const filteredSegments = audienceSegments.filter(
    segment => 
      segment.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      segment.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audience Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage audience segments for targeted marketing campaigns
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Link
              href="/admin/marketing/audience/segments/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Create Segment
            </Link>
          </div>
        </div>

        {/* Audience Overview */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Audience Overview</h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Subscribers</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">895</dd>
              </div>
              
              <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Active Segments</dt>
                <dd className="mt-1 text-3xl font-semibold text-primary-600">{audienceSegments.length}</dd>
              </div>
              
              <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Monthly Growth</dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">+8.2%</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Segments List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Audience Segments</h2>
            <div className="w-64">
              <input
                type="text"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Search segments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Segment Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Members
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSegments.map((segment) => (
                    <tr key={segment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link href={`/admin/marketing/audience/${segment.id}`} className="text-primary-600 hover:text-primary-900">
                          {segment.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                        {segment.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {segment.memberCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(segment.lastUpdated).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-3 justify-end">
                          <Link href={`/admin/marketing/audience/${segment.id}/edit`} className="text-primary-600 hover:text-primary-900">
                            Edit
                          </Link>
                          <Link href={`/admin/marketing/campaigns/create?segmentId=${segment.id}`} className="text-green-600 hover:text-green-900">
                            Target
                          </Link>
                          <button className="text-red-600 hover:text-red-900">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredSegments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No audience segments found matching your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Audience Insights */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Audience Insights</h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900">Segment Distribution</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-500 text-sm mb-8">Visual chart of audience segment distribution would appear here</p>
                  <div className="space-y-2">
                    {audienceSegments.map(segment => (
                      <div key={segment.id} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EF4444'][audienceSegments.findIndex(s => s.id === segment.id) % 5] }}
                        ></div>
                        <span className="text-sm text-gray-600">{segment.name}</span>
                        <span className="text-sm text-gray-400">({segment.memberCount})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900">Recent Activity</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="border-l-2 border-blue-500 pl-3 py-1">
                    <p className="text-sm font-medium text-gray-900">Premium Plan Users segment updated</p>
                    <p className="text-xs text-gray-500">Today, 10:42 AM</p>
                  </div>
                  <div className="border-l-2 border-green-500 pl-3 py-1">
                    <p className="text-sm font-medium text-gray-900">New segment "Expiring Subscriptions" created</p>
                    <p className="text-xs text-gray-500">Yesterday, 3:15 PM</p>
                  </div>
                  <div className="border-l-2 border-yellow-500 pl-3 py-1">
                    <p className="text-sm font-medium text-gray-900">Campaign "Summer Special" targeted to "Low Usage Subscribers"</p>
                    <p className="text-xs text-gray-500">Jul 15, 2023</p>
                  </div>
                  <div className="border-l-2 border-purple-500 pl-3 py-1">
                    <p className="text-sm font-medium text-gray-900">"Churned Customers" segment criteria modified</p>
                    <p className="text-xs text-gray-500">Jul 10, 2023</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 