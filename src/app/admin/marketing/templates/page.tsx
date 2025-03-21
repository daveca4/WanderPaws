'use client';

import { useState } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';

// Mock email templates data
const emailTemplates = [
  {
    id: 'template1',
    name: 'Welcome Email',
    description: 'Sent to new users after sign up',
    type: 'email',
    category: 'onboarding',
    created: '2023-04-10',
    lastModified: '2023-07-05',
    usedCount: 452,
    performance: {
      openRate: 68.4,
      clickRate: 42.1
    }
  },
  {
    id: 'template2',
    name: 'Subscription Renewal',
    description: 'Reminder email for upcoming subscription renewals',
    type: 'email',
    category: 'retention',
    created: '2023-03-15',
    lastModified: '2023-06-28',
    usedCount: 215,
    performance: {
      openRate: 72.6,
      clickRate: 38.5
    }
  },
  {
    id: 'template3',
    name: 'Monthly Newsletter',
    description: 'Regular newsletter with tips and updates',
    type: 'email',
    category: 'engagement',
    created: '2023-02-20',
    lastModified: '2023-07-01',
    usedCount: 845,
    performance: {
      openRate: 52.8,
      clickRate: 25.3
    }
  },
  {
    id: 'template4',
    name: 'Upgrade Promotion',
    description: 'Special offer for plan upgrades',
    type: 'email',
    category: 'promotion',
    created: '2023-05-12',
    lastModified: '2023-06-15',
    usedCount: 321,
    performance: {
      openRate: 48.7,
      clickRate: 31.9
    }
  },
  {
    id: 'template5',
    name: 'Account Expiration',
    description: 'Notice for accounts about to expire',
    type: 'email',
    category: 'transactional',
    created: '2023-04-05',
    lastModified: '2023-05-20',
    usedCount: 128,
    performance: {
      openRate: 81.2,
      clickRate: 24.6
    }
  },
  {
    id: 'template6',
    name: 'Appointment Confirmation',
    description: 'Confirmation message for scheduled appointments',
    type: 'sms',
    category: 'transactional',
    created: '2023-05-18',
    lastModified: '2023-07-02',
    usedCount: 523,
    performance: {
      deliveryRate: 98.5,
      responseRate: 15.3
    }
  }
];

export default function TemplatesManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Filter templates based on search term and filters
  const filteredTemplates = emailTemplates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email & Message Templates</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage reusable templates for your marketing communications
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Link
              href="/admin/marketing/templates/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Create Template
            </Link>
          </div>
        </div>

        {/* Templates Overview */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Templates Overview</h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Templates</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{emailTemplates.length}</dd>
              </div>
              
              <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Average Open Rate</dt>
                <dd className="mt-1 text-3xl font-semibold text-primary-600">
                  {Math.round(emailTemplates
                    .filter(t => t.type === 'email' && t.performance?.openRate)
                    .reduce((sum, t) => sum + (t.performance?.openRate || 0), 0) / 
                    emailTemplates.filter(t => t.type === 'email' && t.performance?.openRate).length
                  )}%
                </dd>
              </div>
              
              <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Average Click Rate</dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">
                  {Math.round(emailTemplates
                    .filter(t => t.type === 'email' && t.performance?.clickRate)
                    .reduce((sum, t) => sum + (t.performance?.clickRate || 0), 0) / 
                    emailTemplates.filter(t => t.type === 'email' && t.performance?.clickRate).length
                  )}%
                </dd>
              </div>
              
              <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Most Used Template</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  {emailTemplates.reduce((prev, current) => (prev.usedCount > current.usedCount) ? prev : current).name}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <div className="flex flex-wrap items-center justify-between">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-2 sm:mb-0">All Templates</h2>
              
              <div className="flex flex-wrap items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:w-auto">
                  <select
                    id="typeFilter"
                    name="typeFilter"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Types</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                
                <div className="w-full sm:w-auto">
                  <select
                    id="categoryFilter"
                    name="categoryFilter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Categories</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="retention">Retention</option>
                    <option value="engagement">Engagement</option>
                    <option value="promotion">Promotion</option>
                    <option value="transactional">Transactional</option>
                  </select>
                </div>
                
                <div className="w-full sm:w-auto">
                  <input
                    type="text"
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Template Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Modified
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
                  {filteredTemplates.map((template) => (
                    <tr key={template.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link href={`/admin/marketing/templates/${template.id}`} className="text-primary-600 hover:text-primary-900">
                          {template.name}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          template.type === 'email' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {template.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {template.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(template.lastModified).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {template.type === 'email' ? (
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 w-20">Open rate:</span>
                              <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-2">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${template.performance.openRate}%` }}></div>
                              </div>
                              <span className="text-xs font-medium text-gray-900 ml-2">{template.performance.openRate}%</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 w-20">Click rate:</span>
                              <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-2">
                                <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${template.performance.clickRate}%` }}></div>
                              </div>
                              <span className="text-xs font-medium text-gray-900 ml-2">{template.performance.clickRate}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 w-20">Delivery:</span>
                              <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-2">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${template.performance.deliveryRate}%` }}></div>
                              </div>
                              <span className="text-xs font-medium text-gray-900 ml-2">{template.performance.deliveryRate}%</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 w-20">Response:</span>
                              <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-2">
                                <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${template.performance.responseRate ? template.performance.responseRate*2 : 0}%` }}></div>
                              </div>
                              <span className="text-xs font-medium text-gray-900 ml-2">{template.performance.responseRate || 0}%</span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-3 justify-end">
                          <Link href={`/admin/marketing/templates/${template.id}/edit`} className="text-primary-600 hover:text-primary-900">
                            Edit
                          </Link>
                          <Link href={`/admin/marketing/campaigns/create?templateId=${template.id}`} className="text-green-600 hover:text-green-900">
                            Use
                          </Link>
                          <button className="text-gray-600 hover:text-gray-900">
                            Duplicate
                          </button>
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
            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No templates found matching your search criteria.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Template Categories */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Template Categories</h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {['onboarding', 'retention', 'engagement', 'promotion', 'transactional'].map((category) => {
                const count = emailTemplates.filter(t => t.category === category).length;
                return (
                  <div key={category} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-md font-medium text-gray-900 capitalize mb-2">{category}</h3>
                    <p className="text-2xl font-semibold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-500">templates</p>
                    <button 
                      onClick={() => setCategoryFilter(category)}
                      className="mt-3 text-xs text-primary-600 hover:text-primary-900 font-medium"
                    >
                      View all →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 