'use client';

import { getDogHealthInsights, getWalkerRecommendation, getDogCareTips } from '@/lib/aiService';
import { useData } from '@/lib/DataContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function InsightsPage() {
  const { dogs, walkers, walks } = useData();
  const [insights, setInsights] = useState<{ 
    dogId: string; 
    dogName: string; 
    dogImage: string; 
    healthInsight: string;
    walkerRecommendation: { walkerId: string; reasons: string[]; walkerName: string; walkerImage: string; } | null;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      if (dogs.length === 0 || walkers.length === 0) return;
      
      setLoading(true);
      const dogInsights = await Promise.all(
        dogs.map(async (dog) => {
          try {
            // Get health insights
            const healthInsight = await getDogHealthInsights(dog.id, dogs, walks);
            
            // Get walker recommendation
            const recommendation = await getWalkerRecommendation(dog.id, dogs, walkers, walks);
            
            // Find walker details if we have a recommendation
            let walkerRecommendation = null;
            if (recommendation.walkerId) {
              const walker = walkers.find(w => w.id === recommendation.walkerId);
              if (walker) {
                walkerRecommendation = {
                  walkerId: walker.id,
                  reasons: recommendation.reasons,
                  walkerName: walker.name,
                  walkerImage: walker.imageUrl || '/placeholder-profile.jpg',
                };
              }
            }
            
            return {
              dogId: dog.id,
              dogName: dog.name,
              dogImage: dog.profileImage || dog.imageUrl || '/placeholder-dog.jpg',
              healthInsight,
              walkerRecommendation
            };
          } catch (error) {
            console.error(`Error generating insights for dog ${dog.id}:`, error);
            return null;
          }
        })
      );
      
      setInsights(dogInsights.filter(Boolean) as any);
      setLoading(false);
    };
    
    loadInsights();
  }, [dogs, walkers, walks]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
          <p className="mt-2 text-gray-600">
            Personalized recommendations and insights powered by our AI
          </p>
        </div>
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded w-full mb-6"></div>
          <div className="h-48 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
          <p className="mt-2 text-gray-600">
            Personalized recommendations and insights powered by our AI
          </p>
        </div>
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 p-8 text-center">
          <p className="text-gray-600">No insights available yet. Add dogs and walks to generate insights.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
        <p className="mt-2 text-gray-600">
          Personalized recommendations and insights powered by our AI
        </p>
      </div>
      
      {insights.map((insight) => (
        <div key={insight.dogId} className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <div className="h-10 w-10 rounded-full relative overflow-hidden mr-3">
              <Image
                src={insight.dogImage}
                alt={insight.dogName}
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{insight.dogName}</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Insights */}
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="font-semibold text-blue-800">Health Insights</h3>
              </div>
              
              <p className="text-gray-600">{insight.healthInsight}</p>
            </div>
            
            {/* Walker Recommendation */}
            {insight.walkerRecommendation && (
              <div className="bg-primary-50 p-5 rounded-lg border border-primary-100">
                <div className="flex items-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="font-semibold text-primary-800">Perfect Walker Match</h3>
                </div>
                
                <div className="flex items-start">
                  <div className="h-16 w-16 rounded-full relative overflow-hidden bg-white">
                    <Image
                      src={insight.walkerRecommendation.walkerImage}
                      alt={insight.walkerRecommendation.walkerName}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">{insight.walkerRecommendation.walkerName}</p>
                    
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-primary-700 mb-2">Recommended because:</h4>
                      <ul className="space-y-1">
                        {insight.walkerRecommendation.reasons.map((reason, i) => (
                          <li key={i} className="flex text-sm">
                            <span className="text-primary-600 mr-2">•</span>
                            <span className="text-gray-600">{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-3">
                      <Link href={`/walkers/${insight.walkerRecommendation.walkerId}`} className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
                        View Profile
                        <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 border-t border-primary-100 pt-4">
                  <Link 
                    href={`/schedule/new?dogId=${insight.dogId}&walkerId=${insight.walkerRecommendation.walkerId}`} 
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Schedule Walk with {insight.walkerRecommendation.walkerName}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 