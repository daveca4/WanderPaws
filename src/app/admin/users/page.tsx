'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import RouteGuard from '@/components/RouteGuard';
import { format } from 'date-fns';
import UserImageUploader from '@/components/UserImageUploader';
import apiClient from '@/lib/api/client';
import { useAdminUsers, useUpdateUserRole } from '@/lib/hooks/useStandardizedAdminHooks';
import type { User } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [filterRole, setFilterRole] = useState('all');
  const [filterVerified, setFilterVerified] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  const {
    data: usersData,
    isPending: loading,
    error,
    refetch: refetchUsers,
  } = useAdminUsers(page, limit, {
    role: filterRole === 'all' ? undefined : filterRole,
    emailVerified: filterVerified === 'all' ? undefined : filterVerified === 'verified',
    search: searchTerm || undefined,
  });

  const users = usersData?.users || [];
  const totalUsers = usersData?.total || 0;
  const totalPages = Math.ceil(totalUsers / limit);

  useEffect(() => {
    if (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load users');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [error]);

  useEffect(() => {
    refetchUsers();
  }, [filterRole, filterVerified, searchTerm, page, limit, refetchUsers]);

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const toggleVerificationStatus = async (userToUpdate: User) => {
    clearMessages();
    try {
      const response = await apiClient.patch(`/admin/users/${userToUpdate.id}/verify`, {
        emailVerified: !userToUpdate.emailVerified,
      });

      if (!response.ok) {
        throw new Error(response.error || 'Failed to update verification status');
      }

      refetchUsers();
      setSuccessMessage(`Email verification updated for ${userToUpdate.email}`);
      setTimeout(clearMessages, 3000);
    } catch (err) {
      console.error('Error updating verification:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Update failed');
      setTimeout(clearMessages, 3000);
    }
  };

  const openResetPasswordModal = (userToReset: User) => {
    setSelectedUser(userToReset);
    setNewPassword(null);
    setIsResetPasswordModalOpen(true);
    clearMessages();
  };

  const resetPassword = async () => {
    if (!selectedUser) return;
    clearMessages();
    try {
      const response = await apiClient.post(`/admin/users/${selectedUser.id}/reset-password`, {});

      if (!response.ok) {
        throw new Error(response.error || 'Failed to reset password');
      }

      const data = response.data;
      setNewPassword(data.newPassword);
      setSuccessMessage(`Password has been reset for ${selectedUser.email}`);
    } catch (err) {
      console.error('Error resetting password:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Password reset failed');
    }
  };

  const openDeleteModal = (userToDelete: User) => {
    setSelectedUser(userToDelete);
    setIsDeleteModalOpen(true);
    clearMessages();
  };

  const deleteUser = async () => {
    if (!selectedUser) return;
    clearMessages();
    try {
      const response = await apiClient.delete(`/admin/users/${selectedUser.id}`);

      if (!response.ok) {
        throw new Error(response.error || 'Failed to delete user');
      }

      refetchUsers();
      closeModals();
      setSuccessMessage(`User ${selectedUser.email} has been deleted`);
      setTimeout(clearMessages, 3000);
    } catch (err) {
      console.error('Error deleting user:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Delete failed');
      setTimeout(clearMessages, 3000);
    }
  };

  const closeModals = () => {
    setIsResetPasswordModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedUser(null);
    setNewPassword(null);
    clearMessages();
  };

  const { mutate: updateUser, isPending: isUpdatingUser } = useUpdateUserRole();

  const openEditModal = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setEditFormData({
      id: userToEdit.id,
      name: userToEdit.name || '',
      email: userToEdit.email,
      emailVerified: userToEdit.emailVerified ?? false,
      role: userToEdit.role,
      image: userToEdit.image || '',
    });
    setIsEditModalOpen(true);
    clearMessages();
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUploaded = (imageUrl: string) => {
    setEditFormData(prev => ({ ...prev, image: imageUrl }));
  };

  const submitEditForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    clearMessages();

    try {
      const updatePayload = { ...editFormData };
      delete updatePayload.id;

      const response = await apiClient.patch(`/admin/users/${selectedUser.id}`, updatePayload);
      if (!response.ok) {
        throw new Error(response.error || 'Failed to update user');
      }

      setSuccessMessage(`User ${selectedUser.email} updated successfully.`);
      refetchUsers();
      closeModals();
      setTimeout(clearMessages, 3000);
    } catch (err) {
      console.error('Error updating user:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Update failed');
    }
  };

  if (!authUser || authUser.role !== 'admin') {
    return <div className="p-4 text-red-600">Access Denied. Requires Admin role.</div>;
  }

  return (
    <RouteGuard requiredPermission={{ action: 'manage', resource: 'users' }}>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Manage Users ({totalUsers})</h1>
          <Link
            href="/admin/users/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Create New User
          </Link>
        </div>

        {successMessage && <div className="p-3 bg-green-100 text-green-700 rounded-md">{successMessage}</div>}
        {errorMessage && <div className="p-3 bg-red-100 text-red-700 rounded-md">{errorMessage}</div>}

        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name or Email..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700">Role</label>
              <select
                id="roleFilter"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="all">All Roles</option>
                <option value="owner">Owners</option>
                <option value="walker">Walkers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <div>
              <label htmlFor="verifiedFilter" className="block text-sm font-medium text-gray-700">Email Verified</label>
              <select
                id="verifiedFilter"
                value={filterVerified}
                onChange={(e) => setFilterVerified(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
            <div>
              <label htmlFor="limit" className="block text-sm font-medium text-gray-700">Users per page</label>
              <select
                id="limit"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          {loading && page === 1 ? (
            <div className="flex justify-center items-center h-60"><LoadingSpinner /></div>
          ) : (
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email Verified</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created At</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.length === 0 && !loading ? (
                  <tr><td colSpan={5} className="py-4 text-center text-gray-500">No users found.</td></tr>
                ) : (
                  users.map((userItem) => (
                    <tr key={userItem.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={userItem.image || '/default-avatar.png'}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{userItem.name || 'N/A'}</div>
                            <div className="text-gray-500">{userItem.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          userItem.role === 'admin' ? 'bg-red-100 text-red-800' :
                          userItem.role === 'walker' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {userItem.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <button
                          onClick={() => toggleVerificationStatus(userItem)}
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            userItem.emailVerified ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {userItem.emailVerified ? 'Verified' : 'Unverified'}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {userItem.createdAt ? format(new Date(userItem.createdAt), 'MMM d, yyyy') : 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(userItem)}
                            className="text-indigo-600 hover:text-indigo-900 text-xs p-1 hover:bg-indigo-50 rounded" title="Edit">
                            Edit
                          </button>
                          <button
                            onClick={() => openResetPasswordModal(userItem)}
                            className="text-blue-600 hover:text-blue-900 text-xs p-1 hover:bg-blue-50 rounded" title="Reset Password">
                            Reset PW
                          </button>
                          <button
                            onClick={() => openDeleteModal(userItem)}
                            className="text-red-600 hover:text-red-900 text-xs p-1 hover:bg-red-50 rounded" title="Delete">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {loading && page > 1 && (
                  <tr><td colSpan={5} className="py-4 text-center"><LoadingSpinner /></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-lg shadow">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalUsers)}</span> of{' '}
                <span className="font-medium">{totalUsers}</span> results
              </p>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="relative inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="relative inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {isResetPasswordModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full space-y-4">
               <h3 className="text-lg font-medium text-gray-900">Reset User Password</h3>
              <p>Are you sure you want to reset the password for <strong>{selectedUser.email}</strong>?</p>
              {newPassword ? (
                <div>
                  <p className="text-green-600 font-semibold">Password reset successfully!</p>
                  <p>New temporary password:</p>
                  <pre className="bg-gray-100 p-2 rounded mt-1 font-mono text-sm">{newPassword}</pre>
                  <p className="text-xs text-gray-500 mt-1">Please provide this to the user. They should change it upon next login.</p>
                </div>
              ) : (
                <button
                  onClick={resetPassword}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  disabled={!!errorMessage}
                >
                  Reset Password
                </button>
              )}
               {errorMessage && <p className="text-sm text-red-600 mt-2">{errorMessage}</p>}
              <button
                onClick={closeModals}
                className="mt-2 w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
           </div>
          )}

        {/* Delete User Modal */}
         {isDeleteModalOpen && selectedUser && (
           <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
             <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full space-y-4">
               <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
              <p>Are you sure you want to permanently delete the user <strong>{selectedUser.email}</strong>?</p>
              <p className="text-sm text-red-600">This action cannot be undone.</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeModals}
                  type="button"
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteUser}
                  type="button"
                  className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Delete User
                </button>
              </div>
               {errorMessage && <p className="text-sm text-red-600 mt-2">{errorMessage}</p>}
            </div>
           </div>
          )}

        {/* Edit User Modal */}
         {isEditModalOpen && selectedUser && (
           <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
             <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full my-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{`Edit User: ${selectedUser?.email || ''}`}</h3>
             <form onSubmit={submitEditForm} className="space-y-4">
               <div>
                 <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                 <input
                   type="text"
                   name="name"
                   id="name"
                   value={editFormData.name || ''}
                   onChange={handleEditInputChange}
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                 />
               </div>
               <div>
                 <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                 <input
                   type="email"
                   name="email"
                   id="email"
                   value={editFormData.email || ''}
                   onChange={handleEditInputChange}
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                   required
                 />
               </div>
               <div>
                 <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                 <select
                   name="role"
                   id="role"
                   value={editFormData.role || 'owner'}
                   onChange={handleEditInputChange}
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                 >
                   <option value="owner">Owner</option>
                   <option value="walker">Walker</option>
                   <option value="admin">Admin</option>
                 </select>
               </div>
                <div className="flex items-center">
                   <input
                     id="emailVerified"
                     name="emailVerified"
                     type="checkbox"
                     checked={editFormData.emailVerified || false}
                     onChange={handleEditInputChange}
                     className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                   />
                   <label htmlFor="emailVerified" className="ml-2 block text-sm text-gray-900">Email Verified</label>
                 </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">Profile Image</label>
                 <UserImageUploader
                    initialImageUrl={editFormData.image || undefined}
                    onImageUploaded={handleImageUploaded}
                 />
                 {editFormData.image && (
                   <img src={editFormData.image} alt="Current" className="mt-2 h-20 w-20 rounded-full object-cover" />
                 )}
               </div>

               {errorMessage && <p className="text-sm text-red-600 mt-2">{errorMessage}</p>}

               <div className="flex justify-end space-x-2 pt-4">
                 <button
                   type="button"
                   onClick={closeModals}
                   className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                   disabled={isUpdatingUser}
                 >
                   {isUpdatingUser ? 'Saving...' : 'Save Changes'}
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