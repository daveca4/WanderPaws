'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  getUserSubscriptionById,
  getSubscriptionPlans,
  updateUserSubscription,
  formatPrice
} from '@/lib/subscriptionService';
import { UserSubscription } from '@/lib/types';
import RouteGuard from '@/components/RouteGuard';

// Extended UserSubscription interface for the form
interface ExtendedUserSubscription extends UserSubscription {
  totalCredits?: number;
  creditsUsed?: number;
  amountPaid?: number;
  paymentMethod?: string;
  expiryDate?: string;
  notes?: string;
}

export default function EditUserSubscriptionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExtendedUserSubscription | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch the user subscription by ID
        const subscription = await getUserSubscriptionById(id);
        
        if (subscription) {
          setFormData(subscription as ExtendedUserSubscription);
        }
        
        // Fetch subscription plans for the dropdown
        const plans = await getSubscriptionPlans();
        setSubscriptionPlans(plans.map(plan => ({
          id: plan.id,
          name: plan.name
        })));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (!formData) return;
    
    // Handle numeric fields
    if (name === 'totalCredits' || name === 'creditsUsed') {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0
      });
    } else if (name === 'amountPaid') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData) return;

    // Validation
    if ((formData.totalCredits ?? 0) < (formData.creditsUsed ?? 0)) {
      setFormError('Total credits cannot be less than credits used');
      return;
    }

    if ((formData.amountPaid ?? 0) < 0) {
      setFormError('Amount paid cannot be negative');
      return;
    }
    
    try {
      setSaving(true);
      setFormError(null);
      
      // Update the subscription using the API service
      const updatedSubscription = await updateUserSubscription(id, formData);
      
      if (!updatedSubscription) {
        throw new Error('Failed to update subscription');
      }
      
      // Redirect to user subscription detail page after successful update
      router.push(`/admin/subscriptions/users/${id}`);
    } catch (error) {
      console.error('Error updating subscription:', error);
      setFormError('Failed to update subscription. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Helper function to get subscription plans for the dropdown
  const getSubscriptionPlans = () => {
    return subscriptionPlans;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="py-8 px-4 max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription Not Found</h2>
          <p className="text-gray-600 mb-6">The subscription you are looking for does not exist or has been removed.</p>
          <Link
            href="/admin/subscriptions/users"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Return to User Subscriptions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard requiredPermission={{ action: 'update', resource: 'user_subscriptions' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit User Subscription</h1>
            <p className="mt-1 text-sm text-gray-500">
              Modify subscription #{formData.id}
            </p>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/admin/subscriptions/users/${id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </div>

        {formError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{formError}</h3>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Subscription Information
              </h2>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                <div>
                  <label htmlFor="planId" className="block text-sm font-medium text-gray-700">Subscription Plan</label>
                  <select
                    id="planId"
                    name="planId"
                    value={formData.planId}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  >
                    {getSubscriptionPlans().map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="totalCredits" className="block text-sm font-medium text-gray-700">Total Credits</label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="totalCredits"
                      id="totalCredits"
                      min="0"
                      value={formData.totalCredits}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="creditsUsed" className="block text-sm font-medium text-gray-700">Credits Used</label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="creditsUsed"
                      id="creditsUsed"
                      min="0"
                      value={formData.creditsUsed}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700">Amount Paid</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="amountPaid"
                      id="amountPaid"
                      min="0"
                      step="0.01"
                      value={formData.amountPaid}
                      onChange={handleChange}
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">Purchase Date</label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="purchaseDate"
                      id="purchaseDate"
                      value={formData.purchaseDate.split('T')[0]}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="expiryDate"
                      id="expiryDate"
                      value={formData.expiryDate?.split('T')[0] || ''}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                  <div className="mt-1">
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={formData.notes || ''}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Add any additional notes about this subscription.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href={`/admin/subscriptions/users/${id}`}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </RouteGuard>
  );
} 