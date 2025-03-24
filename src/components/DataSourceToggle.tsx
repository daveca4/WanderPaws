import { useState, useEffect } from 'react';
import { useData } from '@/lib/DataContext';

// Define the proper return types
interface MigrationResult {
  success: boolean;
  error?: string;
  summary?: any;
}

export function DataSourceToggle() {
  const { useMockData, setUseMockData, migrateToDatabase, resetDatabase, isLoading, error, dbEmpty } = useData();
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(true);
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
  
  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset the database? This will delete all data.')) {
      return;
    }
    
    try {
      setMessage({
        text: 'Resetting database...',
        type: 'info'
      });
      
      const result = await resetDatabase() as MigrationResult;
      
      if (result.success) {
        setMessage({
          text: 'Database reset successfully!',
          type: 'success'
        });
      } else {
        setMessage({
          text: result.error || 'Database reset failed. See console for details.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Reset error:', error);
      setMessage({
        text: `Database reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setTimeout(() => setMessage(null), 5000);
    }
  };
  
  const handleForceRefresh = () => {
    // Clear all local storage that might be caching data
    localStorage.clear();
    
    // Force a complete page refresh to reload the app
    window.location.reload();
  };
  
  // Show current data source status with indicators
  const getDataSourceStatusMessage = () => {
    if (dbEmpty) {
      return "Database appears empty";
    } else {
      return "Database connected";
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Database Settings</h2>
      
      <div className="flex items-center justify-between mb-6">
        <span className="font-medium">Database Status:</span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          dbEmpty 
            ? 'bg-amber-100 text-amber-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {getDataSourceStatusMessage()}
        </span>
      </div>
      
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <button
          onClick={handleReset}
          disabled={isLoading}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          Reset Database
        </button>
        
        <button
          onClick={handleForceRefresh}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Force Page Refresh
        </button>
        
        <button
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="w-full px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          {showDebugInfo ? 'Hide' : 'Show'} Debug Info
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
      
      {showDebugInfo && (
        <div className="mt-4 border rounded p-3 bg-gray-50 text-xs text-gray-700 overflow-auto max-h-96">
          <h3 className="font-bold mb-2">Debug Info</h3>
          <p className="mb-1"><strong>DB Empty:</strong> {dbEmpty ? 'Yes' : 'No'}</p>
          <p className="mb-1"><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
          <p className="mb-1"><strong>Error:</strong> {error || 'None'}</p>
          
          <div className="mt-2">
            <h4 className="font-semibold">Database Connection (.env):</h4>
            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto whitespace-pre-wrap break-all">
              DATABASE_URL={process.env.DATABASE_URL ? 
                `${process.env.DATABASE_URL.substring(0, 25)}...` : 
                'Not available in client'}
            </pre>
          </div>
          
          {databaseInfo && (
            <div className="mt-2">
              <h4 className="font-semibold">Connection Info:</h4>
              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(databaseInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 