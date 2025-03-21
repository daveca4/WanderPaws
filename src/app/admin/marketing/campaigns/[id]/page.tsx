'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LineChart, Line, 
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import RouteGuard from '@/components/RouteGuard';
import { formatPrice } from '@/lib/mockSubscriptions';

// Define types for campaign data
type DailyStat = {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
};

type Campaign = {
  id: string;
  name: string;
  type: string;
  status: string;
  audience: string;
  audienceCount: number;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  conversionRate: number;
  revenue: number;
  startDate: string;
  endDate: string;
  subject: string;
  messagePreview: string;
  cost: number;
  roi: number;
  dailyStats: DailyStat[];
};

type CampaignCollection = {
  [key: string]: Campaign;
};

// Mock campaign detail data
const mockCampaigns: CampaignCollection = {
  'camp1': { 
    id: 'camp1', 
    name: 'Summer Special Offer', 
    type: 'email',
    status: 'active',
    audience: 'Low Usage Subscribers',
    audienceCount: 156,
    sent: 156,
    opened: 102,
    clicked: 68,
    converted: 24,
    conversionRate: 15.4,
    revenue: 72000,
    startDate: '2023-06-15',
    endDate: '2023-07-15',
    subject: 'Limited time summer offer for WanderPaws users!',
    messagePreview: '<p>Dear {first_name},</p><p>Summer is here, and we have a special offer just for you!</p><p>Book additional walks this summer and save 20% when you upgrade your subscription.</p>',
    cost: 1500,
    roi: 4700,
    dailyStats: [
      { date: '2023-06-15', sent: 156, opened: 89, clicked: 42, converted: 12, revenue: 36000 },
      { date: '2023-06-16', sent: 0, opened: 13, clicked: 10, converted: 5, revenue: 15000 },
      { date: '2023-06-17', sent: 0, opened: 0, clicked: 8, converted: 3, revenue: 9000 },
      { date: '2023-06-18', sent: 0, opened: 0, clicked: 5, converted: 2, revenue: 6000 },
      { date: '2023-06-19', sent: 0, opened: 0, clicked: 3, converted: 2, revenue: 6000 },
    ]
  },
  'camp2': { 
    id: 'camp2', 
    name: 'Renewal Reminder', 
    type: 'email',
    status: 'completed',
    audience: 'Expiring Subscriptions',
    audienceCount: 85,
    sent: 85,
    opened: 76,
    clicked: 52,
    converted: 38,
    conversionRate: 44.7,
    revenue: 114000,
    startDate: '2023-05-20',
    endDate: '2023-06-05',
    subject: 'Your WanderPaws subscription is about to expire',
    messagePreview: '<p>Dear {first_name},</p><p>Your subscription is expiring soon! Renew now to continue enjoying our service without interruption.</p>',
    cost: 850,
    roi: 13300,
    dailyStats: [
      { date: '2023-05-20', sent: 85, opened: 65, clicked: 38, converted: 22, revenue: 66000 },
      { date: '2023-05-21', sent: 0, opened: 11, clicked: 14, converted: 16, revenue: 48000 },
    ]
  },
  'camp5': { 
    id: 'camp5', 
    name: 'Loyalty Program Launch', 
    type: 'email',
    status: 'active',
    audience: 'High Value Customers',
    audienceCount: 210,
    sent: 210,
    opened: 185,
    clicked: 142,
    converted: 63,
    conversionRate: 30.0,
    revenue: 189000,
    startDate: '2023-07-01',
    endDate: '2023-08-01',
    subject: 'Introducing WanderPaws Loyalty Program - You\'re Already a VIP!',
    messagePreview: '<p>Dear {first_name},</p><p>We\'re excited to introduce our new loyalty program, and as one of our most valued customers, you\'re already enrolled!</p>',
    cost: 2100,
    roi: 8900,
    dailyStats: [
      { date: '2023-07-01', sent: 210, opened: 154, clicked: 98, converted: 45, revenue: 135000 },
      { date: '2023-07-02', sent: 0, opened: 31, clicked: 44, converted: 18, revenue: 54000 },
    ]
  }
};

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRecipientsAction, setSelectedRecipientsAction] = useState('');

  useEffect(() => {
    // Simulate API call to get campaign details
    const fetchCampaign = async () => {
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const campaignData = mockCampaigns[params.id];
        if (campaignData) {
          setCampaign(campaignData);
        }
      } catch (error) {
        console.error('Error fetching campaign:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [params.id]);

  const handleCancelCampaign = async () => {
    setActionInProgress('cancel');
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state to simulate API response
      setCampaign(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'cancelled'
        };
      });
      
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error cancelling campaign:', error);
      alert('Failed to cancel campaign');
    } finally {
      setActionInProgress('');
    }
  };

  const handleExtendCampaign = async () => {
    setActionInProgress('extend');
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state to simulate API response
      setCampaign(prev => {
        if (!prev) return null;
        return {
          ...prev,
          endDate: '2023-08-15'  // Extended by a month
        };
      });
    } catch (error) {
      console.error('Error extending campaign:', error);
      alert('Failed to extend campaign');
    } finally {
      setActionInProgress('');
    }
  };

  const handleSendTestMessage = async () => {
    setActionInProgress('test');
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Test message sent successfully!');
    } catch (error) {
      console.error('Error sending test message:', error);
      alert('Failed to send test message');
    } finally {
      setActionInProgress('');
    }
  };

  const handleRemindNonOpeners = async () => {
    setActionInProgress('remind');
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Reminder sent to non-openers!');
      setSelectedRecipientsAction('');
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Failed to send reminders');
    } finally {
      setActionInProgress('');
    }
  };

  const handleDuplicateCampaign = () => {
    router.push(`/admin/marketing/campaigns/create?duplicate=${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="py-8 px-4 max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h2>
          <p className="text-gray-600 mb-6">The campaign you are looking for does not exist or has been removed.</p>
          <Link
            href="/admin/marketing/campaigns"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Return to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {campaign.type.toUpperCase()} Campaign • {new Date(campaign.startDate).toLocaleDateString()} to {new Date(campaign.endDate).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Link
              href="/admin/marketing/campaigns"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Campaigns
            </Link>
            
            {campaign.status === 'active' && (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50"
                disabled={actionInProgress === 'cancel'}
              >
                {actionInProgress === 'cancel' ? 'Cancelling...' : 'Cancel Campaign'}
              </button>
            )}
          </div>
        </div>

        {/* Campaign Status Banner */}
        <div className={`rounded-md p-4 ${
          campaign.status === 'active' 
            ? 'bg-green-50 border border-green-200' 
            : campaign.status === 'completed'
            ? 'bg-gray-50 border border-gray-200'
            : campaign.status === 'scheduled'
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {campaign.status === 'active' && (
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {campaign.status === 'completed' && (
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {campaign.status === 'scheduled' && (
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              )}
              {campaign.status === 'cancelled' && (
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium 
                ${campaign.status === 'active' ? 'text-green-800' : 
                  campaign.status === 'completed' ? 'text-gray-800' :
                  campaign.status === 'scheduled' ? 'text-yellow-800' :
                  'text-red-800'}`}>
                Campaign Status: {campaign.status.toUpperCase()}
              </h3>
              <div className={`mt-2 text-sm 
                ${campaign.status === 'active' ? 'text-green-700' : 
                  campaign.status === 'completed' ? 'text-gray-700' :
                  campaign.status === 'scheduled' ? 'text-yellow-700' :
                  'text-red-700'}`}>
                <p>
                  {campaign.status === 'active' && 'This campaign is currently active and running.'}
                  {campaign.status === 'completed' && 'This campaign has completed its run.'}
                  {campaign.status === 'scheduled' && 'This campaign is scheduled to run in the future.'}
                  {campaign.status === 'cancelled' && 'This campaign has been cancelled.'}
                </p>
              </div>
              {campaign.status === 'active' && (
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      onClick={handleSendTestMessage}
                      disabled={actionInProgress === 'test'}
                      className="bg-green-50 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600 mr-2"
                    >
                      {actionInProgress === 'test' ? 'Sending...' : 'Send Test Message'}
                    </button>
                    <button
                      onClick={handleExtendCampaign}
                      disabled={actionInProgress === 'extend'}
                      className="bg-green-50 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600 mr-2"
                    >
                      {actionInProgress === 'extend' ? 'Extending...' : 'Extend End Date'}
                    </button>
                    <button
                      onClick={handleDuplicateCampaign}
                      className="bg-green-50 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                    >
                      Duplicate Campaign
                    </button>
                  </div>
                </div>
              )}
              {campaign.status === 'completed' && (
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      onClick={handleDuplicateCampaign}
                      className="bg-gray-50 px-2 py-1.5 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-gray-600"
                    >
                      Duplicate Campaign
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Campaign Performance</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Sent</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{campaign.sent}</dd>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Opened</dt>
                  <dd className="mt-1 text-3xl font-semibold text-blue-600">{campaign.opened}</dd>
                  <dd className="mt-1 text-sm text-gray-500">{Math.round((campaign.opened / campaign.sent) * 100)}% open rate</dd>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Clicked</dt>
                  <dd className="mt-1 text-3xl font-semibold text-primary-600">{campaign.clicked}</dd>
                  <dd className="mt-1 text-sm text-gray-500">{Math.round((campaign.clicked / campaign.sent) * 100)}% click rate</dd>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Converted</dt>
                  <dd className="mt-1 text-3xl font-semibold text-green-600">{campaign.converted}</dd>
                  <dd className="mt-1 text-sm text-gray-500">{campaign.conversionRate}% conversion</dd>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{formatPrice(campaign.revenue)}</dd>
                  <dd className="mt-1 text-sm text-gray-500">ROI: {campaign.roi}%</dd>
                </div>
              </div>
            </div>
            
            {/* Performance Chart */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Performance Over Time</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={campaign.dailyStats}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'revenue') return [formatPrice(Number(value)), 'Revenue'];
                      return [value, typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name];
                    }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="opened" stroke="#3b82f6" activeDot={{ r: 8 }} />
                    <Line yAxisId="left" type="monotone" dataKey="clicked" stroke="#8b5cf6" />
                    <Line yAxisId="left" type="monotone" dataKey="converted" stroke="#10b981" />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#f97316" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Details */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Campaign Details</h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Campaign Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{campaign.type.toUpperCase()}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">{campaign.status.toUpperCase()}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Target Audience</dt>
                <dd className="mt-1 text-sm text-gray-900">{campaign.audience}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Audience Size</dt>
                <dd className="mt-1 text-sm text-gray-900">{campaign.audienceCount} subscribers</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(campaign.startDate).toLocaleDateString()}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">End Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(campaign.endDate).toLocaleDateString()}</dd>
              </div>
              {campaign.type === 'email' && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Subject Line</dt>
                  <dd className="mt-1 text-sm text-gray-900">{campaign.subject}</dd>
                </div>
              )}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Message Content Preview</dt>
                <dd className="mt-1 text-sm text-gray-900 p-4 border rounded-md bg-gray-50">
                  <div dangerouslySetInnerHTML={{ __html: campaign.messagePreview }} />
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Recipient Actions */}
        {campaign.status === 'active' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recipient Actions</h2>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <p className="text-sm text-gray-500 mb-4">
                Perform additional actions on campaign recipients based on their engagement.
              </p>
              
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="recipient-action" className="block text-sm font-medium text-gray-700">
                    Select Action
                  </label>
                  <select
                    id="recipient-action"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    value={selectedRecipientsAction}
                    onChange={(e) => setSelectedRecipientsAction(e.target.value)}
                  >
                    <option value="">Select an action...</option>
                    <option value="non-openers">Send reminder to non-openers</option>
                    <option value="non-clickers">Send follow-up to openers who didn't click</option>
                    <option value="clickers">Send special offer to clickers who didn't convert</option>
                    <option value="converters">Send thank you message to converters</option>
                  </select>
                </div>
                
                {selectedRecipientsAction && (
                  <div className="mt-4">
                    <button
                      onClick={handleRemindNonOpeners}
                      disabled={actionInProgress === 'remind'}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {actionInProgress === 'remind' ? 'Processing...' : 'Execute Action'}
                    </button>
                    <button
                      onClick={() => setSelectedRecipientsAction('')}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Cancel Campaign?
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to cancel this campaign? This action cannot be undone and will stop any future messages from being sent.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={handleCancelCampaign}
                  disabled={actionInProgress === 'cancel'}
                >
                  {actionInProgress === 'cancel' ? 'Cancelling...' : 'Yes, Cancel Campaign'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => setShowConfirmModal(false)}
                >
                  No, Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RouteGuard>
  );
} 