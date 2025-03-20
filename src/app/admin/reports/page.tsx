'use client';

import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState('walks');
  const [dateRange, setDateRange] = useState('week');
  
  // Mock report data
  const reportData = {
    walks: {
      total: 124,
      completed: 118,
      cancelled: 6,
      revenue: '$2,480.00'
    },
    walkers: {
      total: 8,
      active: 7,
      onLeave: 1,
      topPerformer: 'Jane Smith'
    },
    dogs: {
      total: 56,
      active: 52,
      inactive: 4,
      newThisMonth: 6
    },
    revenue: {
      total: '$4,280.00',
      subscriptions: '$3,200.00',
      oneTimeBookings: '$1,080.00',
      refunds: '$120.00'
    }
  };

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Reports</h1>
            <p className="mt-1 text-sm text-gray-500">
              View detailed reports and analytics
            </p>
          </div>
          
          <div className="flex space-x-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Export
            </button>
          </div>
        </div>
        
        {/* Report selector */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setSelectedReport('walks')}
                className={`px-4 py-4 text-sm font-medium ${
                  selectedReport === 'walks'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Walk Reports
              </button>
              <button
                onClick={() => setSelectedReport('walkers')}
                className={`px-4 py-4 text-sm font-medium ${
                  selectedReport === 'walkers'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Walker Performance
              </button>
              <button
                onClick={() => setSelectedReport('dogs')}
                className={`px-4 py-4 text-sm font-medium ${
                  selectedReport === 'dogs'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dog Activity
              </button>
              <button
                onClick={() => setSelectedReport('revenue')}
                className={`px-4 py-4 text-sm font-medium ${
                  selectedReport === 'revenue'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Revenue
              </button>
            </nav>
          </div>
          
          {/* Report content */}
          <div className="p-6">
            {selectedReport === 'walks' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Walks</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{reportData.walks.total}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                      <dd className="mt-1 text-3xl font-semibold text-green-600">{reportData.walks.completed}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Cancelled</dt>
                      <dd className="mt-1 text-3xl font-semibold text-red-600">{reportData.walks.cancelled}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{reportData.walks.revenue}</dd>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Walk Activity</h3>
                    <div className="mt-6 h-64 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Chart showing walk activity would appear here</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {selectedReport === 'walkers' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Walkers</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{reportData.walkers.total}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Walkers</dt>
                      <dd className="mt-1 text-3xl font-semibold text-green-600">{reportData.walkers.active}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">On Leave</dt>
                      <dd className="mt-1 text-3xl font-semibold text-yellow-600">{reportData.walkers.onLeave}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Top Performer</dt>
                      <dd className="mt-1 text-xl font-semibold text-gray-900">{reportData.walkers.topPerformer}</dd>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Walker Performance</h3>
                    <div className="mt-6 h-64 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Chart showing walker performance would appear here</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {selectedReport === 'dogs' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Dogs</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{reportData.dogs.total}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Dogs</dt>
                      <dd className="mt-1 text-3xl font-semibold text-green-600">{reportData.dogs.active}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Inactive Dogs</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-600">{reportData.dogs.inactive}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">New This Month</dt>
                      <dd className="mt-1 text-3xl font-semibold text-primary-600">{reportData.dogs.newThisMonth}</dd>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Dog Activity by Breed</h3>
                    <div className="mt-6 h-64 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Chart showing dog activity by breed would appear here</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {selectedReport === 'revenue' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{reportData.revenue.total}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Subscriptions</dt>
                      <dd className="mt-1 text-3xl font-semibold text-green-600">{reportData.revenue.subscriptions}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">One-time Bookings</dt>
                      <dd className="mt-1 text-3xl font-semibold text-primary-600">{reportData.revenue.oneTimeBookings}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Refunds</dt>
                      <dd className="mt-1 text-3xl font-semibold text-red-600">{reportData.revenue.refunds}</dd>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Revenue Trends</h3>
                    <div className="mt-6 h-64 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Chart showing revenue trends would appear here</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 