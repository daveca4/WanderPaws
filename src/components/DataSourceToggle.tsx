'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/lib/DataContext';

// Define the proper return types
interface MigrationResult {
  success: boolean;
  error?: string;
  summary?: any;
}

export function DataSourceToggle() {
  const { isLoading, error } = useData();
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);
  
  // Clear message when error state changes
  useEffect(() => {
    if (error) {
      setMessage({
        text: error,
        type: 'error'
      });
    }
  }, [error]);
  
  // Fetch database connection info
  useEffect(() => {
    const checkDatabaseConnection = async () => {
      try {
        // This will be a client-side call to a server endpoint
        const response = await fetch('/api/check-database-connection');
        const data = await response.json();
        setDatabaseInfo(data);
      } catch (err) {
        console.error("Failed to check database connection:", err);
        setDatabaseInfo({ error: "Failed to check connection" });
      }
    };
    
    checkDatabaseConnection();
  }, []);
  
  const handleForceRefresh = () => {
    // Clear all local storage that might be caching data
    localStorage.clear();
    
    // Force a complete page refresh to reload the app
    window.location.reload();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Database Settings</h2>
      
      <div className="flex items-center justify-between mb-6">
        <span className="font-medium">Database Status:</span>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
          Connected
        </span>
      </div>
      
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <button
          onClick={handleForceRefresh}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Refresh Application
        </button>
      </div>
      
      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700' :
          message.type === 'error' ? 'bg-red-50 text-red-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}
      
      {isLoading && (
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  );
} 