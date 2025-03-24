import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchInsights, updateInsightStatus, InsightFilters } from '@/utils/dataHelpers';
import { AIInsight } from '@/lib/types';

export default function InsightList() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InsightFilters>({
    status: 'new' // Default to show new insights
  });
  
  useEffect(() => {
    async function loadInsights() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchInsights(filters);
        setInsights(data);
      } catch (err) {
        console.error('Error loading AI insights:', err);
        setError('Failed to load AI insights');
      } finally {
        setLoading(false);
      }
    }
    
    loadInsights();
  }, [filters]);

  // Handle changing insight status
  const handleStatusChange = async (id: string, newStatus: 'acknowledged' | 'implemented' | 'dismissed') => {
    try {
      await updateInsightStatus(id, newStatus);
      
      // Update the local state to reflect the change
      setInsights(prevInsights => 
        prevInsights.map(insight => 
          insight.id === id ? { ...insight, status: newStatus } : insight
        )
      );
    } catch (err) {
      console.error('Error updating insight status:', err);
      // Show an error notification in a real app
    }
  };
  
  // Get impact badge color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h2>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h2>
        <div className="text-red-500 text-center py-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
        <div className="flex space-x-2">
          <select
            value={filters.status || 'all'}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="implemented">Implemented</option>
            <option value="dismissed">Dismissed</option>
          </select>
          
          <select
            value={filters.category || 'all'}
            onChange={(e) => setFilters({ ...filters, category: e.target.value as any })}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Categories</option>
            <option value="revenue">Revenue</option>
            <option value="customer_satisfaction">Customer Satisfaction</option>
            <option value="operational_efficiency">Operational Efficiency</option>
          </select>
        </div>
      </div>
      
      {insights.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No insights found matching the current filters.
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map(insight => (
            <div key={insight.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{insight.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${getImpactColor(insight.impact)}`}>
                      {insight.impact.charAt(0).toUpperCase() + insight.impact.slice(1)} Impact
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(insight.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {insight.confidenceScore * 100}% confidence
                    </span>
                  </div>
                </div>
                
                {insight.status === 'new' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusChange(insight.id, 'acknowledged')}
                      className="px-3 py-1 bg-primary-600 text-white rounded-md text-xs hover:bg-primary-700"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleStatusChange(insight.id, 'dismissed')}
                      className="px-3 py-1 bg-gray-200 text-gray-600 rounded-md text-xs hover:bg-gray-300"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
                
                {insight.status === 'acknowledged' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusChange(insight.id, 'implemented')}
                      className="px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700"
                    >
                      Mark Implemented
                    </button>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mt-2">{insight.description}</p>
              
              {insight.recommendations && insight.recommendations.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-900">Recommendations:</h4>
                  <ul className="mt-1 list-disc list-inside text-sm text-gray-600 pl-2">
                    {insight.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 