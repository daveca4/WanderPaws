'use client';

import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';

interface PaymentMethod {
  id: number;
  type: string;
  last4?: string;
  expiry?: string;
  email?: string;
  isDefault: boolean;
}

interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  pushNotifications: boolean;
}

interface OwnerProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  preferredContactMethod: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notificationPreferences: NotificationPreferences;
  paymentMethods: PaymentMethod[];
}

export default function OwnerProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<OwnerProfile>({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '(555) 123-4567',
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94105',
    preferredContactMethod: 'email',
    emergencyContactName: 'Jane Smith',
    emergencyContactPhone: '(555) 987-6543',
    notificationPreferences: {
      email: true,
      sms: true,
      pushNotifications: false,
    },
    paymentMethods: [
      { id: 1, type: 'credit_card', last4: '4242', expiry: '04/25', isDefault: true },
      { id: 2, type: 'paypal', email: 'john.smith@example.com', isDefault: false }
    ]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfile(prev => {
        if (parent === 'notificationPreferences') {
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
        return prev;
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
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would make an API call to save profile
    console.log('Profile saved:', profile);
    
    setIsSaving(false);
    setIsEditing(false);
  };

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

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <form id="profile-form" onSubmit={handleSubmit}>
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Information</h3>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={profile.firstName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={profile.lastName}
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
                      value={profile.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone number
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      value={profile.phone}
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
                      value={profile.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="city"
                      id="city"
                      value={profile.city}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="state"
                      id="state"
                      value={profile.state}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
                    ZIP / Postal code
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="zip"
                      id="zip"
                      value={profile.zip}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Emergency Contact</h3>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="emergencyContactName"
                      id="emergencyContactName"
                      value={profile.emergencyContactName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">
                    Phone number
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="emergencyContactPhone"
                      id="emergencyContactPhone"
                      value={profile.emergencyContactPhone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Notification Preferences</h3>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notificationPreferences.email"
                      name="notificationPreferences.email"
                      type="checkbox"
                      checked={profile.notificationPreferences.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="notificationPreferences.email" className="font-medium text-gray-700">Email</label>
                    <p className="text-gray-500">Receive notifications via email</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notificationPreferences.sms"
                      name="notificationPreferences.sms"
                      type="checkbox"
                      checked={profile.notificationPreferences.sms}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="notificationPreferences.sms" className="font-medium text-gray-700">SMS</label>
                    <p className="text-gray-500">Receive text message notifications</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notificationPreferences.pushNotifications"
                      name="notificationPreferences.pushNotifications"
                      type="checkbox"
                      checked={profile.notificationPreferences.pushNotifications}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="notificationPreferences.pushNotifications" className="font-medium text-gray-700">Push Notifications</label>
                    <p className="text-gray-500">Receive push notifications on your mobile device</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Payment Methods</h3>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-6">
                {profile.paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                    <div className="flex items-center">
                      {method.type === 'credit_card' ? (
                        <div className="flex items-center">
                          <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              Credit Card ending in {method.last4}
                            </p>
                            <p className="text-xs text-gray-500">Expires {method.expiry}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">PayPal</p>
                            <p className="text-xs text-gray-500">{method.email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      {method.isDefault && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Default
                        </span>
                      )}
                      
                      {isEditing && (
                        <button
                          type="button"
                          className="ml-4 text-sm text-primary-600 hover:text-primary-900"
                        >
                          {method.isDefault ? 'Edit' : 'Make Default'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {isEditing && (
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Payment Method
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </RouteGuard>
  );
} 