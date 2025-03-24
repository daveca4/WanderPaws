'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { formatDate } from '@/utils/helpers';
import RouteGuard from '@/components/RouteGuard';
import { fetchWalkers } from '@/utils/dataHelpers';
import { Walker } from '@/lib/types';

// Types for holiday requests
interface HolidayRequest {
  id: string;
  walkerId: string;
  date: string;
  status: 'pending' | 'approved' | 'denied';
  reason: string;
  createdAt?: string; // When the request was submitted
  updatedAt?: string; // When the request was last updated (approved/denied)
  adminNotes?: string; // Admin notes on the request
}

// Mock holiday requests data - in a real app, this would come from a database
const initialHolidayRequests: HolidayRequest[] = [
  { id: 'h1', walkerId: 'w1', date: '2025-06-05', status: 'approved', reason: 'Family vacation', updatedAt: '2025-05-20T14:30:00Z', adminNotes: 'Approved, coverage arranged' },
  { id: 'h2', walkerId: 'w1', date: '2025-06-15', status: 'pending', reason: 'Doctor appointment', createdAt: '2025-05-25T10:15:00Z' },
  { id: 'h3', walkerId: 'w1', date: '2025-06-25', status: 'denied', reason: 'Personal day', updatedAt: '2025-05-22T09:45:00Z', adminNotes: 'Denied due to high demand' },
  { id: 'h4', walkerId: 'w2', date: '2025-06-10', status: 'pending', reason: 'Wedding attendance', createdAt: '2025-05-26T16:20:00Z' },
  { id: 'h5', walkerId: 'w2', date: '2025-07-04', status: 'approved', reason: 'Independence Day', updatedAt: '2025-06-01T11:10:00Z' },
  { id: 'h6', walkerId: 'w3', date: '2025-06-30', status: 'pending', reason: 'Family emergency', createdAt: '2025-06-02T08:45:00Z' },
];

export default function AdminHolidayRequestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [holidayRequests, setHolidayRequests] = useState<HolidayRequest[]>(initialHolidayRequests);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'denied'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<HolidayRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch walkers data
  useEffect(() => {
    async function loadWalkers() {
      try {
        setDataLoading(true);
        const walkersData = await fetchWalkers();
        setWalkers(walkersData);
        setError(null);
      } catch (err) {
        console.error('Error fetching walkers:', err);
        setError('Failed to load walker data');
      } finally {
        setDataLoading(false);
      }
    }
    
    loadWalkers();
  }, []);
  
  // Filter requests by status
  const pendingRequests = holidayRequests.filter(req => req.status === 'pending');
  const approvedRequests = holidayRequests.filter(req => req.status === 'approved');
  const deniedRequests = holidayRequests.filter(req => req.status === 'denied');
  
  // Get walker name by ID
  const getWalkerName = (walkerId: string): string => {
    const walker = walkers.find(w => w.id === walkerId);
    return walker ? walker.name : 'Unknown Walker';
  };
  
  // Handle opening the review modal
  const openReviewModal = (request: HolidayRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || '');
    setIsReviewModalOpen(true);
  };
  
  // Handle closing the review modal
  const closeReviewModal = () => {
    setSelectedRequest(null);
    setAdminNotes('');
    setIsReviewModalOpen(false);
  };
  
  // Handle approving a request
  const approveRequest = () => {
    if (!selectedRequest) return;
    
    // Update the request status
    const updatedRequests = holidayRequests.map(req => 
      req.id === selectedRequest.id
        ? {
            ...req,
            status: 'approved' as const,
            adminNotes: adminNotes,
            updatedAt: new Date().toISOString(),
          }
        : req
    );
    
    setHolidayRequests(updatedRequests);
    closeReviewModal();
  };
  
  // Handle denying a request
  const denyRequest = () => {
    if (!selectedRequest) return;
    
    // Update the request status
    const updatedRequests = holidayRequests.map(req => 
      req.id === selectedRequest.id
        ? {
            ...req,
            status: 'denied' as const,
            adminNotes: adminNotes,
            updatedAt: new Date().toISOString(),
          }
        : req
    );
    
    setHolidayRequests(updatedRequests);
    closeReviewModal();
  };
  
  return (
    <RouteGuard requiredPermission={{ action: 'manage', resource: 'holiday_requests' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Walker Time Off Requests</h1>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              pendingRequests.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {pendingRequests.length} Pending
            </span>
          </div>
        </div>
        
        {dataLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex justify-center py-6">
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-100">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-6 py-3 text-sm font-medium flex items-center ${
                    activeTab === 'pending'
                      ? 'text-amber-600 border-b-2 border-amber-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Pending
                  {pendingRequests.length > 0 && (
                    <span className="ml-2 bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'approved'
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setActiveTab('denied')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'denied'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Denied
                </button>
              </nav>
            </div>
            
            {/* Table content */}
            <div className="p-6">
              {activeTab === 'pending' && (
                <>
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No pending time off requests</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Walker
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date Requested
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Time Off Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reason
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingRequests.map((request) => (
                            <tr key={request.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {getWalkerName(request.walkerId)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(request.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                                {request.reason}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => openReviewModal(request)}
                                  className="text-primary-600 hover:text-primary-900"
                                >
                                  Review
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Review Modal */}
        {isReviewModalOpen && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
              <h3 className="text-lg font-bold mb-4">Review Time Off Request</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Walker</p>
                  <p className="font-medium">{getWalkerName(selectedRequest.walkerId)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Date Requested</p>
                  <p className="font-medium">{formatDate(selectedRequest.date)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Reason</p>
                  <p className="font-medium">{selectedRequest.reason}</p>
                </div>
                
                <div>
                  <label htmlFor="adminNotes" className="block text-sm text-gray-500 mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Add notes about this decision..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeReviewModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={denyRequest}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Deny
                </button>
                <button
                  onClick={approveRequest}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 