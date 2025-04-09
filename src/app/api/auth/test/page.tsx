'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function AuthTestPage() {
  const { user, session } = useAuth();
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to test authentication
  const testAuth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/test');
      const data = await response.json();
      setApiStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test auth');
      console.error('Auth test error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a test user for debugging
  const createTestUser = () => {
    const testUser = {
      id: 'test_user_' + Date.now(),
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      profileId: 'test_profile_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    
    // Save to localStorage
    localStorage.setItem('wanderpaws_user', JSON.stringify(testUser));
    
    // Create a session
    const session = {
      userId: testUser.id,
      role: testUser.role,
      profileId: testUser.profileId,
      token: 'test_token_' + Date.now(),
    };
    
    localStorage.setItem('wanderpaws_session', JSON.stringify(session));
    
    // Refresh the page
    window.location.reload();
  };

  // Automatically run test on page load
  useEffect(() => {
    testAuth();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Current User</h2>
        {user ? (
          <div>
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Profile ID:</strong> {user.profileId || 'None'}</p>
          </div>
        ) : (
          <p className="text-red-500">No user logged in</p>
        )}
      </div>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Current Session</h2>
        {session ? (
          <div>
            <p><strong>User ID:</strong> {session.userId}</p>
            <p><strong>Role:</strong> {session.role}</p>
            <p><strong>Profile ID:</strong> {session.profileId || 'None'}</p>
            <p><strong>Has Token:</strong> {session.token ? 'Yes' : 'No'}</p>
          </div>
        ) : (
          <p className="text-red-500">No active session</p>
        )}
      </div>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">API Authentication Test</h2>
        <div className="flex space-x-4 mb-4">
          <button 
            onClick={testAuth}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
            disabled={isLoading}
          >
            {isLoading ? 'Testing...' : 'Test API Auth'}
          </button>
          
          <button 
            onClick={createTestUser}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Create Test Admin
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {apiStatus && (
          <div className="border rounded p-4 bg-white">
            <p><strong>Authenticated:</strong> {apiStatus.authenticated ? 'Yes' : 'No'}</p>
            <p><strong>User ID:</strong> {apiStatus.userId || 'None'}</p>
            <p><strong>Role:</strong> {apiStatus.role || 'None'}</p>
            <p><strong>Profile ID:</strong> {apiStatus.profileId || 'None'}</p>
            
            <h3 className="font-semibold mt-4 mb-2">Headers</h3>
            <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-60 text-xs">
              {JSON.stringify(apiStatus.headers, null, 2)}
            </pre>
            
            <h3 className="font-semibold mt-4 mb-2">Cookies</h3>
            <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-60 text-xs">
              {JSON.stringify(apiStatus.cookies, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 