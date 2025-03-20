import Image from 'next/image';
import Link from 'next/link';
import { mockDogs } from '@/lib/mockData';
import { getWalkerRecommendation, getDogHealthInsights } from '@/lib/aiService';
import { useEffect, useState } from 'react';

// Since we're in a server component, we'll simulate client-side code
// In a real app, you'd use React hooks for this
export function AIRecommendations() {
  // For demo purposes, we'll show a static recommendation
  // In a real app, this would be dynamic based on AI recommendations
  const dogId = mockDogs[0].id;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
      </div>
      
      <div className="space-y-5">
        <WalkerRecommendation dogId={dogId} />
        <HealthInsight dogId={dogId} />
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link href="/insights" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
          <span>View All Insights</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function WalkerRecommendation({ dogId }: { dogId: string }) {
  // In a real app, this would be fetched from the server with useState and useEffect
  // For demo, we'll just get the recommendation directly
  const recommendation = {
    type: 'walker',
    reason: 'Has experience with friendly, energetic dogs',
    confidence: 0.92,
    data: {
      id: 'w1',
      name: 'Emily Davis',
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500',
    }
  };
  
  const dog = mockDogs.find(d => d.id === dogId);
  
  if (!dog) return null;
  
  return (
    <div className="rounded-lg border border-primary-100 bg-primary-50 p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white">
            <Image
              src={recommendation.data.imageUrl}
              alt={recommendation.data.name}
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
        </div>
        
        <div className="ml-4">
          <p className="text-xs text-primary-600 font-medium mb-1">
            Recommended Walker for {dog.name}
          </p>
          <p className="text-sm font-medium text-gray-900">
            {recommendation.data.name} ({recommendation.data.rating})
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {recommendation.reason}
          </p>
        </div>
      </div>
    </div>
  );
}

function HealthInsight({ dogId }: { dogId: string }) {
  // In a real app, this would be fetched from the server
  // For demo, we'll show static data
  const dog = mockDogs.find(d => d.id === dogId);
  
  if (!dog) return null;
  
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white">
            <Image
              src={dog.imageUrl || 'https://via.placeholder.com/48'}
              alt={dog.name}
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
        </div>
        
        <div className="ml-4">
          <p className="text-xs text-blue-600 font-medium mb-1">
            Health Insight for {dog.name}
          </p>
          <p className="text-sm text-gray-900">
            {dog.name} is exceeding daily exercise targets! Average walk: 2.5km.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Top behaviors: playful, friendly with other dogs
          </p>
        </div>
      </div>
    </div>
  );
} 