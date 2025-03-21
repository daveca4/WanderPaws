'use client';

import Link from 'next/link';
import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import { formatPrice } from '@/lib/mockSubscriptions';

// Mock data for campaign performance
const recentCampaigns = [
  { 
    id: 'camp1', 
    name: 'Summer Special Offer', 
    type: 'email',
    status: 'active',
    audience: 'Low Usage Subscribers',
    sent: 156,
    opened: 102,
    clicked: 68,
    converted: 24,
    revenue: 72000,
    startDate: '2023-06-15',
    endDate: '2023-07-15'
  },
  { 
    id: 'camp2', 
    name: 'Renewal Reminder', 
    type: 'email',
    status: 'completed',
    audience: 'Expiring Subscriptions',
    sent: 85,
    opened: 76,
    clicked: 52,
    converted: 38,
    revenue: 114000,
    startDate: '2023-05-20',
    endDate: '2023-06-05'
  },
  { 
    id: 'camp3', 
    name: 'New Premium Plan', 
    type: 'in-app',
    status: 'draft',
    audience: 'All Active Users',
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    revenue: 0,
    startDate: '',
    endDate: ''
  },
  { 
    id: 'camp4', 
    name: 'Win Back Campaign', 
    type: 'sms',
    status: 'scheduled',
    audience: 'Churned Customers',
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    revenue: 0,
    startDate: '2023-08-01',
    endDate: '2023-08-15'
  },
];

// Marketing metrics
const marketingMetrics = {
  totalCampaigns: 12,
  activeCampaigns: 3,
  totalSubscribers: 895,
  monthlyNewSubscribers: 72,
  averageConversionRate: 8.5,
  averageCampaignROI: 320, // 320%
  totalMarketingRevenue: 450000
};

export default function MarketingDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your marketing campaigns and track performance
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Link
              href="/admin/marketing/campaigns/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Create Campaign
            </Link>
          </div>
        </div>

        {/* Marketing metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Campaigns</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{marketingMetrics.totalCampaigns}</dd>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Active Campaigns</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">{marketingMetrics.activeCampaigns}</dd>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Average Conversion Rate</dt>
              <dd className="mt-1 text-3xl font-semibold text-primary-600">{marketingMetrics.averageConversionRate}%</dd>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{formatPrice(marketingMetrics.totalMarketingRevenue)}</dd>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`px-4 py-4 text-sm font-medium ${
                  selectedTab === 'overview'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedTab('campaigns')}
                className={`px-4 py-4 text-sm font-medium ${
                  selectedTab === 'campaigns'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Campaigns
              </button>
              <button
                onClick={() => setSelectedTab('audience')}
                className={`px-4 py-4 text-sm font-medium ${
                  selectedTab === 'audience'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Audience
              </button>
              <button
                onClick={() => setSelectedTab('templates')}
                className={`px-4 py-4 text-sm font-medium ${
                  selectedTab === 'templates'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setSelectedTab('automations')}
                className={`px-4 py-4 text-sm font-medium ${
                  selectedTab === 'automations'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Automations
              </button>
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Campaigns</h3>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Campaign
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Audience
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sent
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Conversion
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Revenue
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Edit</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentCampaigns.map((campaign) => (
                          <tr key={campaign.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {campaign.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                campaign.type === 'email' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : campaign.type === 'sms'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {campaign.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                campaign.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : campaign.status === 'completed'
                                  ? 'bg-gray-100 text-gray-800'
                                  : campaign.status === 'scheduled'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {campaign.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {campaign.audience}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {campaign.sent}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {campaign.sent > 0 ? `${Math.round((campaign.converted / campaign.sent) * 100)}%` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatPrice(campaign.revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link href={`/admin/marketing/campaigns/${campaign.id}`} className="text-primary-600 hover:text-primary-900">
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Marketing Strategy</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Target Audience Reach</span>
                        <span className="text-sm font-medium text-gray-900">68%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: '68%' }}></div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Campaign ROI</span>
                        <span className="text-sm font-medium text-gray-900">{marketingMetrics.averageCampaignROI}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, marketingMetrics.averageCampaignROI / 5)}%` }}></div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Subscriber Growth</span>
                        <span className="text-sm font-medium text-gray-900">+{marketingMetrics.monthlyNewSubscribers} this month</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <Link href="/admin/marketing/campaigns/create" className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Create New Campaign
                      </Link>
                      <Link href="/admin/marketing/audience/segments" className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Manage Audience Segments
                      </Link>
                      <Link href="/admin/marketing/templates" className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Create Email Template
                      </Link>
                      <Link href="/admin/marketing/automations" className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Set Up Marketing Automation
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'campaigns' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">All Campaigns</h3>
                  <Link
                    href="/admin/marketing/campaigns/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                    New Campaign
                  </Link>
                </div>
                <p className="text-gray-500 mb-6">
                  For detailed campaign management and creation, please visit the Campaigns section.
                </p>
                <Link
                  href="/admin/marketing/campaigns"
                  className="text-primary-600 hover:text-primary-900"
                >
                  View all campaigns →
                </Link>
              </div>
            )}

            {selectedTab === 'audience' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Audience Management</h3>
                  <Link
                    href="/admin/marketing/audience/segments/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Create Segment
                  </Link>
                </div>
                <p className="text-gray-500 mb-6">
                  Create and manage audience segments for targeted marketing campaigns.
                </p>
                <Link
                  href="/admin/marketing/audience"
                  className="text-primary-600 hover:text-primary-900"
                >
                  Manage audience segments →
                </Link>
              </div>
            )}

            {selectedTab === 'templates' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Email & Message Templates</h3>
                  <Link
                    href="/admin/marketing/templates/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Create Template
                  </Link>
                </div>
                <p className="text-gray-500 mb-6">
                  Create and manage reusable email and message templates for your marketing campaigns.
                </p>
                <Link
                  href="/admin/marketing/templates"
                  className="text-primary-600 hover:text-primary-900"
                >
                  Manage templates →
                </Link>
              </div>
            )}

            {selectedTab === 'automations' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Marketing Automations</h3>
                  <Link
                    href="/admin/marketing/automations/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Create Automation
                  </Link>
                </div>
                <p className="text-gray-500 mb-6">
                  Set up automated marketing workflows triggered by user behavior or time-based events.
                </p>
                <Link
                  href="/admin/marketing/automations"
                  className="text-primary-600 hover:text-primary-900"
                >
                  Manage automations →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 