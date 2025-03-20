'use client';

import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';

export default function AdminInsightsPage() {
  const [activeTab, setActiveTab] = useState('business');
  const [timeframe, setTimeframe] = useState('month');
  
  // Mock insights data
  const insights = {
    businessTrends: [
      { id: 1, title: 'Demand for morning walks is up 15% this month', trend: 'up', change: 15, recommendation: 'Consider adding more morning slots for walkers.' },
      { id: 2, title: 'Weekend bookings have decreased by 8%', trend: 'down', change: 8, recommendation: 'Add weekend promotions to boost bookings.' },
      { id: 3, title: 'Golden Retrievers have the highest booking rate', trend: 'up', change: 12, recommendation: 'Specialized walker training for popular breeds could increase customer satisfaction.' },
      { id: 4, title: 'Customer acquisition cost has decreased by 5%', trend: 'up', change: 5, recommendation: 'The current marketing strategy is effective, continue with the current approach.' },
    ],
    walkerInsights: [
      { id: 1, title: 'Susan Johnson has the highest customer satisfaction rating', trend: 'up', change: 9, recommendation: 'Consider featuring Susan in marketing materials.' },
      { id: 2, title: 'New walkers have a 35% lower retention rate', trend: 'down', change: 35, recommendation: 'Improve the onboarding process and provide better training materials.' },
      { id: 3, title: 'Walkers with specialized training earn 20% more', trend: 'up', change: 20, recommendation: 'Offer more specialized training opportunities for walkers.' },
      { id: 4, title: 'Walker fatigue detected for those with >4 walks per day', trend: 'down', change: 18, recommendation: 'Optimize walker schedules to prevent burn-out.' },
    ],
    customerBehavior: [
      { id: 1, title: '72% of clients book recurring walks', trend: 'up', change: 6, recommendation: 'Focus on subscription offerings for better retention.' },
      { id: 2, title: 'First-time customers are most likely to cancel', trend: 'down', change: 23, recommendation: 'Implement special onboarding for first-time dog owners.' },
      { id: 3, title: 'Customers with multiple dogs spend 2.5x more', trend: 'up', change: 150, recommendation: 'Create multi-dog packages and promotions.' },
      { id: 4, title: 'Mobile app users book 45% more frequently', trend: 'up', change: 45, recommendation: 'Invest in improving the mobile app experience.' },
    ],
    predictions: [
      { id: 1, title: 'Predicted 22% booking increase in spring months', trend: 'up', change: 22, recommendation: 'Prepare by recruiting additional walkers for the spring season.' },
      { id: 2, title: 'Loyalty program could increase retention by 18%', trend: 'up', change: 18, recommendation: 'Implement a tiered loyalty program with increasing benefits.' },
      { id: 3, title: 'Predicted surge in puppy training demand next quarter', trend: 'up', change: 34, recommendation: 'Train walkers on puppy handling and offer puppy-specific packages.' },
      { id: 4, title: 'Weather impact: 40% cancellation risk on rainy days', trend: 'down', change: 40, recommendation: 'Implement a rainy day policy with indoor options or rescheduling.' },
    ]
  };
  
  const getActiveInsights = () => {
    switch (activeTab) {
      case 'business':
        return insights.businessTrends;
      case 'walkers':
        return insights.walkerInsights;
      case 'customers':
        return insights.customerBehavior;
      case 'predictions':
        return insights.predictions;
      default:
        return insights.businessTrends;
    }
  };

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
            <p className="mt-1 text-sm text-gray-500">
              AI-powered analytics and business recommendations
            </p>
          </div>
          
          <div className="flex space-x-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Export Insights
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('business')}
              className={`${
                activeTab === 'business'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Business Trends
            </button>
            <button
              onClick={() => setActiveTab('walkers')}
              className={`${
                activeTab === 'walkers'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Walker Insights
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`${
                activeTab === 'customers'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Customer Behavior
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`${
                activeTab === 'predictions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              AI Predictions
            </button>
          </nav>
        </div>
        
        {/* Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {getActiveInsights().map((insight) => (
            <div key={insight.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-start">
                  <div className={`rounded-md p-3 ${
                    insight.trend === 'up' 
                      ? 'bg-green-50' 
                      : 'bg-red-50'
                  }`}>
                    {insight.trend === 'up' ? (
                      <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{insight.title}</h3>
                    <div className="mt-1 flex items-center">
                      <span className={`text-sm font-semibold ${
                        insight.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {insight.trend === 'up' ? '+' : '-'}{insight.change}%
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {timeframe === 'week' ? 'this week' : timeframe === 'month' ? 'this month' : timeframe === 'quarter' ? 'this quarter' : 'this year'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">
                      {insight.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* AI Analysis */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              AI Analysis Summary
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="prose max-w-none text-gray-700">
              <p>
                Based on the analysis of your business data, our AI has identified several key opportunities for growth:
              </p>
              
              <ul className="mt-4 space-y-2">
                <li>
                  <span className="font-medium">Focus on morning availability</span> - There's a growing demand for morning walks that could increase revenue by approximately 15% if properly addressed.
                </li>
                <li>
                  <span className="font-medium">Improve walker retention</span> - New walker churn is affecting service consistency. A structured mentorship program could improve retention by up to 35%.
                </li>
                <li>
                  <span className="font-medium">Develop specialized services</span> - Customers with specific breeds (particularly Golden Retrievers) and multi-dog households represent high-value segments that respond well to specialized service offerings.
                </li>
                <li>
                  <span className="font-medium">Weather contingency planning</span> - Implementing a clear policy for inclement weather could reduce cancellations and maintain steady revenue during rainy seasons.
                </li>
              </ul>
              
              <p className="mt-4">
                The most significant finding is that <span className="font-bold text-primary-600">subscription-based services show 72% higher retention</span> than one-time bookings. Pushing subscription packages should be a priority for sustainable growth.
              </p>
            </div>
            
            <div className="mt-8">
              <h4 className="font-medium text-gray-900">Predictive Growth Model</h4>
              <div className="mt-4 h-64 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Interactive growth projection chart would appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 