'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RouteGuard from '@/components/RouteGuard';
import { formatPrice } from '@/lib/mockSubscriptions';

// Mock data for campaign list
const mockCampaigns = [
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
    conversionRate: 15.4,
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
    conversionRate: 44.7,
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
    conversionRate: 0,
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
    conversionRate: 0,
    revenue: 0,
    startDate: '2023-08-01',
    endDate: '2023-08-15'
  },
  { 
    id: 'camp5', 
    name: 'Loyalty Program Launch', 
    type: 'email',
    status: 'active',
    audience: 'High Value Customers',
    sent: 210,
    opened: 185,
    clicked: 142,
    converted: 63,
    conversionRate: 30.0,
    revenue: 189000,
    startDate: '2023-07-01',
    endDate: '2023-08-01'
  },
  { 
    id: 'camp6', 
    name: 'Feedback Survey', 
    type: 'email',
    status: 'completed',
    audience: 'Recent Customers',
    sent: 320,
    opened: 218,
    clicked: 102,
    converted: 0,
    conversionRate: 0,
    revenue: 0,
    startDate: '2023-04-10',
    endDate: '2023-04-20'
  },
  { 
    id: 'camp7', 
    name: 'Holiday Special', 
    type: 'email',
    status: 'draft',
    audience: 'All Subscribers',
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    conversionRate: 0,
    revenue: 0,
    startDate: '2023-12-01',
    endDate: '2023-12-25'
  },
  { 
    id: 'camp8', 
    name: 'App Update Notification', 
    type: 'in-app',
    status: 'completed',
    audience: 'All App Users',
    sent: 950,
    opened: 750,
    clicked: 320,
    converted: 0,
    conversionRate: 0,
    revenue: 0,
    startDate: '2023-03-01',
    endDate: '2023-03-15'
  },
];

export default function CampaignsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Apply filters
  const filteredCampaigns = mockCampaigns.filter(campaign => {
    // Filter by status
    if (statusFilter !== 'all' && campaign.status !== statusFilter) {
      return false;
    }
    
    // Filter by type
    if (typeFilter !== 'all' && campaign.type !== typeFilter) {
      return false;
    }
    
    // Search by name or audience
    if (searchQuery && 
      !campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
      !campaign.audience.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      // In a real app, this would delete the campaign via an API call
      console.log(`Delete campaign ${id}`);
      alert('Campaign deleted');
    }
  };

  const handleDuplicate = (id: string) => {
    console.log(`Duplicate campaign ${id}`);
    // In a real app, this would create a duplicate in the database
    alert('Campaign duplicated');
  };

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing Campaigns</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create, manage, and track your marketing campaigns
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Link
              href="/admin/marketing"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/admin/marketing/campaigns/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Create Campaign
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search campaigns
              </label>
              <input
                type="text"
                id="search"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Search by name or audience..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Type
              </label>
              <select
                id="type"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All types</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="in-app">In-App</option>
              </select>
            </div>
          </div>
        </div>

        {/* Campaigns list */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign Name
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
                  <th scope="col" className="relative px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      No campaigns found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-xs text-gray-500">
                          {campaign.startDate && campaign.endDate ? 
                            `${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()}` 
                            : 'Date not set'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap">
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
                        {campaign.conversionRate > 0 ? `${campaign.conversionRate}%` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(campaign.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Link 
                          href={`/admin/marketing/campaigns/${campaign.id}`} 
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDuplicate(campaign.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 