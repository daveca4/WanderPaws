'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function StripeTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const testStripeConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/stripe/test');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API returned an error');
      }
      
      const data = await response.json();
      setTestResult(data);
    } catch (err) {
      console.error('Error testing Stripe:', err);
      setError(`Failed to test Stripe connection: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Stripe Integration Test</h1>
      
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Current User Info</h2>
        {user ? (
          <div>
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
          </div>
        ) : (
          <p className="text-red-500">No user logged in. Please log in to test the Stripe integration.</p>
        )}
      </div>
      
      <div className="mb-6">
        <button
          onClick={testStripeConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Stripe Connection'}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {testResult && (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Test Result</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <pre>{JSON.stringify(testResult, null, 2)}</pre>
          </div>
        </div>
      )}
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Environment Variables Check (Client-Side)</h2>
        <p className="mb-2">These should all be set for the client:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Not set'}</li>
          <li>NEXT_PUBLIC_BASE_URL: {process.env.NEXT_PUBLIC_BASE_URL || '❌ Not set'}</li>
        </ul>
        <p className="mt-4 mb-2 text-yellow-600">Note: Secret keys like STRIPE_SECRET_KEY should only be accessible on the server side.</p>
      </div>
      
      <div className="p-4 border rounded bg-blue-50">
        <h2 className="text-xl font-semibold mb-2">Quick Test Steps</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Click "Test Stripe Connection" to verify the Stripe API connection.</li>
          <li>If successful, try subscribing to a plan from the subscription page.</li>
          <li>If you encounter any errors, check the browser's console for more details.</li>
        </ol>
      </div>
    </div>
  );
} 