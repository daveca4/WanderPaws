'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RouteGuard from '@/components/RouteGuard';
import { SubscriptionPlan } from '@/lib/types';

interface EditSubscriptionPageProps {
  params: {
    id: string;
  };
}

export default function EditSubscriptionPage({ params }: EditSubscriptionPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SubscriptionPlan>({
    id: '',
    name: '',
    description: '',
    walkCredits: 0,
    walkDuration: 0,
    price: 0,
    validityPeriod: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  useEffect(() => {
    async function fetchSubscriptionPlan() {
      try {
        setLoading(true);
        const response = await fetch(`/api/subscriptions/plans/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Subscription plan not found');
          } else {
            throw new Error('Failed to fetch subscription plan');
          }
        }
        
        const data = await response.json();
        setFormData(data.plan);
      } catch (err) {
        console.error('Error fetching subscription plan:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchSubscriptionPlan();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/subscriptions/plans/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          updatedAt: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update subscription plan');
      }
      
      router.push('/admin/subscriptions');
    } catch (err) {
      console.error('Error updating subscription plan:', err);
      setError('Failed to update subscription plan. Please try again.');
    }
  };

  if (loading) {
    return (
      <RouteGuard requiredPermission={{ action: 'update', resource: 'subscription_plans' }}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </RouteGuard>
    );
  }

  if (error) {
    return (
      <RouteGuard requiredPermission={{ action: 'update', resource: 'subscription_plans' }}>
        <div className="p-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h1 className="text-xl font-bold text-red-600">Error</h1>
            <p className="my-4">{error}</p>
            <Link 
              href="/admin/subscriptions" 
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
            >
              Back to Subscription Plans
            </Link>
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requiredPermission={{ action: 'update', resource: 'subscription_plans' }}>
      <div className="p-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold">Edit Subscription Plan</h1>
            <Link 
              href="/admin/subscriptions" 
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </Link>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  rows={3}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Walk Credits
                  </label>
                  <input
                    type="number"
                    name="walkCredits"
                    value={formData.walkCredits}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    min={1}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Walk Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="walkDuration"
                    value={formData.walkDuration}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    min={15}
                    step={15}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (in pence)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    min={0}
                    required
                  />
                  <span className="text-sm text-gray-500">
                    £{(formData.price / 100).toFixed(2)}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Validity Period (days)
                  </label>
                  <input
                    type="number"
                    name="validityPeriod"
                    value={formData.validityPeriod}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    min={1}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  name="discountPercentage"
                  value={formData.discountPercentage || 0}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  min={0}
                  max={100}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active (available for purchase)
                </label>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Update Plan
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </RouteGuard>
  );
} 