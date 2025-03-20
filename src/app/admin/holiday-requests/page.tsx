'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { formatDate } from '@/utils/helpers';
import RouteGuard from '@/components/RouteGuard';
import { mockWalkers } from '@/lib/mockData';

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
  
  // Filter requests by status
  const pendingRequests = holidayRequests.filter(req => req.status === 'pending');
  const approvedRequests = holidayRequests.filter(req => req.status === 'approved');
  const deniedRequests = holidayRequests.filter(req => req.status === 'denied');
  
  // Get walker name by ID
  const getWalkerName = (walkerId: string): string => {
    const walker = mockWalkers.find(w => w.id === walkerId);
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
            
            {activeTab === 'approved' && (
              <>
                {approvedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No approved time off requests</p>
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
                            Approved On
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time Off Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reason
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Admin Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {approvedRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {getWalkerName(request.walkerId)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {request.updatedAt ? new Date(request.updatedAt).toLocaleDateString() : 'Unknown'}
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                              {request.adminNotes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'denied' && (
              <>
                {deniedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No denied time off requests</p>
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
                            Denied On
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time Off Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reason
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Admin Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {deniedRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {getWalkerName(request.walkerId)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {request.updatedAt ? new Date(request.updatedAt).toLocaleDateString() : 'Unknown'}
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                              {request.adminNotes || '-'}
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
      </div>
      
      {/* Review Modal */}
      {isReviewModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Time Off Request</h3>
            
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Walker:</span>
                <span className="text-sm text-gray-900">{getWalkerName(selectedRequest.walkerId)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Date Requested:</span>
                <span className="text-sm text-gray-900">{selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Time Off Date:</span>
                <span className="text-sm text-gray-900">
                  {new Date(selectedRequest.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-700">Reason:</span>
                <p className="text-sm text-gray-900 mt-1">{selectedRequest.reason}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Notes
              </label>
              <textarea
                id="adminNotes"
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about your decision (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeReviewModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={denyRequest}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Deny
              </button>
              <button
                type="button"
                onClick={approveRequest}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </RouteGuard>
  );
} 