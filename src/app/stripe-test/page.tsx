'use client';

import { useState, useEffect } from 'react';

export default function StripeTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testStripeConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/stripe/test');
      const data = await response.json();
      
      setTestResult(data);
    } catch (err) {
      console.error('Error testing Stripe:', err);
      setError('Failed to test Stripe connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Stripe Integration Test</h1>
      
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
        <h2 className="text-xl font-semibold mb-2">Environment Variables Check</h2>
        <p className="mb-2">These should all be set:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>STRIPE_SECRET_KEY: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Not set'}</li>
          <li>NEXT_PUBLIC_BASE_URL: {process.env.NEXT_PUBLIC_BASE_URL || '❌ Not set'}</li>
        </ul>
      </div>
    </div>
  );
} 