'use client';

import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';

export default function OwnerInsightsPage() {
  const [selectedDog, setSelectedDog] = useState('all');
  const [timeframe, setTimeframe] = useState('month');
  
  // Mock data
  const dogs = [
    { id: 'all', name: 'All Dogs' },
    { id: 'dog1', name: 'Max', breed: 'Golden Retriever', age: 3 },
    { id: 'dog2', name: 'Bella', breed: 'Labrador', age: 5 },
  ];
  
  const insights = {
    activity: {
      totalWalks: 24,
      totalDistance: 28.5,
      avgDuration: 34,
      mostActiveDay: 'Wednesday',
    },
    health: {
      weight: 65,
      weightTrend: 'stable',
      energyLevel: 'High',
      behaviorNotes: 'Very friendly, loves to play fetch',
    },
    behaviors: [
      { date: '2023-05-15', type: 'Playfulness', rating: 5 },
      { date: '2023-05-15', type: 'Sociability', rating: 4 },
      { date: '2023-05-15', type: 'Energy', rating: 5 },
      { date: '2023-05-15', type: 'Obedience', rating: 3 },
    ],
    walkers: [
      { name: 'Sarah Johnson', walksCompleted: 12, rating: 4.9 },
      { name: 'Michael Chen', walksCompleted: 8, rating: 4.7 },
      { name: 'Emma Wilson', walksCompleted: 4, rating: 5.0 },
    ],
    recommendations: [
      { id: 1, title: 'Consider evening walks for Max', description: 'Max seems more energetic during evening walks based on walker feedback.', importance: 'high' },
      { id: 2, title: 'More socialization opportunities', description: 'Bella would benefit from more interaction with other dogs.', importance: 'medium' },
      { id: 3, title: 'Training reinforcement suggested', description: 'Consistent command reinforcement would help with obedience.', importance: 'medium' },
    ]
  };
  
  const activityChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    distances: [2.1, 0, 3.2, 2.4, 0, 4.5, 3.8],
    durations: [30, 0, 45, 30, 0, 60, 45],
  };

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'owner-dashboard' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dog Insights</h1>
            <p className="mt-1 text-sm text-gray-500">
              Analytics and insights for your dogs
            </p>
          </div>
          
          <div className="flex space-x-2">
            <select
              value={selectedDog}
              onChange={(e) => setSelectedDog(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              {dogs.map(dog => (
                <option key={dog.id} value={dog.id}>{dog.name}</option>
              ))}
            </select>
            
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
        
        {/* Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Walks</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{insights.activity.totalWalks}</dd>
              <dd className="mt-1 text-sm text-gray-500">in the {timeframe === 'week' ? 'last week' : timeframe === 'month' ? 'last month' : timeframe === 'quarter' ? 'last 3 months' : 'last year'}</dd>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Distance</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{insights.activity.totalDistance} mi</dd>
              <dd className="mt-1 text-sm text-gray-500">approx. {(insights.activity.totalDistance / insights.activity.totalWalks).toFixed(1)} mi per walk</dd>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Average Duration</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{insights.activity.avgDuration} min</dd>
              <dd className="mt-1 text-sm text-gray-500">most walks between 30-45 minutes</dd>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Most Active Day</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{insights.activity.mostActiveDay}</dd>
              <dd className="mt-1 text-sm text-gray-500">consistent weekly pattern</dd>
            </div>
          </div>
        </div>
        
        {/* Activity Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Weekly Activity
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Walk distance and duration by day
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="h-64 relative">
              {activityChartData.labels.map((day, index) => (
                <div key={day} className="absolute bottom-0" style={{ 
                  left: `${(index / (activityChartData.labels.length - 1)) * 100}%`, 
                  height: activityChartData.distances[index] ? `${(activityChartData.distances[index] / Math.max(...activityChartData.distances)) * 80}%` : '0', 
                  width: '20px',
                  transform: 'translateX(-50%)'
                }}>
                  <div className="w-full bg-primary-500 rounded-t" style={{height: '100%'}}></div>
                  <div className="text-xs text-center mt-2">{day}</div>
                  {activityChartData.distances[index] > 0 && (
                    <div className="text-xs text-center text-gray-600 font-medium absolute w-full" style={{bottom: '100%', marginBottom: '4px'}}>
                      {activityChartData.distances[index]} mi
                    </div>
                  )}
                </div>
              ))}
              
              {/* X-axis line */}
              <div className="absolute bottom-0 w-full h-px bg-gray-200"></div>
            </div>
          </div>
        </div>
        
        {/* Health & Behavior */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Health Panel */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Health Summary
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Weight</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {insights.health.weight} lbs
                    {insights.health.weightTrend === 'stable' && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Stable
                      </span>
                    )}
                    {insights.health.weightTrend === 'increasing' && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Increasing
                      </span>
                    )}
                    {insights.health.weightTrend === 'decreasing' && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Decreasing
                      </span>
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Energy Level</dt>
                  <dd className="mt-1 text-sm text-gray-900">{insights.health.energyLevel}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Walker Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900">{insights.health.behaviorNotes}</dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* Behavior Ratings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Behavior Assessment
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                {insights.behaviors.map(behavior => (
                  <div key={behavior.type} className="flex items-center">
                    <span className="w-28 text-sm font-medium text-gray-500">{behavior.type}</span>
                    <div className="ml-2 flex-1">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <div key={rating} className={`w-8 h-2 mx-0.5 rounded-full ${
                            rating <= behavior.rating ? 'bg-primary-500' : 'bg-gray-200'
                          }`}></div>
                        ))}
                        <span className="ml-3 text-sm font-medium text-gray-700">{behavior.rating}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Preferred Walkers */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Preferred Walkers
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {insights.walkers.map(walker => (
                  <li key={walker.name} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                          {walker.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {walker.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {walker.walksCompleted} walks completed
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center text-sm">
                          <span className="text-yellow-400 mr-1">★</span>
                          <span className="font-medium">{walker.rating}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Recommendations */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Personalized Recommendations
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {insights.recommendations.map(rec => (
                <div key={rec.id} className="border-l-4 bg-gray-50 p-4 rounded-r-md" 
                  style={{ borderLeftColor: rec.importance === 'high' ? '#ef4444' : rec.importance === 'medium' ? '#f59e0b' : '#10b981' }}
                >
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">{rec.title}</h3>
                      <div className="mt-2 text-sm text-gray-700">
                        <p>{rec.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 