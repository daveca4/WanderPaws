'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RouteGuard from '@/components/RouteGuard';
import { mockSubscriptionPlans, formatPrice } from '@/lib/mockSubscriptions';
import { SubscriptionPlan } from '@/lib/types';
import { generateId } from '@/utils/helpers';

export default function CreateSubscriptionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    walkCredits: 5,
    walkDuration: 60, // Fixed at 60 minutes
    price: 7500, // Starting price £75.00
    validityPeriod: 30,
    isActive: true,
    discountPercentage: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' || name === 'price' || name === 'walkCredits' || name === 'validityPeriod'
          ? Number(value) 
          : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    
    // Validate form
    if (!formData.name || !formData.description) {
      setFormError('Please fill in all required fields');
      setSaving(false);
      return;
    }
    
    if (formData.price <= 0 || formData.walkCredits <= 0 || formData.validityPeriod <= 0) {
      setFormError('Price, Walk Credits, and Validity Period must be greater than zero');
      setSaving(false);
      return;
    }
    
    // Simulate API call to create the plan
    setTimeout(() => {
      const now = new Date().toISOString();
      
      // Create a new plan
      const newPlan: SubscriptionPlan = {
        ...formData,
        id: generateId('plan'),
        createdAt: now,
        updatedAt: now
      };
      
      // In a real app, this would add the plan to the database
      console.log('Created new plan:', newPlan);
      
      // Update the mock data (for demo purposes)
      mockSubscriptionPlans.push(newPlan);
      
      setSaving(false);
      // Redirect to the subscriptions list page
      router.push('/admin/subscriptions');
    }, 1000);
  };

  return (
    <RouteGuard requiredPermission={{ action: 'create', resource: 'subscription_plans' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Subscription Plan</h1>
            <p className="mt-1 text-sm text-gray-500">
              Add a new subscription plan to your offerings
            </p>
          </div>
          <div>
            <Link
              href="/admin/subscriptions"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Cancel
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Plan Information
              </h2>
            </div>
            
            {formError && (
              <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {formError}
                    </h3>
                  </div>
                </div>
              </div>
            )}
            
            <div className="px-4 py-5 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Plan Name *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Basic Plan, Premium Plan"
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="mt-1">
                    <select
                      id="isActive"
                      name="isActive"
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={(e) => setFormData({
                        ...formData,
                        isActive: e.target.value === 'true'
                      })}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-700">
                    Discount Percentage
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      name="discountPercentage"
                      id="discountPercentage"
                      min="0"
                      max="100"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({
                        ...formData,
                        discountPercentage: Number(e.target.value)
                      })}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Set a custom discount percentage for this plan
                  </p>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      required
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe the benefits of this plan"
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="walkCredits" className="block text-sm font-medium text-gray-700">
                    Walk Credits *
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="walkCredits"
                      id="walkCredits"
                      min="1"
                      required
                      value={formData.walkCredits}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="walkDuration" className="block text-sm font-medium text-gray-700">
                    Walk Duration (minutes)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="walkDuration"
                      id="walkDuration"
                      value={formData.walkDuration}
                      disabled
                      className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      All walks are standardized to 60 minutes
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="validityPeriod" className="block text-sm font-medium text-gray-700">
                    Validity Period (days) *
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="validityPeriod"
                      id="validityPeriod"
                      min="1"
                      required
                      value={formData.validityPeriod}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price (in pounds) *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">£</span>
                    </div>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      min="1"
                      step="0.01"
                      required
                      value={formData.price / 100}
                      onChange={(e) => setFormData({
                        ...formData,
                        price: Math.round(parseFloat(e.target.value) * 100)
                      })}
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                      aria-describedby="price-currency"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="price-currency">
                        GBP
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Current price: {formatPrice(formData.price)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Plan...
                  </>
                ) : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </RouteGuard>
  );
} 