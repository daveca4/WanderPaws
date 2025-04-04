'use client';

import { useState, useEffect } from 'react';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import { useOwnerByUserId } from '@/lib/hooks/useDataHooks';
import { Owner } from '@/lib/types';
import apiClient from '@/lib/api/client';

interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  pushNotifications: boolean;
}

interface PaymentMethod {
  id: number;
  type: string;
  last4?: string;
  expiry?: string;
  email?: string;
  isDefault: boolean;
}

// Modified profile type that allows for string address
interface ProfileData {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string; // String address instead of complex object
  notificationPreferences?: NotificationPreferences;
  paymentMethods?: PaymentMethod[];
}

export default function OwnerProfilePage() {
  const { user } = useAuth();
  const { data: ownerData, isLoading, error, refetch } = useOwnerByUserId();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>({});

  // Populate form with owner data when available
  useEffect(() => {
    if (ownerData) {
      // Map the owner data to our form structure
      setProfile({
        id: ownerData.id,
        name: ownerData.name || '',
        email: ownerData.email || '',
        phone: ownerData.phone || '',
        // Handle address whether it's a string or an object
        address: typeof ownerData.address === 'string' 
          ? ownerData.address 
          : ownerData.address 
            ? `${ownerData.address.street}, ${ownerData.address.city}, ${ownerData.address.state} ${ownerData.address.zip}`
            : '',
        notificationPreferences: {
          email: true,
          sms: true,
          pushNotifications: false,
        },
        // Payment methods would typically come from a payment service API
        paymentMethods: []
      });
    }
  }, [ownerData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfile(prev => {
        if (parent === 'notificationPreferences' && prev.notificationPreferences) {
          return {
            ...prev,
            notificationPreferences: {
              ...prev.notificationPreferences,
              [child]: type === 'checkbox' 
                ? (e.target as HTMLInputElement).checked 
                : value
            }
          };
        }
        return {...prev};
      });
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    
    try {
      if (!profile.id) {
        throw new Error('Profile ID is missing');
      }
      
      // Extract the basic owner data to update
      const ownerUpdate = {
        id: profile.id, // Include ID in the update payload
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
      };
      
      // Use standard POST to the update endpoint instead
      const session = localStorage.getItem('wanderpaws_session') 
        ? JSON.parse(localStorage.getItem('wanderpaws_session') || '{}')
        : null;
      
      // Try using the new generic data update endpoint
      const response = await fetch(`/api/data/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': session?.userId || user?.id || '',
          'user-role': session?.role || user?.role || '',
          'user-profile-id': session?.profileId || profile?.id || '',
        },
        body: JSON.stringify({
          type: 'owner',
          data: ownerUpdate
        })
      });
      
      let responseData;
      try {
        responseData = await response.json();
      } catch (err) {
        console.error('Error parsing response:', err);
        throw new Error('Failed to parse server response');
      }
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update profile');
      }
      
      // Update local state with the response data
      console.log('Profile updated successfully:', responseData);
      setProfile(responseData);
      
      // Show success message
      setSuccessMessage('Profile updated successfully');
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <RouteGuard requiredPermission={{ action: 'access', resource: 'owner-dashboard' }}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
              <p className="mt-1 text-sm text-gray-500">
                View and manage your account information
              </p>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg overflow-hidden p-6">
            <div className="animate-pulse flex flex-col space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </RouteGuard>
    );
  }

  // Render error state
  if (error) {
    return (
      <RouteGuard requiredPermission={{ action: 'access', resource: 'owner-dashboard' }}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
              <p className="mt-1 text-sm text-gray-500">
                View and manage your account information
              </p>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg overflow-hidden p-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">
                {error instanceof Error ? error.message : 'Failed to load your profile'}
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'owner-dashboard' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your account information
            </p>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="profile-form"
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
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
        {errorMessage && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <form id="profile-form" onSubmit={handleSubmit}>
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Information</h3>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={profile.name || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={profile.email || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={profile.phone || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={typeof profile.address === 'string' ? profile.address : ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </RouteGuard>
  );
} 