'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import RouteGuard from '@/components/RouteGuard';
import { format } from 'date-fns';
import UserImageUploader from '@/components/UserImageUploader';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  image: string | null;
  owner: any | null;
  walker: any | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // For modals
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    email: string;
    emailVerified: boolean;
    role: string;
    image: string;
  }>({
    name: '',
    email: '',
    emailVerified: false,
    role: 'owner',
    image: '',
  });
  
  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      
      // Ensure we're working with an array
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error('API did not return an array:', data);
        setUsers([]);
        setError('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setError(error instanceof Error ? error.message : 'An error occurred loading users');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Filter users based on selected filter
  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'owners') return user.role === 'owner';
    if (filter === 'walkers') return user.role === 'walker';
    if (filter === 'admins') return user.role === 'admin';
    if (filter === 'verified') return user.emailVerified;
    if (filter === 'unverified') return !user.emailVerified;
    return true;
  });
  
  // Toggle email verification status
  const toggleVerificationStatus = async (user: UserData) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailVerified: !user.emailVerified,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      await fetchUsers(); // Refresh user list
      setSuccessMessage(`Email verification status updated for ${user.email}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error instanceof Error ? error.message : 'Failed to update user');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Open reset password modal
  const openResetPasswordModal = (user: UserData) => {
    setSelectedUser(user);
    setNewPassword(null);
    setIsResetPasswordModalOpen(true);
  };
  
  // Reset user password
  const resetPassword = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }
      
      const data = await response.json();
      setNewPassword(data.newPassword);
      setSuccessMessage(`Password has been reset for ${selectedUser.email}`);
    } catch (error) {
      console.error('Error resetting password:', error);
      setError(error instanceof Error ? error.message : 'Failed to reset password');
    }
  };
  
  // Open delete user modal
  const openDeleteModal = (user: UserData) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };
  
  // Delete user
  const deleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      await fetchUsers(); // Refresh user list
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      setSuccessMessage(`User ${selectedUser.email} has been deleted`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete user');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Close modals
  const closeModals = () => {
    setIsResetPasswordModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedUser(null);
    setNewPassword(null);
  };
  
  // Open edit modal with user data
  const openEditModal = (user: UserData) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      image: user.image || '',
    });
    setIsEditModalOpen(true);
  };
  
  // Handle input changes in the edit form
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setEditFormData({
        ...editFormData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value,
      });
    }
  };
  
  // Handle image upload
  const handleImageUploaded = (imageUrl: string) => {
    setEditFormData({
      ...editFormData,
      image: imageUrl,
    });
  };
  
  // Submit user edit form
  const submitEditForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      await fetchUsers(); // Refresh user list
      setIsEditModalOpen(false);
      setSelectedUser(null);
      setSuccessMessage(`User ${editFormData.email} has been updated`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error instanceof Error ? error.message : 'Failed to update user');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage all user accounts in the system
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/admin"
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 mr-2"
            >
              Dashboard
            </Link>
            <Link
              href="/walkers/add"
              className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              Add Walker
            </Link>
          </div>
        </div>
        
        {/* Success Message */}
        {successMessage && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 bg-white p-4 rounded-lg shadow mb-4">
          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700">Filter:</label>
            <select
              id="filter"
              name="filter"
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="owners">Owners</option>
              <option value="walkers">Walkers</option>
              <option value="admins">Admins</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>
        
        {/* User List */}
        {loading ? (
          <div className="flex items-center justify-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.image ? (
                            <img className="h-10 w-10 rounded-full" src={user.image} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-lg text-primary-600">
                                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name || 'No Name'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                          user.role === 'walker' ? 'bg-green-100 text-green-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                        {user.role}
                      </span>
                      {user.role === 'walker' && user.walker && (
                        <span className="ml-2 text-xs text-gray-500">
                          {user.walker.dogs ? `${user.walker.dogs.length} dogs` : ''}
                        </span>
                      )}
                      {user.role === 'owner' && user.owner && (
                        <span className="ml-2 text-xs text-gray-500">
                          {user.owner.dogs ? `${user.owner.dogs.length} dogs` : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => toggleVerificationStatus(user)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.emailVerified
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openResetPasswordModal(user)}
                          className="text-primary-600 hover:text-primary-900 text-xs"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-primary-600 hover:text-primary-900 text-xs"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Reset Password Modal */}
        {isResetPasswordModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reset Password</h3>
              
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to reset the password for <span className="font-semibold">{selectedUser.email}</span>?
              </p>
              
              {newPassword ? (
                <div className="mb-4 p-3 bg-green-50 rounded-md border border-green-200">
                  <p className="text-sm text-gray-700 mb-1">New password:</p>
                  <p className="text-base font-mono font-bold">{newPassword}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Make sure to copy this password and provide it to the user. For security reasons, it will not be shown again.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-700 mb-4">
                  This will generate a new random password. The new password will be displayed only once.
                </p>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  onClick={closeModals}
                >
                  {newPassword ? 'Close' : 'Cancel'}
                </button>
                {!newPassword && (
                  <button
                    type="button"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    onClick={resetPassword}
                  >
                    Reset Password
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Delete User Modal */}
        {isDeleteModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete User</h3>
              
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete <span className="font-semibold">{selectedUser.email}</span>? This action cannot be undone.
              </p>
              
              <div className="p-3 bg-red-50 rounded-md border border-red-200 mb-4">
                <p className="text-sm text-red-700">
                  Warning: This will permanently delete the user account and all associated data. If this user has any active subscriptions or walks, they will also be affected.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  onClick={closeModals}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  onClick={deleteUser}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit User Modal */}
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                <button
                  type="button"
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={submitEditForm}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name:</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={editFormData.email}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="emailVerified" className="flex items-center">
                      <input
                        id="emailVerified"
                        name="emailVerified"
                        type="checkbox"
                        checked={editFormData.emailVerified}
                        onChange={handleEditInputChange}
                        className="h-4 w-4 border-gray-300 rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Verified</span>
                    </label>
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role:</label>
                    <select
                      id="role"
                      name="role"
                      value={editFormData.role}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="owner">Owner</option>
                      <option value="walker">Walker</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <UserImageUploader 
                      initialImageUrl={editFormData.image} 
                      onImageUploaded={handleImageUploaded}
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 