'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import RouteGuard from '@/components/RouteGuard';
import AdminHeader from '@/components/admin/AdminHeader';
import Card from '@/components/Card';
import { formatCurrency } from '@/lib/utils';

interface RevenueData {
  month: string;
  amount: number;
}

interface WalkData {
  month: string;
  count: number;
  amount: number;
  byDay: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
}

interface SubscriptionData {
  name: string;
  count: number;
}

export default function ReportsPage() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [walkData, setWalkData] = useState<WalkData[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/reports');
        
        if (!response.ok) {
          throw new Error('Failed to fetch report data');
        }
        
        const data = await response.json();
        setRevenueData(data.revenue || []);
        setWalkData(data.walks || []);
        setSubscriptionData(data.subscriptions || []);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchReportData();
  }, []);

  const handleExport = () => {
    // Export functionality would go here
    alert('Export feature will be implemented soon');
  };

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <AdminHeader 
          title="Reports & Analytics" 
          actionButton={
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Export Data
            </button>
          }
        />
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 h-72">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-56 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Monthly Revenue">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    width={500}
                    height={300}
                    data={revenueData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#8884d8" activeDot={{ r: 8 }} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card title="Walks Completed">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    width={500}
                    height={300}
                    data={walkData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" name="Walks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card title="Active Subscriptions">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    width={500}
                    height={300}
                    data={subscriptionData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Subscribers" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card title="Weekly Walk Distribution">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    width={500}
                    height={300}
                    data={[
                      { day: 'Monday', count: walkData.reduce((acc, curr) => acc + (curr.byDay?.monday || 0), 0) },
                      { day: 'Tuesday', count: walkData.reduce((acc, curr) => acc + (curr.byDay?.tuesday || 0), 0) },
                      { day: 'Wednesday', count: walkData.reduce((acc, curr) => acc + (curr.byDay?.wednesday || 0), 0) },
                      { day: 'Thursday', count: walkData.reduce((acc, curr) => acc + (curr.byDay?.thursday || 0), 0) },
                      { day: 'Friday', count: walkData.reduce((acc, curr) => acc + (curr.byDay?.friday || 0), 0) },
                      { day: 'Saturday', count: walkData.reduce((acc, curr) => acc + (curr.byDay?.saturday || 0), 0) },
                      { day: 'Sunday', count: walkData.reduce((acc, curr) => acc + (curr.byDay?.sunday || 0), 0) },
                    ]}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#ffc658" name="Walks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 