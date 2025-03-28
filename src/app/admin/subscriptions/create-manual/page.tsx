'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import RouteGuard from '@/components/RouteGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Define types for our data
interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  walkCredits: number;
}

export default function CreateManualSubscriptionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    durationDays: 30,
    creditsOverride: '',
    notes: ''
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setApiError(null);
        
        // Fetch users
        console.log('Fetching users...');
        const usersResponse = await fetch('/api/admin/users?role=owner', {
          headers: {
            'user-id': user?.id || '',
            'user-role': user?.role || ''
          }
        });
        
        if (!usersResponse.ok) {
          const errorText = await usersResponse.text();
          console.error('Failed to fetch users:', errorText);
          setApiError(`Failed to fetch users: ${usersResponse.status} ${errorText}`);
          setUsers([]);
        } else {
          const usersData = await usersResponse.json();
          console.log('Users data:', usersData);
          setUsers(usersData.users || []);
        }
        
        // Fetch subscription plans
        console.log('Fetching subscription plans...');
        const plansResponse = await fetch('/api/subscriptions/plans', {
          headers: {
            'user-id': user?.id || '',
            'user-role': user?.role || ''
          }
        });
        
        if (!plansResponse.ok) {
          const errorText = await plansResponse.text();
          console.error('Failed to fetch plans:', errorText);
          setApiError((prev) => `${prev ? prev + '; ' : ''}Failed to fetch plans: ${plansResponse.status} ${errorText}`);
          setPlans([]);
        } else {
          const plansData = await plansResponse.json();
          console.log('Plans data:', plansData);
          setPlans(plansData.plans || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setApiError(`Exception fetching data: ${error instanceof Error ? error.message : String(error)}`);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch data if user is logged in and is an admin
    if (user && user.role === 'admin') {
      fetchData();
    } else {
      setApiError('You must be logged in as an admin to access this page');
      setIsLoading(false);
    }
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    
    try {
      // Prepare data for submission
      const dataToSubmit = {
        ...formData,
        creditsOverride: formData.creditsOverride 
          ? parseInt(formData.creditsOverride, 10) 
          : undefined,
        durationDays: parseInt(formData.durationDays.toString(), 10)
      };
      
      // Submit the form data to create a subscription
      const response = await fetch('/api/admin/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id || '',
          'user-role': user?.role || ''
        },
        body: JSON.stringify(dataToSubmit)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }
      
      // Show success message
      setSuccess('Subscription created successfully!');
      
      // Reset form
      setFormData({
        userId: '',
        planId: '',
        startDate: new Date().toISOString().split('T')[0],
        durationDays: 30,
        creditsOverride: '',
        notes: ''
      });
      
      // Redirect after a delay
      setTimeout(() => {
        router.push('/admin/subscriptions');
      }, 2000);
      
    } catch (error: unknown) {
      console.error('Error creating subscription:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to create subscription. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (user && user.role !== 'admin') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Manual Subscription</h1>
          </div>
          <Link 
            href="/admin/subscriptions" 
            className="px-4 py-2 text-sm bg-gray-100 rounded text-gray-600 hover:bg-gray-200"
          >
            Back to Subscriptions
          </Link>
        </div>
        
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">You do not have admin permissions to access this page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <RouteGuard requiredPermission={{ action: 'create', resource: 'subscriptions' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Manual Subscription</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manually create a subscription for a user
            </p>
          </div>
          <Link 
            href="/admin/subscriptions" 
            className="px-4 py-2 text-sm bg-gray-100 rounded text-gray-600 hover:bg-gray-200"
          >
            Back to Subscriptions
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
          <div className="space-y-6">
            {/* User Selection */}
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                User
              </label>
              <select
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || 'Unnamed'} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Plan Selection */}
            <div>
              <label htmlFor="planId" className="block text-sm font-medium text-gray-700">
                Subscription Plan
              </label>
              <select
                id="planId"
                name="planId"
                value={formData.planId}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Select a plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {(plan.price / 100).toFixed(2)} £ ({plan.walkCredits} walks)
                  </option>
                ))}
              </select>
            </div>
            
            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            
            {/* Duration */}
            <div>
              <label htmlFor="durationDays" className="block text-sm font-medium text-gray-700">
                Duration (Days)
              </label>
              <input
                type="number"
                id="durationDays"
                name="durationDays"
                value={formData.durationDays.toString()}
                onChange={handleInputChange}
                min="1"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            
            {/* Credits Override */}
            <div>
              <label htmlFor="creditsOverride" className="block text-sm font-medium text-gray-700">
                Credits Override (Optional)
              </label>
              <input
                type="number"
                id="creditsOverride"
                name="creditsOverride"
                value={formData.creditsOverride}
                onChange={handleInputChange}
                min="0"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Leave empty to use plan default"
              />
              <p className="mt-1 text-xs text-gray-500">
                If set, this will override the default number of credits from the plan
              </p>
            </div>
            
            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Admin Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Optional notes about this subscription"
              />
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Subscription'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </RouteGuard>
  );
} 