'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useData } from '@/lib/DataContext';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate, formatTime, getDogById, getOwnerById, getUpcomingWalks, getPastWalks } from '@/utils/helpers';
import { getWalkerRecommendation, getDogHealthInsights } from '@/lib/aiService';

export default function DogDetailsPage() {
  const params = useParams();
  const dogId = params.id as string;
  const { dogs, owners, walks } = useData();
  
  const [healthInsights, setHealthInsights] = useState<any>(null);
  const [walkerRecommendation, setWalkerRecommendation] = useState<any>(null);
  
  const dog = getDogById(dogs, dogId);
  const owner = dog ? getOwnerById(owners, dog.ownerId) : null;
  
  // Get walks data
  const upcomingWalks = getUpcomingWalks(walks, undefined, undefined);
  const pastWalks = getPastWalks(walks, undefined, undefined);
  
  // Simulate AI insights
  useEffect(() => {
    // Mock health insights
    setHealthInsights({
      hasInsights: true,
      averageDistance: '2.3',
      averageWalkTime: '45',
      averageMoodRating: '4.2',
      walkCount: 12,
      recommendations: [
        'Increase walk frequency in warmer weather',
        'Consider morning walks for better energy levels'
      ]
    });
    
    // Mock walker recommendation
    setWalkerRecommendation({
      type: 'walker',
      reason: 'Experience with this breed',
      confidence: 0.85,
      data: {
        id: 'walker1',
        name: 'Emily Davis',
        imageUrl: 'https://randomuser.me/api/portraits/women/32.jpg'
      }
    });
  }, []);
  
  if (!dog) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600">Dog not found</h1>
        <p className="mt-2 text-gray-600">The dog you're looking for does not exist.</p>
        <Link href="/dogs" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          Back to Dogs
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <Link href="/dogs" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dogs
        </Link>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="h-64 relative">
          <Image 
            src={dog.imageUrl || 'https://via.placeholder.com/1200x400'} 
            alt={dog.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h1 className="text-3xl font-bold">{dog.name}</h1>
            <p className="text-lg opacity-90">{dog.breed}</p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-wrap gap-6">
            {/* Main information */}
            <div className="flex-1 min-w-[300px]">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Information</h2>
              
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Age</dt>
                  <dd className="mt-1 text-gray-900">{dog.age} {dog.age === 1 ? 'year' : 'years'}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Size</dt>
                  <dd className="mt-1 text-gray-900 capitalize">{dog.size}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Temperament</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {dog.temperament.map((temp) => (
                      <span key={temp} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {temp}
                      </span>
                    ))}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Special Needs</dt>
                  <dd className="mt-1">
                    {dog.specialNeeds.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {dog.specialNeeds.map((need) => (
                          <span key={need} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {need}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </dd>
                </div>
                
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Owner</dt>
                  <dd className="mt-1 flex items-center">
                    <span className="text-gray-900">{owner?.name || 'Unknown'}</span>
                    {owner && (
                      <Link href={`/owners/${owner.id}`} className="ml-3 text-sm text-primary-600 hover:text-primary-700">
                        View Owner
                      </Link>
                    )}
                  </dd>
                </div>
                
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 bg-gray-50 p-3 rounded-md">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <span className="text-gray-900">{dog.address.street}</span>
                      </div>
                      <div>
                        <span className="text-gray-900">{dog.address.city}, {dog.address.state} {dog.address.zip}</span>
                      </div>
                    </div>
                  </dd>
                </div>
              </dl>
              
              <div className="mt-6 flex space-x-3">
                <Link href={`/dogs/${dogId}/edit`} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Edit Dog
                </Link>
                <Link href={`/schedule/new?dogId=${dogId}`} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                  Schedule Walk
                </Link>
              </div>
            </div>
            
            {/* Walks and AI Insights */}
            <div className="flex-1 min-w-[300px]">
              {/* Upcoming Walks */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">Upcoming Walks</h2>
                  <Link href={`/schedule?dogId=${dogId}`} className="text-sm text-primary-600 hover:text-primary-700">
                    View All
                  </Link>
                </div>
                
                {upcomingWalks.length === 0 ? (
                  <p className="text-gray-500 text-sm py-3">No upcoming walks scheduled</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingWalks.map((walk) => (
                      <Link key={walk.id} href={`/schedule/${walk.id}`} className="block p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{formatDate(walk.date)}</p>
                            <p className="text-sm text-gray-500">{formatTime(walk.startTime)} · {walk.duration} min</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Health Insights */}
              {healthInsights && healthInsights.hasInsights && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="font-medium text-blue-800 mb-2">Health Insights</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-blue-500">Average Distance</p>
                      <p className="font-medium">{healthInsights.averageDistance} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-500">Average Time</p>
                      <p className="font-medium">{healthInsights.averageWalkTime} min</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-500">Average Mood</p>
                      <p className="font-medium">{healthInsights.averageMoodRating}/5</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-500">Walk Count</p>
                      <p className="font-medium">{healthInsights.walkCount}</p>
                    </div>
                  </div>
                  
                  {healthInsights.recommendations.length > 0 && (
                    <div>
                      <p className="text-xs text-blue-500 mb-1">Recommendations</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {healthInsights.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="flex">
                            <span className="text-blue-500 mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {/* Walker Recommendation */}
              {walkerRecommendation && (
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                  <h3 className="font-medium text-primary-800 mb-2">Recommended Walker</h3>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white">
                      <Image
                        src={(walkerRecommendation.data as any).imageUrl || 'https://via.placeholder.com/100'}
                        alt={(walkerRecommendation.data as any).name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">{(walkerRecommendation.data as any).name}</p>
                      <p className="text-sm text-gray-600">{walkerRecommendation.reason}</p>
                      <div className="mt-1">
                        <Link href={`/walkers/${(walkerRecommendation.data as any).id}`} className="text-xs text-primary-600 hover:text-primary-700">
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 