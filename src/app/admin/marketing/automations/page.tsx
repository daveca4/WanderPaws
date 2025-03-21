'use client';

import { useState } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';

// Mock automations data
const marketingAutomations = [
  {
    id: 'auto1',
    name: 'Welcome Series',
    description: 'Automated email series for new subscribers',
    status: 'active',
    trigger: 'signup',
    steps: 3,
    audience: 'All New Users',
    created: '2023-04-15',
    lastModified: '2023-06-28',
    performance: {
      triggered: 245,
      completed: 204,
      conversions: 36,
      revenue: 8640
    }
  },
  {
    id: 'auto2',
    name: 'Abandoned Cart',
    description: 'Follow-up emails for users who left items in cart',
    status: 'active',
    trigger: 'cart_abandon',
    steps: 2,
    audience: 'All Active Users',
    created: '2023-03-10',
    lastModified: '2023-07-05',
    performance: {
      triggered: 183,
      completed: 136,
      conversions: 47,
      revenue: 12220
    }
  },
  {
    id: 'auto3',
    name: 'Subscription Renewal',
    description: 'Reminder sequence for upcoming subscription renewals',
    status: 'active',
    trigger: 'time_before_expiry',
    steps: 4,
    audience: 'Expiring Subscriptions',
    created: '2023-02-18',
    lastModified: '2023-05-22',
    performance: {
      triggered: 78,
      completed: 65,
      conversions: 51,
      revenue: 15300
    }
  },
  {
    id: 'auto4',
    name: 'Re-engagement Campaign',
    description: 'Series to re-engage inactive users',
    status: 'paused',
    trigger: 'inactivity',
    steps: 5,
    audience: 'Low Usage Subscribers',
    created: '2023-05-05',
    lastModified: '2023-06-15',
    performance: {
      triggered: 165,
      completed: 132,
      conversions: 24,
      revenue: 5760
    }
  },
  {
    id: 'auto5',
    name: 'Post-Purchase Follow-up',
    description: 'Thank you and feedback request after purchase',
    status: 'draft',
    trigger: 'purchase',
    steps: 2,
    audience: 'Recent Customers',
    created: '2023-06-20',
    lastModified: '2023-07-01',
    performance: {
      triggered: 0,
      completed: 0,
      conversions: 0,
      revenue: 0
    }
  }
];

// Trigger type mapping for display
const triggerTypeLabels = {
  signup: 'New Sign Up',
  cart_abandon: 'Cart Abandonment',
  time_before_expiry: 'Time Before Expiry',
  inactivity: 'User Inactivity',
  purchase: 'Purchase Completed'
};

export default function AutomationsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Filter automations based on search term and status filter
  const filteredAutomations = marketingAutomations.filter(automation => {
    const matchesSearch = 
      automation.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      automation.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || automation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate total metrics
  const totalTriggered = marketingAutomations.reduce((sum, auto) => sum + auto.performance.triggered, 0);
  const totalRevenue = marketingAutomations.reduce((sum, auto) => sum + auto.performance.revenue, 0);
  const totalConversions = marketingAutomations.reduce((sum, auto) => sum + auto.performance.conversions, 0);
  const averageCompletionRate = totalTriggered > 0 
    ? Math.round((marketingAutomations.reduce((sum, auto) => sum + auto.performance.completed, 0) / totalTriggered) * 100) 
    : 0;

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing Automations</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage automated marketing workflows
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Link
              href="/admin/marketing/automations/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Create Automation
            </Link>
          </div>
        </div>

        {/* Automations Overview */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Automations Overview</h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Active Automations</dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">
                  {marketingAutomations.filter(a => a.status === 'active').length}
                </dd>
              </div>
              
              <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Users Reached</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalTriggered}</dd>
              </div>
              
              <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Completion Rate</dt>
                <dd className="mt-1 text-3xl font-semibold text-primary-600">{averageCompletionRate}%</dd>
              </div>
              
              <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">${totalRevenue.toLocaleString()}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Automations List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <h2 className="text-lg leading-6 font-medium text-gray-900">All Automations</h2>
            <div className="flex space-x-4">
              <select
                id="statusFilter"
                name="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
              </select>
              
              <input
                type="text"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-64 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search automations..."
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
                      Automation
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trigger
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Audience
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAutomations.map((automation) => (
                    <tr key={automation.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>
                          <Link href={`/admin/marketing/automations/${automation.id}`} className="text-primary-600 hover:text-primary-900">
                            {automation.name}
                          </Link>
                          <p className="text-xs text-gray-500 mt-1">{automation.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
                            automation.trigger === 'signup' ? 'bg-blue-500' :
                            automation.trigger === 'cart_abandon' ? 'bg-yellow-500' :
                            automation.trigger === 'time_before_expiry' ? 'bg-purple-500' :
                            automation.trigger === 'inactivity' ? 'bg-red-500' :
                            'bg-green-500'
                          }`}></div>
                          {triggerTypeLabels[automation.trigger as keyof typeof triggerTypeLabels]}
                        </div>
                        <p className="text-xs text-gray-400 ml-4 mt-1">{automation.steps} steps</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          automation.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : automation.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {automation.status.charAt(0).toUpperCase() + automation.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {automation.audience}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {automation.status !== 'draft' ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Completion:</span>
                              <span className="text-xs font-medium text-gray-900">
                                {automation.performance.triggered > 0 
                                  ? Math.round((automation.performance.completed / automation.performance.triggered) * 100) 
                                  : 0}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full" 
                                style={{ 
                                  width: `${automation.performance.triggered > 0 
                                    ? Math.round((automation.performance.completed / automation.performance.triggered) * 100) 
                                    : 0}%` 
                                }}
                              ></div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Conversion:</span>
                              <span className="text-xs font-medium text-gray-900">
                                {automation.performance.completed > 0 
                                  ? Math.round((automation.performance.conversions / automation.performance.completed) * 100) 
                                  : 0}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-green-600 h-1.5 rounded-full" 
                                style={{ 
                                  width: `${automation.performance.completed > 0 
                                    ? Math.round((automation.performance.conversions / automation.performance.completed) * 100) 
                                    : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No data available</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-3 justify-end">
                          <Link href={`/admin/marketing/automations/${automation.id}/edit`} className="text-primary-600 hover:text-primary-900">
                            Edit
                          </Link>
                          {automation.status === 'active' ? (
                            <button className="text-yellow-600 hover:text-yellow-900">
                              Pause
                            </button>
                          ) : automation.status === 'paused' ? (
                            <button className="text-green-600 hover:text-green-900">
                              Activate
                            </button>
                          ) : (
                            <button className="text-green-600 hover:text-green-900">
                              Launch
                            </button>
                          )}
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
            {filteredAutomations.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No automations found matching your search criteria.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Top Performing Automations */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Top Performing Automations</h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">By Conversions</h3>
                <ul className="space-y-4">
                  {marketingAutomations
                    .filter(a => a.performance.triggered > 0)
                    .sort((a, b) => 
                      (b.performance.conversions / b.performance.triggered) - 
                      (a.performance.conversions / a.performance.triggered)
                    )
                    .slice(0, 3)
                    .map((automation, idx) => (
                      <li key={automation.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between">
                          <div>
                            <span className="text-xs font-semibold text-gray-500">#{idx + 1}</span>
                            <h4 className="text-sm font-medium text-gray-900">{automation.name}</h4>
                            <span className="text-xs text-gray-500">
                              {automation.performance.conversions} conversions from {automation.performance.triggered} triggers
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-primary-600">
                              {Math.round((automation.performance.conversions / automation.performance.triggered) * 100)}%
                            </span>
                            <p className="text-xs text-gray-500">conversion rate</p>
                          </div>
                        </div>
                      </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">By Revenue</h3>
                <ul className="space-y-4">
                  {marketingAutomations
                    .filter(a => a.performance.revenue > 0)
                    .sort((a, b) => b.performance.revenue - a.performance.revenue)
                    .slice(0, 3)
                    .map((automation, idx) => (
                      <li key={automation.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between">
                          <div>
                            <span className="text-xs font-semibold text-gray-500">#{idx + 1}</span>
                            <h4 className="text-sm font-medium text-gray-900">{automation.name}</h4>
                            <span className="text-xs text-gray-500">
                              ${(automation.performance.revenue / automation.performance.conversions).toFixed(2)} per conversion
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-green-600">
                              ${automation.performance.revenue.toLocaleString()}
                            </span>
                            <p className="text-xs text-gray-500">total revenue</p>
                          </div>
                        </div>
                      </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 