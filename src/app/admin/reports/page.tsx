'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, 
  LineChart, Line, 
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer,
  ComposedChart, AreaChart, Area, ScatterChart, Scatter
} from 'recharts';
import RouteGuard from '@/components/RouteGuard';
import Link from 'next/link';

// Default/empty data to use until API provides real data
const defaultReportData = {
  walkActivityData: [],
  walkerPerformanceData: [],
  dogActivityData: [],
  revenueTrendsData: [],
  subscriptionActivityData: [],
  subscriptionPlanData: [],
  subscriptionPlanComparisonData: [],
  subscriptionExpiryForecastData: [],
  subscriptionCreditUsageData: [],
  ownerSpendingData: [],
  spendingBySubscriptionType: [],
  topOwnerSpendingTrends: [],
  spendingFrequencyDistribution: [],
  dogActivityBreakdownData: []
};

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const creditUsageColors = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE'];

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState(defaultReportData);
  const [selectedReport, setSelectedReport] = useState('walk-activity');
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states for interactive reports
  const [breedFilter, setBreedFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [walkerFilter, setWalkerFilter] = useState('all');
  const [metricFilter, setMetricFilter] = useState('walks');
  
  // Fetch report data from API
  useEffect(() => {
    async function fetchReportData() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/reports?timeRange=${timeRange}`);
        
        if (response.ok) {
          const data = await response.json();
          setReportData(data);
          setError(null);
        } else {
          throw new Error('Failed to fetch report data');
        }
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError('Failed to load reports. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchReportData();
  }, [timeRange]);

  // Format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleExport = () => {
    // Implementation for exporting reports would go here
    console.log('Exporting report:', selectedReport);
  };

  const handlePrint = () => {
    // Implementation for printing reports would go here
    window.print();
  };

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="mt-1 text-sm text-gray-500">
              View detailed analytics and export reports
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50"
            >
              Export
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50"
            >
              Print
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <>
            {/* Report selection tabs and content would go here */}
            {/* This would be the existing report visualization UI, but using the fetched data */}
            {/* ... */}
          </>
        )}
      </div>
    </RouteGuard>
  );
} 