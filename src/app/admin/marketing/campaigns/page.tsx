'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RouteGuard from '@/components/RouteGuard';
import { formatPrice } from '@/utils/format';
// Removed mock data import

// Campaign status options with colors for visual indicators
const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'scheduled', label: 'Scheduled', color: 'yellow' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'completed', label: 'Completed', color: 'blue' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
];

// Campaign type options
const typeOptions = [
  { value: 'all', label: 'All types' },
  { value: 'email', label: 'Email', color: 'blue' },
  { value: 'sms', label: 'SMS', color: 'purple' },
  { value: 'in-app', label: 'In-App', color: 'green' },
  { value: 'push', label: 'Push Notification', color: 'orange' },
];

// Audience segment options
const audienceOptions = [
  { value: 'all', label: 'All audiences' },
  { value: 'Low Usage Subscribers', label: 'Low Usage Subscribers' },
  { value: 'Expiring Subscriptions', label: 'Expiring Subscriptions' },
  { value: 'High Value Customers', label: 'High Value Customers' },
  { value: 'Churned Customers', label: 'Churned Customers' },
  { value: 'All Active Users', label: 'All Active Users' },
  { value: 'Recent Customers', label: 'Recent Customers' },
];

// Sort options for campaigns
const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'revenue_high', label: 'Highest revenue' },
  { value: 'revenue_low', label: 'Lowest revenue' },
  { value: 'conversion_high', label: 'Highest conversion' },
  { value: 'conversion_low', label: 'Lowest conversion' },
];

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
    endDate: '2023-07-15',
    createdAt: '2023-06-10T12:00:00Z',
    creator: 'Admin User',
    description: 'Special summer promotion with discounts on subscription upgrades.'
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
    endDate: '2023-06-05',
    createdAt: '2023-05-15T10:30:00Z',
    creator: 'Admin User',
    description: 'Reminder email for subscriptions expiring within 14 days.'
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
    endDate: '',
    createdAt: '2023-07-01T15:45:00Z',
    creator: 'Marketing Manager',
    description: 'Announcement of new premium subscription plan with added benefits.'
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
    endDate: '2023-08-15',
    createdAt: '2023-07-20T09:15:00Z',
    creator: 'Admin User',
    description: 'Re-engagement campaign for customers who cancelled subscription in the last 90 days.'
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
    endDate: '2023-08-01',
    createdAt: '2023-06-25T14:00:00Z',
    creator: 'Marketing Manager',
    description: 'Introduction of new loyalty rewards program for premium subscribers.'
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
    endDate: '2023-04-20',
    createdAt: '2023-04-05T11:20:00Z',
    creator: 'Admin User',
    description: 'Customer satisfaction survey for users who completed walks in the last 30 days.'
  },
  { 
    id: 'camp7', 
    name: 'Holiday Special', 
    type: 'email',
    status: 'draft',
    audience: 'All Active Users',
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    conversionRate: 0,
    revenue: 0,
    startDate: '2023-12-01',
    endDate: '2023-12-25',
    createdAt: '2023-07-15T16:30:00Z',
    creator: 'Marketing Manager',
    description: 'Holiday season special offers and discounts on multi-walk packages.'
  },
  { 
    id: 'camp8', 
    name: 'App Update Notification', 
    type: 'in-app',
    status: 'completed',
    audience: 'All Active Users',
    sent: 950,
    opened: 750,
    clicked: 320,
    converted: 0,
    conversionRate: 0,
    revenue: 0,
    startDate: '2023-03-01',
    endDate: '2023-03-15',
    createdAt: '2023-02-25T10:00:00Z',
    creator: 'Admin User',
    description: 'Notification about app updates and new features.'
  },
  { 
    id: 'camp9', 
    name: 'Credit Expiry Reminder', 
    type: 'email',
    status: 'active',
    audience: 'Low Usage Subscribers',
    sent: 75,
    opened: 62,
    clicked: 41,
    converted: 18,
    conversionRate: 24.0,
    revenue: 36000,
    startDate: '2023-07-10',
    endDate: '2023-08-10',
    createdAt: '2023-07-05T09:30:00Z',
    creator: 'Admin User',
    description: 'Reminder for subscribers with unused credits expiring soon.'
  },
  { 
    id: 'camp10', 
    name: 'New Walker Introduction', 
    type: 'email',
    status: 'scheduled',
    audience: 'All Active Users',
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    conversionRate: 0,
    revenue: 0,
    startDate: '2023-08-05',
    endDate: '2023-08-20',
    createdAt: '2023-07-25T13:45:00Z',
    creator: 'Marketing Manager',
    description: 'Introduction of new walkers joining the platform in specific areas.'
  },
];

export default function CampaignsPage() {
  const router = useRouter();
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // UI states
  const [actionInProgress, setActionInProgress] = useState('');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [isAllSelected, setIsAllSelected] = useState(false);

  // Handle select all campaigns
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(filteredCampaigns.map(camp => camp.id));
    }
    setIsAllSelected(!isAllSelected);
  };

  // Handle toggle selection of a campaign
  const handleSelectCampaign = (id: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };
  
  // Apply all filters
  const filteredCampaigns = mockCampaigns.filter(campaign => {
    // Filter by status
    if (statusFilter !== 'all' && campaign.status !== statusFilter) {
      return false;
    }
    
    // Filter by type
    if (typeFilter !== 'all' && campaign.type !== typeFilter) {
      return false;
    }
    
    // Filter by audience
    if (audienceFilter !== 'all' && campaign.audience !== audienceFilter) {
      return false;
    }
    
    // Search by name, description, or audience
    if (searchQuery && 
      !campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
      !campaign.audience.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !campaign.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Date range filtering
    if (selectedDateRange !== 'all') {
      const now = new Date();
      const createdAt = new Date(campaign.createdAt);
      const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (selectedDateRange === 'last7days' && daysDiff > 7) {
        return false;
      } else if (selectedDateRange === 'last30days' && daysDiff > 30) {
        return false;
      } else if (selectedDateRange === 'last90days' && daysDiff > 90) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'revenue_high':
        return b.revenue - a.revenue;
      case 'revenue_low':
        return a.revenue - b.revenue;
      case 'conversion_high':
        return b.conversionRate - a.conversionRate;
      case 'conversion_low':
        return a.conversionRate - b.conversionRate;
      default:
        return 0;
    }
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCampaigns.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, audienceFilter, searchQuery, selectedDateRange, sortBy]);

  // Update isAllSelected when selections change
  useEffect(() => {
    setIsAllSelected(
      filteredCampaigns.length > 0 && 
      selectedCampaigns.length === filteredCampaigns.length
    );
  }, [selectedCampaigns, filteredCampaigns]);

  // Handle campaign deletion
  const handleDeleteCampaign = async (id: string) => {
    setCampaignToDelete(id);
    setShowDeleteModal(true);
  };

  // Confirm deletion
  const confirmDelete = async () => {
    if (!campaignToDelete) return;
    
    setActionInProgress('delete');
    
    try {
      // In a real app, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove from selected campaigns
      setSelectedCampaigns(prev => prev.filter(id => id !== campaignToDelete));
      
      setShowDeleteModal(false);
      setCampaignToDelete(null);
      
      // In a real app, we would refresh the campaign list
      // For demo purposes, just show an alert
      alert(`Campaign deleted successfully`);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign');
    } finally {
      setActionInProgress('');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'delete' | 'duplicate' | 'cancel' | 'activate') => {
    if (selectedCampaigns.length === 0) return;
    
    setActionInProgress(action);
    
    try {
      // In a real app, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const actionMap = {
        'delete': 'deleted',
        'duplicate': 'duplicated',
        'cancel': 'cancelled',
        'activate': 'activated'
      };
      
      alert(`${selectedCampaigns.length} campaigns ${actionMap[action]} successfully`);
      
      // Clear selection after bulk action
      setSelectedCampaigns([]);
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      alert(`Failed to ${action} campaigns`);
    } finally {
      setActionInProgress('');
    }
  };

  // Handle duplicate campaign
  const handleDuplicateCampaign = async (id: string) => {
    setActionInProgress('duplicate');
    
    try {
      // In a real app, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, the backend would create a duplicate campaign
      // For demo purposes, just show an alert
      alert(`Campaign duplicated successfully`);
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      alert('Failed to duplicate campaign');
    } finally {
      setActionInProgress('');
    }
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

        {/* Campaign metrics summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Campaigns</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{mockCampaigns.length}</dd>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                {mockCampaigns.filter(c => c.status === 'active').length}
              </dd>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Scheduled</dt>
              <dd className="mt-1 text-3xl font-semibold text-amber-600">
                {mockCampaigns.filter(c => c.status === 'scheduled').length}
              </dd>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
              <dd className="mt-1 text-3xl font-semibold text-blue-600">
                {mockCampaigns.filter(c => c.status === 'completed').length}
              </dd>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {formatPrice(mockCampaigns.reduce((sum, camp) => sum + camp.revenue, 0))}
              </dd>
            </div>
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
                placeholder="Search by name, audience, or description..."
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
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
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
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience
              </label>
              <select
                id="audience"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value)}
              >
                {audienceOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                id="date-range"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
              >
                <option value="all">All time</option>
                <option value="last7days">Last 7 days</option>
                <option value="last30days">Last 30 days</option>
                <option value="last90days">Last 90 days</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sort-by"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCampaigns.length > 0 && (
          <div className="bg-indigo-50 p-4 border border-indigo-200 rounded-md flex justify-between items-center">
            <div className="text-sm text-indigo-700">
              <span className="font-medium">{selectedCampaigns.length} campaigns selected</span>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleBulkAction('activate')}
                disabled={actionInProgress !== ''}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none"
              >
                Activate
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('cancel')}
                disabled={actionInProgress !== ''}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('duplicate')}
                disabled={actionInProgress !== ''}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('delete')}
                disabled={actionInProgress !== ''}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Campaigns list */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        id="select-all"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                      />
                      <label htmlFor="select-all" className="sr-only">
                        Select all
                      </label>
                    </div>
                  </th>
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
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                      No campaigns found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((campaign) => (
                    <tr key={campaign.id} className={selectedCampaigns.includes(campaign.id) ? 'bg-indigo-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          checked={selectedCampaigns.includes(campaign.id)}
                          onChange={() => handleSelectCampaign(campaign.id)}
                        />
                      </td>
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
                            : campaign.type === 'push'
                            ? 'bg-orange-100 text-orange-800'
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
                            ? 'bg-blue-100 text-blue-800'
                            : campaign.status === 'scheduled'
                            ? 'bg-yellow-100 text-yellow-800'
                            : campaign.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
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
                          onClick={() => handleDuplicateCampaign(campaign.id)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={actionInProgress !== ''}
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={actionInProgress !== ''}
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(indexOfLastItem, filteredCampaigns.length)}</span> of{' '}
                    <span className="font-medium">{filteredCampaigns.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i + 1
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Campaign?</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this campaign? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={confirmDelete}
                  disabled={actionInProgress === 'delete'}
                >
                  {actionInProgress === 'delete' ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setCampaignToDelete(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RouteGuard>
  );
} 