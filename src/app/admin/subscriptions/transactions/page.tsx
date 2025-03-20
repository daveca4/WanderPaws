'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RouteGuard from '@/components/RouteGuard';
import { 
  mockSubscriptionTransactions,
  formatPrice, 
} from '@/lib/mockSubscriptions';
import { SubscriptionTransaction } from '@/lib/types';

export default function SubscriptionTransactionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<SubscriptionTransaction[]>([]);
  const [filter, setFilter] = useState('all'); // 'all', 'purchase', 'refund', 'credit_adjustment'

  useEffect(() => {
    // Load data
    setTransactions(mockSubscriptionTransactions);
    setLoading(false);
  }, []);

  const filteredTransactions = transactions.filter(trans => {
    if (filter === 'all') return true;
    return trans.type === filter;
  });

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100 text-green-800';
      case 'refund':
        return 'bg-red-100 text-red-800';
      case 'credit_adjustment':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'purchase':
        return 'Purchase';
      case 'refund':
        return 'Refund';
      case 'credit_adjustment':
        return 'Credit Adjustment';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'subscription_transactions' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription Transactions</h1>
            <p className="mt-1 text-sm text-gray-500">
              View all subscription-related transactions
            </p>
          </div>
          <div className="flex space-x-2">
            <Link
              href="/admin/subscriptions"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Back to Plans
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Transaction History
            </h2>
            <div className="flex items-center space-x-2">
              <label htmlFor="filter" className="text-sm font-medium text-gray-700">
                Filter:
              </label>
              <select
                id="filter"
                name="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              >
                <option value="all">All Transactions</option>
                <option value="purchase">Purchases Only</option>
                <option value="refund">Refunds Only</option>
                <option value="credit_adjustment">Credit Adjustments Only</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((trans) => (
                    <tr key={trans.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {trans.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link 
                          href={`/admin/subscriptions/users/${trans.userSubscriptionId}`}
                          className="text-primary-600 hover:underline"
                        >
                          {trans.userSubscriptionId}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(trans.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(trans.type)}`}>
                          {getTypeLabel(trans.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(trans.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          trans.status === 'successful' 
                            ? 'bg-green-100 text-green-800' 
                            : trans.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {trans.status.charAt(0).toUpperCase() + trans.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {trans.paymentMethod === 'credit_card' ? 'Credit Card' : 
                         trans.paymentMethod === 'paypal' ? 'PayPal' : 
                         trans.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => alert(`View transaction ${trans.id} details`)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Transaction Management
            </h2>
          </div>
          <div className="px-4 py-5 sm:px-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-2">Process Refund</h3>
              <p className="text-sm text-gray-500 mb-4">Process a refund for a subscription purchase.</p>
              <button
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                onClick={() => alert('This would open a form to process a refund')}
              >
                Process Refund
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-2">Export Transactions</h3>
              <p className="text-sm text-gray-500 mb-4">Export transaction data to CSV for accounting purposes.</p>
              <button
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                onClick={() => alert('This would export transaction data to CSV')}
              >
                Export to CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 