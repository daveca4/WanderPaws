'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, 
  LineChart, Line, 
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer,
  ComposedChart
} from 'recharts';
import RouteGuard from '@/components/RouteGuard';
import { formatPrice } from '@/lib/mockSubscriptions';

// Mock data for monthly walk activity
const walkActivityData = [
  { month: 'Jan', completed: 76, cancelled: 4, revenue: 152000 },
  { month: 'Feb', completed: 85, cancelled: 5, revenue: 170000 },
  { month: 'Mar', completed: 101, cancelled: 3, revenue: 202000 },
  { month: 'Apr', completed: 112, cancelled: 6, revenue: 224000 },
  { month: 'May', completed: 118, cancelled: 4, revenue: 236000 },
  { month: 'Jun', completed: 127, cancelled: 7, revenue: 254000 },
  { month: 'Jul', completed: 135, cancelled: 5, revenue: 270000 },
];

// Mock data for walker performance
const walkerPerformanceData = [
  { name: 'Emily Davis', walks: 42, rating: 4.9, revenue: 84000 },
  { name: 'Alex Martinez', walks: 38, rating: 4.7, revenue: 76000 },
  { name: 'Taylor Wilson', walks: 35, rating: 4.8, revenue: 70000 },
  { name: 'Jamie Lee', walks: 32, rating: 4.5, revenue: 64000 },
  { name: 'Morgan Smith', walks: 28, rating: 4.6, revenue: 56000 },
];

// Mock data for dog activity by breed
const dogActivityData = [
  { name: 'Golden Retriever', breed: 'Golden Retriever', walks: 35, value: 35 },
  { name: 'Labrador', breed: 'Labrador', walks: 32, value: 32 },
  { name: 'German Shepherd', breed: 'German Shepherd', walks: 28, value: 28 },
  { name: 'Beagle', breed: 'Beagle', walks: 22, value: 22 },
  { name: 'Poodle', breed: 'Poodle', walks: 20, value: 20 },
  { name: 'Other Breeds', breed: 'Other Breeds', walks: 45, value: 45 },
];

// Mock data for revenue trends
const revenueTrendsData = [
  { month: 'Jan', subscriptions: 250000, oneTimeBookings: 70000, refunds: 10000 },
  { month: 'Feb', subscriptions: 280000, oneTimeBookings: 85000, refunds: 12000 },
  { month: 'Mar', subscriptions: 300000, oneTimeBookings: 95000, refunds: 8000 },
  { month: 'Apr', subscriptions: 320000, oneTimeBookings: 100000, refunds: 15000 },
  { month: 'May', subscriptions: 350000, oneTimeBookings: 110000, refunds: 11000 },
  { month: 'Jun', subscriptions: 380000, oneTimeBookings: 120000, refunds: 9000 },
  { month: 'Jul', subscriptions: 420000, oneTimeBookings: 130000, refunds: 12000 },
];

// Mock data for subscription activity
const subscriptionActivityData = [
  { month: 'Jan', newSubscriptions: 12, renewals: 5, cancellations: 2, revenue: 196000 },
  { month: 'Feb', newSubscriptions: 15, renewals: 7, cancellations: 3, revenue: 242000 },
  { month: 'Mar', newSubscriptions: 18, renewals: 9, cancellations: 1, revenue: 286000 },
  { month: 'Apr', newSubscriptions: 22, renewals: 10, cancellations: 2, revenue: 342000 },
  { month: 'May', newSubscriptions: 25, renewals: 12, cancellations: 3, revenue: 384000 },
  { month: 'Jun', newSubscriptions: 28, renewals: 14, cancellations: 2, revenue: 425000 },
  { month: 'Jul', newSubscriptions: 32, renewals: 16, cancellations: 4, revenue: 480000 },
];

// Mock data for subscription plan distribution
const subscriptionPlanData = [
  { name: 'Basic', value: 32, subscribers: 32 },
  { name: 'Standard', value: 48, subscribers: 48 },
  { name: 'Premium', value: 28, subscribers: 28 },
  { name: 'Annual Basic', value: 15, subscribers: 15 },
  { name: 'Annual Premium', value: 10, subscribers: 10 },
];

// Mock data for subscription plan comparison
const subscriptionPlanComparisonData = [
  { 
    name: 'Basic', 
    conversionRate: 6.8, 
    averageCreditsUsed: 4.2, 
    retentionRate: 65, 
    revenue: 240000 
  },
  { 
    name: 'Standard', 
    conversionRate: 8.5, 
    averageCreditsUsed: 8.7, 
    retentionRate: 78, 
    revenue: 648000 
  },
  { 
    name: 'Premium', 
    conversionRate: 9.2, 
    averageCreditsUsed: 17.3, 
    retentionRate: 85, 
    revenue: 672000 
  },
  { 
    name: 'Annual Basic', 
    conversionRate: 5.4, 
    averageCreditsUsed: 42.8, 
    retentionRate: 92, 
    revenue: 1290000 
  },
  { 
    name: 'Annual Premium', 
    conversionRate: 4.1, 
    averageCreditsUsed: 185.6, 
    retentionRate: 95, 
    revenue: 2640000 
  },
];

// Mock data for subscription expiry forecast
const subscriptionExpiryForecastData = [
  { month: 'Aug 2023', expirations: 24, renewalProbability: 68, potentialLoss: 126000 },
  { month: 'Sep 2023', expirations: 32, renewalProbability: 71, potentialLoss: 175000 },
  { month: 'Oct 2023', expirations: 28, renewalProbability: 65, potentialLoss: 154000 },
  { month: 'Nov 2023', expirations: 35, renewalProbability: 72, potentialLoss: 192000 },
  { month: 'Dec 2023', expirations: 43, renewalProbability: 75, potentialLoss: 232000 },
  { month: 'Jan 2024', expirations: 38, renewalProbability: 70, potentialLoss: 205000 },
];

// Mock data for subscription credit usage
const subscriptionCreditUsageData = [
  { 
    category: '0-25%', 
    count: 15, 
    percentage: 11.3, 
    averageWalksPerMonth: 0.8, 
    risk: 'High',
    value: 15
  },
  { 
    category: '26-50%', 
    count: 28, 
    percentage: 21.0, 
    averageWalksPerMonth: 1.5, 
    risk: 'Medium',
    value: 28
  },
  { 
    category: '51-75%', 
    count: 47, 
    percentage: 35.3, 
    averageWalksPerMonth: 2.8, 
    risk: 'Low',
    value: 47
  },
  { 
    category: '76-100%', 
    count: 43, 
    percentage: 32.4, 
    averageWalksPerMonth: 3.6, 
    risk: 'Very Low',
    value: 43
  }
];

const creditUsageColors = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE'];

// COLORS for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState('walks');
  const [dateRange, setDateRange] = useState('week');
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Generate filtered data based on date range
  useEffect(() => {
    // In a real application, this would fetch data from an API based on date range
    // For demo purposes, we'll just use the mock data
    switch (selectedReport) {
      case 'walks':
        setChartData(walkActivityData);
        break;
      case 'walkers':
        setChartData(walkerPerformanceData);
        break;
      case 'dogs':
        setChartData(dogActivityData);
        break;
      case 'revenue':
        setChartData(revenueTrendsData);
        break;
      case 'subscriptions':
        setChartData(subscriptionActivityData);
        break;
      default:
        setChartData([]);
    }
  }, [selectedReport, dateRange]);
  
  // Calculate summary metrics
  const calculateMetrics = () => {
    switch (selectedReport) {
      case 'walks':
        return {
          total: walkActivityData.reduce((sum, item) => sum + item.completed + item.cancelled, 0),
          completed: walkActivityData.reduce((sum, item) => sum + item.completed, 0),
          cancelled: walkActivityData.reduce((sum, item) => sum + item.cancelled, 0),
          revenue: walkActivityData.reduce((sum, item) => sum + item.revenue, 0)
        };
      case 'walkers':
        return {
          total: walkerPerformanceData.length,
          active: walkerPerformanceData.length,
          onLeave: 1,
          topPerformer: walkerPerformanceData.sort((a, b) => b.walks - a.walks)[0].name
        };
      case 'dogs':
        return {
          total: dogActivityData.reduce((sum, item) => sum + item.walks, 0),
          active: 52,
          inactive: 4,
          newThisMonth: 6
        };
      case 'revenue':
        return {
          total: revenueTrendsData.reduce((sum, item) => 
            sum + item.subscriptions + item.oneTimeBookings - item.refunds, 0),
          subscriptions: revenueTrendsData.reduce((sum, item) => sum + item.subscriptions, 0),
          oneTimeBookings: revenueTrendsData.reduce((sum, item) => sum + item.oneTimeBookings, 0),
          refunds: revenueTrendsData.reduce((sum, item) => sum + item.refunds, 0)
        };
      case 'subscriptions':
        return {
          totalSubscriptions: 133,
          newSubscriptions: subscriptionActivityData.reduce((sum, item) => sum + item.newSubscriptions, 0),
          renewals: subscriptionActivityData.reduce((sum, item) => sum + item.renewals, 0),
          cancellations: subscriptionActivityData.reduce((sum, item) => sum + item.cancellations, 0),
          conversionRate: '8.5%',
          revenue: subscriptionActivityData.reduce((sum, item) => sum + item.revenue, 0)
        };
      default:
        return {
          total: 0,
          completed: 0,
          cancelled: 0,
          revenue: 0,
          active: 0,
          inactive: 0,
          onLeave: 0,
          newThisMonth: 0,
          topPerformer: '',
          subscriptions: 0,
          oneTimeBookings: 0,
          refunds: 0,
          totalSubscriptions: 0,
          newSubscriptions: 0,
          renewals: 0,
          cancellations: 0,
          conversionRate: '0%'
        };
    }
  };

  const reportData = calculateMetrics();

  // Format monetary values with £ symbol
  const formatCurrency = (amount: number | undefined): string => {
    return formatPrice(amount ?? 0);
  };

  // Function to handle export
  const handleExport = () => {
    alert('Exporting report data as CSV...');
    // In a real application, this would generate and download a CSV file
  };
  
  // Function to handle printing
  const handlePrint = () => {
    window.print();
  };

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6 print:m-0 print:p-0 print:shadow-none print:space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Reports</h1>
            <p className="mt-1 text-sm text-gray-500">
              View detailed reports and analytics for {dateRange === 'week' ? 'this week' : 
                                                      dateRange === 'month' ? 'this month' : 
                                                      dateRange === 'quarter' ? 'this quarter' : 'this year'}
            </p>
          </div>
          
          <div className="flex space-x-2 print:hidden">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            
            <button 
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Export
            </button>
            
            <button 
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>
        
        {/* Print header - only visible when printing */}
        <div className="hidden print:block print:mb-4">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-lg font-medium text-gray-900">
              {selectedReport === 'walks' ? 'Walk Reports' : 
               selectedReport === 'walkers' ? 'Walker Performance' :
               selectedReport === 'dogs' ? 'Dog Activity' :
               selectedReport === 'revenue' ? 'Revenue Reports' :
               'Subscription Reports'} - Generated on {new Date().toLocaleDateString()}
            </h2>
            <p className="text-sm text-gray-500">WanderPaws Administrative Report</p>
          </div>
        </div>
        
        {/* Report selector */}
        <div className="bg-white shadow rounded-lg print:shadow-none print:border">
          <div className="border-b border-gray-200 print:hidden">
            <nav className="flex -mb-px">
              <button
                onClick={() => setSelectedReport('walks')}
                className={`px-4 py-4 text-sm font-medium ${
                  selectedReport === 'walks'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Walk Reports
              </button>
              <button
                onClick={() => setSelectedReport('walkers')}
                className={`px-4 py-4 text-sm font-medium ${
                  selectedReport === 'walkers'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Walker Performance
              </button>
              <button
                onClick={() => setSelectedReport('dogs')}
                className={`px-4 py-4 text-sm font-medium ${
                  selectedReport === 'dogs'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dog Activity
              </button>
              <button
                onClick={() => setSelectedReport('revenue')}
                className={`px-4 py-4 text-sm font-medium ${
                  selectedReport === 'revenue'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setSelectedReport('subscriptions')}
                className={`px-4 py-4 text-sm font-medium ${
                  selectedReport === 'subscriptions'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Subscriptions
              </button>
            </nav>
          </div>
          
          {/* Report content */}
          <div className="p-6">
            {selectedReport === 'walks' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Walks</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{reportData.total}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                      <dd className="mt-1 text-3xl font-semibold text-green-600">{reportData.completed}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Cancelled</dt>
                      <dd className="mt-1 text-3xl font-semibold text-red-600">{reportData.cancelled}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(reportData.revenue)}</dd>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Walk Activity</h3>
                    <div className="mt-6 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={walkActivityData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === 'revenue') {
                                return [formatCurrency(Number(value)), 'Revenue'];
                              }
                              return [value, typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name];
                            }}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="completed" fill="#8884d8" name="Completed Walks" />
                          <Bar yAxisId="left" dataKey="cancelled" fill="#ff8042" name="Cancelled Walks" />
                          <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue (£)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {selectedReport === 'walkers' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Walkers</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{reportData.total}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Walkers</dt>
                      <dd className="mt-1 text-3xl font-semibold text-green-600">{reportData.active}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">On Leave</dt>
                      <dd className="mt-1 text-3xl font-semibold text-yellow-600">{reportData.onLeave}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Top Performer</dt>
                      <dd className="mt-1 text-xl font-semibold text-gray-900">{reportData.topPerformer}</dd>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Walker Performance</h3>
                    <div className="mt-6 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={walkerPerformanceData}
                          layout="vertical"
                          margin={{
                            top: 20,
                            right: 30,
                            left: 80,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === 'revenue') {
                                return [formatCurrency(Number(value)), 'Revenue'];
                              } else if (name === 'rating') {
                                return [value, 'Rating (5.0)'];
                              }
                              return [value, 'Walks Completed'];
                            }}
                          />
                          <Legend />
                          <Bar dataKey="walks" fill="#8884d8" name="Walks Completed" />
                          <Bar dataKey="rating" fill="#ffc658" name="Rating (5.0)" />
                          <Bar dataKey="revenue" fill="#82ca9d" name="Revenue (£)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {selectedReport === 'dogs' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Dogs</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{reportData.total}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Dogs</dt>
                      <dd className="mt-1 text-3xl font-semibold text-green-600">{reportData.active}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Inactive Dogs</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-600">{reportData.inactive}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">New This Month</dt>
                      <dd className="mt-1 text-3xl font-semibold text-primary-600">{reportData.newThisMonth}</dd>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Dog Activity by Breed</h3>
                    <div className="mt-6 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dogActivityData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {dogActivityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Walks']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {selectedReport === 'revenue' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {formatCurrency(reportData.total)}
                      </dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Subscriptions</dt>
                      <dd className="mt-1 text-3xl font-semibold text-green-600">
                        {formatCurrency(reportData.subscriptions)}
                      </dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">One-time Bookings</dt>
                      <dd className="mt-1 text-3xl font-semibold text-primary-600">
                        {formatCurrency(reportData.oneTimeBookings)}
                      </dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Refunds</dt>
                      <dd className="mt-1 text-3xl font-semibold text-red-600">
                        {formatCurrency(reportData.refunds)}
                      </dd>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Revenue Trends</h3>
                    <div className="mt-6 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={revenueTrendsData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [formatCurrency(Number(value)), '']}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="subscriptions" 
                            stroke="#8884d8" 
                            name="Subscriptions"
                            activeDot={{ r: 8 }} 
                            strokeWidth={2}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="oneTimeBookings" 
                            stroke="#82ca9d" 
                            name="One-time Bookings"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="refunds" 
                            stroke="#ff8042" 
                            name="Refunds"
                            strokeDasharray="5 5"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {selectedReport === 'subscriptions' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Active Subscriptions</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{reportData.totalSubscriptions}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">New Subscriptions</dt>
                      <dd className="mt-1 text-3xl font-semibold text-green-600">{reportData.newSubscriptions}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Renewals</dt>
                      <dd className="mt-1 text-3xl font-semibold text-primary-600">{reportData.renewals}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Cancellations</dt>
                      <dd className="mt-1 text-3xl font-semibold text-red-600">{reportData.cancellations}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                      <dd className="mt-1 text-3xl font-semibold text-blue-600">{reportData.conversionRate}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(reportData.revenue)}</dd>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Subscription Activity</h3>
                      <div className="mt-6 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={subscriptionActivityData}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                            <Tooltip 
                              formatter={(value, name) => {
                                if (name === 'revenue') {
                                  return [formatCurrency(Number(value)), 'Revenue'];
                                }
                                return [value, typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name];
                              }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="newSubscriptions" fill="#8884d8" name="New Subscriptions" />
                            <Bar yAxisId="left" dataKey="renewals" fill="#4ADE80" name="Renewals" />
                            <Bar yAxisId="left" dataKey="cancellations" fill="#ff8042" name="Cancellations" />
                            <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue (£)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Subscription Plan Distribution</h3>
                      <div className="mt-6 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={subscriptionPlanData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {subscriptionPlanData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, 'Subscribers']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Subscription Plan Comparison</h3>
                    <div className="mt-6 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Plan
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Conversion Rate
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Avg. Credits Used
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Retention Rate
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Revenue
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {subscriptionPlanComparisonData.map((plan) => (
                            <tr key={plan.name}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {plan.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {plan.conversionRate}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {plan.averageCreditsUsed}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {plan.retentionRate}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatCurrency(plan.revenue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-6 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={subscriptionPlanComparisonData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === 'revenue') {
                                return [formatCurrency(Number(value)), 'Revenue'];
                              } else if (name === 'conversionRate' || name === 'retentionRate') {
                                return [`${value}%`, name === 'conversionRate' ? 'Conversion Rate' : 'Retention Rate'];
                              }
                              return [value, name === 'averageCreditsUsed' ? 'Avg. Credits Used' : name];
                            }}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="conversionRate" fill="#8884d8" name="Conversion Rate" />
                          <Bar yAxisId="left" dataKey="averageCreditsUsed" fill="#4ADE80" name="Avg. Credits Used" />
                          <Bar yAxisId="left" dataKey="retentionRate" fill="#ffc658" name="Retention Rate" />
                          <Bar yAxisId="right" dataKey="revenue" fill="#ff8042" name="Revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Subscription Expiry Forecast</h3>
                    <p className="mt-1 text-sm text-gray-500">Upcoming subscription expirations and renewal probabilities</p>
                    
                    <div className="mt-6 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={subscriptionExpiryForecastData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" orientation="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === 'potentialLoss') {
                                return [formatCurrency(Number(value)), 'Potential Revenue Loss'];
                              } else if (name === 'renewalProbability') {
                                return [`${value}%`, 'Renewal Probability'];
                              }
                              return [value, 'Expiring Subscriptions'];
                            }}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="expirations" fill="#8884d8" name="Expiring Subscriptions" />
                          <Line 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="renewalProbability" 
                            stroke="#4ADE80" 
                            name="Renewal Probability (%)"
                            strokeWidth={2}
                          />
                          <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="potentialLoss" 
                            stroke="#ff8042" 
                            name="Potential Revenue Loss (£)"
                            strokeWidth={2}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-6 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Month
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Expiring Subscriptions
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Renewal Probability
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Potential Revenue Loss
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {subscriptionExpiryForecastData.map((month) => (
                            <tr key={month.month}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {month.month}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {month.expirations}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                      className={`h-2.5 rounded-full ${
                                        month.renewalProbability >= 70 
                                          ? 'bg-green-600' 
                                          : month.renewalProbability >= 50 
                                            ? 'bg-yellow-500' 
                                            : 'bg-red-600'
                                      }`} 
                                      style={{ width: `${month.renewalProbability}%` }}
                                    ></div>
                                  </div>
                                  <span className="ml-2">{month.renewalProbability}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatCurrency(month.potentialLoss)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button className="text-primary-600 hover:text-primary-900">
                                  Plan Campaign
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Subscription Credit Usage Analysis</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Understanding how effectively users utilize their subscription credits
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={subscriptionCreditUsageData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="category"
                              >
                                {subscriptionCreditUsageData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={creditUsageColors[index % creditUsageColors.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [value, 'Users']} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="text-center text-sm text-gray-500 mt-2">
                          Distribution of users by credit usage percentage
                        </div>
                      </div>
                      
                      <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Usage Tier
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Users
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Avg. Walks/Month
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Churn Risk
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {subscriptionCreditUsageData.map((tier, index) => (
                              <tr key={tier.category}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: creditUsageColors[index] }}></div>
                                    <div className="ml-2 text-sm font-medium text-gray-900">{tier.category} Usage</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {tier.count} ({tier.percentage}%)
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {tier.averageWalksPerMonth}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    tier.risk === 'High' 
                                      ? 'bg-red-100 text-red-800' 
                                      : tier.risk === 'Medium'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : tier.risk === 'Low'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {tier.risk}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        
                        <div className="mt-4 px-6 py-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Recommended Actions</h4>
                          <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                            <li>Consider email campaigns for users with 0-25% usage to increase engagement</li>
                            <li>Offer incentives for 26-50% users to book additional walks</li>
                            <li>Create loyalty programs for 76-100% users as they are your most valuable customers</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Print stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:m-0 {
            margin: 0 !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:space-y-2 > * + * {
            margin-top: 0.5rem !important;
          }
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          .print\\:border {
            border: 1px solid #e5e7eb !important;
          }
        }
      `}</style>
    </RouteGuard>
  );
} 