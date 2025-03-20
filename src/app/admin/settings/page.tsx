'use client';

import { useState } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    walkDurationIncrement: 15,
    maxWalksPerDay: 2,
    maxDogsPerWalker: 6,
    emailNotifications: true,
    maintenanceMode: false,
    allowNewRegistrations: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? parseInt(value) 
          : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would make an API call to save settings
    console.log('Settings saved:', settings);
    
    setSaving(false);
  };

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure application settings and preferences
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Application Settings
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              These settings affect how the application operates
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Walk Duration Increment */}
              <div>
                <label htmlFor="walkDurationIncrement" className="block text-sm font-medium text-gray-700">
                  Walk Duration Increment (minutes)
                </label>
                <select
                  id="walkDurationIncrement"
                  name="walkDurationIncrement"
                  value={settings.walkDurationIncrement}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                </select>
              </div>

              {/* Max Walks Per Day */}
              <div>
                <label htmlFor="maxWalksPerDay" className="block text-sm font-medium text-gray-700">
                  Maximum Walks Per Day
                </label>
                <input
                  type="number"
                  id="maxWalksPerDay"
                  name="maxWalksPerDay"
                  min={1}
                  max={5}
                  value={settings.maxWalksPerDay}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              {/* Max Dogs Per Walker */}
              <div>
                <label htmlFor="maxDogsPerWalker" className="block text-sm font-medium text-gray-700">
                  Maximum Dogs Per Walker
                </label>
                <input
                  type="number"
                  id="maxDogsPerWalker"
                  name="maxDogsPerWalker"
                  min={1}
                  max={10}
                  value={settings.maxDogsPerWalker}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
              
              {/* Email Notifications */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="emailNotifications"
                    name="emailNotifications"
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={handleChange}
                    className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="emailNotifications" className="font-medium text-gray-700">
                    Enable Email Notifications
                  </label>
                  <p className="text-gray-500">Send email notifications for bookings, cancellations, and other events.</p>
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="maintenanceMode"
                    name="maintenanceMode"
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={handleChange}
                    className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="maintenanceMode" className="font-medium text-gray-700">
                    Maintenance Mode
                  </label>
                  <p className="text-gray-500">Put the application in maintenance mode. Only admins will be able to access it.</p>
                </div>
              </div>

              {/* Allow New Registrations */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="allowNewRegistrations"
                    name="allowNewRegistrations"
                    type="checkbox"
                    checked={settings.allowNewRegistrations}
                    onChange={handleChange}
                    className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="allowNewRegistrations" className="font-medium text-gray-700">
                    Allow New Registrations
                  </label>
                  <p className="text-gray-500">Allow new user registrations. Disable to temporarily prevent new signups.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link
                href="/admin"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </RouteGuard>
  );
} 