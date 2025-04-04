'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAdminDogs } from '@/lib/hooks/useAdminHooks';
import RouteGuard from '@/components/RouteGuard';
import Link from 'next/link';
import Image from 'next/image';
import { Dog } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminDogsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState({
    breedFilter: '',
    sizeFilter: '',
    statusFilter: ''
  });
  const [showDebug, setShowDebug] = useState(false);
  
  // Use the useAdminDogs hook
  const { 
    data = { dogs: [], total: 0, page: 1, limit: 20 }, 
    isPending, 
    error, 
    refetch: refetchDogs
  } = useAdminDogs(page, limit, filters);
  
  const { dogs = [], total = 0 } = data;
  
  // Force refetch when component mounts
  useEffect(() => {
    if (user && user.role === 'admin') {
      console.log('AdminDogsPage - Forcing refetch on mount');
      refetchDogs();
    }
  }, [user, refetchDogs]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetchDogs();
  };
  
  const clearFilters = () => {
    setFilters({
      breedFilter: '',
      sizeFilter: '',
      statusFilter: ''
    });
    refetchDogs();
  };
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Calculate if we have dogs to display
  const hasDogs = dogs.length > 0;
  const totalPages = Math.ceil(total / limit);
  
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'dogs' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dogs Dashboard</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              title="Toggle debug panel"
            >
              {showDebug ? 'Hide Debug' : 'Debug'}
            </button>
            <Link 
              href="/admin-dashboard" 
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={() => refetchDogs()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* Debug Panel */}
        {showDebug && (
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-md mb-6">
            <h3 className="font-medium mb-2">Debug Information</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>User Role: {user?.role || 'Not logged in'}</p>
              <p>Total Dogs: {total}</p>
              <p>Current Page: {page}</p>
              <p>Results Per Page: {limit}</p>
              <p>Active Filters: {Object.entries(filters).filter(([, value]) => value).map(([key, value]) => `${key}=${value}`).join(', ') || 'None'}</p>
              <p>Is Loading: {isPending ? 'true' : 'false'}</p>
              <p>Has Error: {error ? 'true' : 'false'}</p>
              {error && <p className="text-red-500">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>}
            </div>
            
            <div className="mt-2">
              <h4 className="font-medium mb-1">API Response Data:</h4>
              <pre className="bg-gray-200 p-2 rounded-md overflow-auto text-xs max-h-40">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="breedFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Breed
              </label>
              <input
                type="text"
                id="breedFilter"
                name="breedFilter"
                value={filters.breedFilter}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Filter by breed"
              />
            </div>
            
            <div>
              <label htmlFor="sizeFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Size
              </label>
              <select
                id="sizeFilter"
                name="sizeFilter"
                value={filters.sizeFilter}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Sizes</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="statusFilter"
                name="statusFilter"
                value={filters.statusFilter}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Filter
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
        
        {/* Dogs Grid */}
        {!hasDogs ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h2 className="text-lg font-medium text-gray-900 mb-2">No Dogs Found</h2>
            <p className="text-gray-500 mb-4">
              Try adjusting your filters or refreshing the page.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dogs.map((dog: Dog) => (
                <div key={dog.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  <div className="relative h-48 w-full">
                    {dog.imageUrl ? (
                      <Image
                        src={dog.imageUrl}
                        alt={dog.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xl">No image</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        dog.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : dog.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {dog.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h2 className="text-lg font-semibold text-gray-900">{dog.name}</h2>
                      <span className="text-sm font-medium text-gray-500">ID: {dog.id.substring(0, 8)}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {dog.breed || 'Unknown breed'} • {dog.size || 'Unknown size'}
                    </p>
                    
                    <p className="text-sm text-gray-500 mt-1">
                      Age: {dog.age || 'Unknown'} {dog.age === 1 ? 'year' : 'years'}
                    </p>
                    
                    <p className="text-sm text-gray-500 mt-1">
                      Owner: {dog.owner?.name || 'Unknown owner'}
                    </p>
                    
                    <div className="mt-4 flex justify-between">
                      <Link 
                        href={`/admin-dashboard/dogs/${dog.id}`} 
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        View Details
                      </Link>
                      
                      <Link 
                        href={`/admin-dashboard/dogs/${dog.id}/edit`} 
                        className="text-gray-600 hover:text-gray-700 font-medium text-sm"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className={`px-3 py-1 rounded-md ${
                      page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-1 rounded-md ${
                        page === i + 1
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className={`px-3 py-1 rounded-md ${
                      page === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 