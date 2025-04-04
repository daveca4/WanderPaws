'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { TabbedDashboard } from '@/components/admin/TabbedDashboard';
import apiClient from '@/lib/api/client';

// A simple component to show raw data from the API
function DataDebug() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user || user.role !== 'admin') return;
    
    setLoading(true);
    setError(null);
    
    try {
      const headers: Record<string, string> = {};
      if (user.id) headers['user-id'] = user.id;
      if (user.role) headers['user-role'] = user.role;
      if (user.profileId) headers['user-profile-id'] = user.profileId;
      
      const response = await apiClient.get('/admin/dashboard', { headers });
      console.log('DataDebug - Direct API response:', response);
      
      if (response.status === 401) {
        setError('Unauthorized: Only admins can access dashboard stats');
        return;
      }
      
      if (!response.ok) {
        setError(response.error || 'Failed to fetch dashboard data');
        return;
      }
      
      setData(response.data);
    } catch (err) {
      console.error('DataDebug - Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 w-1/3 bg-white shadow-lg p-2 z-50 overflow-y-auto max-h-screen">
      <h3 className="text-sm font-bold">Raw API Data</h3>
      <button
        onClick={fetchData}
        className="mt-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
      >
        Fetch Data Directly
      </button>
      
      {loading && <p className="text-xs mt-1">Loading...</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      
      {data && (
        <div className="mt-2">
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-80">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// Add this component at the top of the file, before your main component:
function AdminDebugPanel() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  
  if (loading) {
    return <div className="bg-blue-50 p-3 rounded-md">Loading auth state...</div>;
  }
  
  if (!user) {
    return (
      <div className="bg-red-50 p-3 rounded-md">
        <p className="text-red-700 font-medium">Not authenticated</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded"
        >
          Refresh Page
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 p-3 rounded-md">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Admin Debug</h3>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {open ? 'Hide' : 'Show'} Details
        </button>
      </div>
      
      {open && (
        <div className="mt-2 space-y-2 text-xs">
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Role:</strong> <span className={user.role === 'admin' ? 'text-green-600 font-medium' : ''}>{user.role}</span></p>
          <p><strong>Profile ID:</strong> {user.profileId || 'None'}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Is Admin:</strong> {user.role === 'admin' ? 'Yes ✅' : 'No ❌'}</p>
          
          <div className="pt-2 flex space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="px-2 py-1 bg-blue-600 text-white rounded"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                console.log('Current auth state:', { user });
                alert('Auth state logged to console');
              }}
              className="px-2 py-1 bg-gray-600 text-white rounded"
            >
              Log Auth
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [authDebug, setAuthDebug] = useState<string>('');
  const [usingRealData, setUsingRealData] = useState(false);

  useEffect(() => {
    // Debug information
    if (user) {
      setAuthDebug(`User: ${user.id}, Role: ${user.role}, ProfileId: ${user.profileId || 'none'}`);
      setUsingRealData(true);
    } else {
      setAuthDebug('No user found');
    }
    
    // If user is not an admin, redirect to login page
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/login');
    }
    
    // Set loading complete after a delay to allow data to fetch
    const timer = setTimeout(() => {
      setLoadingComplete(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [user, loading, router]);
  
  // Force refresh data and browser on click
  const handleRefresh = () => {
    window.location.reload();
  };

  // Create a test admin user for development
  const createTestAdmin = () => {
    const testAdmin = {
      id: "admin_user_123",
      email: "admin@test.com",
      name: "Test Admin",
      role: "admin",
      profileId: "admin_profile_123"
    };
    
    // Store in localStorage
    localStorage.setItem('wanderpaws_user', JSON.stringify(testAdmin));
    
    // Create and store session
    const testSession = {
      userId: testAdmin.id,
      role: testAdmin.role,
      profileId: testAdmin.profileId
    };
    localStorage.setItem('wanderpaws_session', JSON.stringify(testSession));
    
    // Reload the page to use the new user
    window.location.reload();
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600">Loading authentication data...</p>
      </div>
    );
  }
  
  // If the user is not an admin, show an error
  if (user.role !== 'admin') {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-4">
            You don't have permission to access the admin dashboard.
          </p>
          <p className="text-gray-600 text-sm mb-4">
            Current user role: {user.role}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <AdminDebugPanel />
      </div>
      <TabbedDashboard />
      
      {/* Data debug component */}
      {process.env.NODE_ENV === 'development' && <DataDebug />}
      
      {/* Debug info for development */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 p-2 text-xs text-gray-600 border-t border-gray-300">
        <div>Auth: {authDebug}</div>
        <div className="mt-1">
          Data Source: 
          <span className={usingRealData ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
            {usingRealData ? " Real Database Data" : " Mock Data"}
          </span>
        </div>
        <div className="flex space-x-2 mt-1">
          <button 
            onClick={handleRefresh}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
          <button 
            onClick={createTestAdmin}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
          >
            Create Test Admin
          </button>
        </div>
      </div>
      
      {!loadingComplete && (
        <div className="fixed inset-0 bg-white bg-opacity-70 flex flex-col justify-center items-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
          <p className="text-gray-500 text-sm mt-2">Fetching real data from database</p>
        </div>
      )}
    </>
  );
} 