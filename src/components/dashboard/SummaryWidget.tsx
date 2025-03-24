import React from 'react';

export function SummaryWidget() {
  return (
    <div className="h-full w-full p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Summary</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded-lg text-center">
          <p className="text-3xl font-bold text-blue-700">24</p>
          <p className="text-sm text-blue-600">Active Walkers</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg text-center">
          <p className="text-3xl font-bold text-green-700">128</p>
          <p className="text-sm text-green-600">Dog Walks Today</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg text-center">
          <p className="text-3xl font-bold text-purple-700">£1,245</p>
          <p className="text-sm text-purple-600">Daily Revenue</p>
        </div>
      </div>
    </div>
  );
} 