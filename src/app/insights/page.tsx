import { mockDogs } from '@/lib/mockData';
import { getDogHealthInsights, getWalkerRecommendation, getScheduleRecommendation } from '@/lib/aiService';
import { getDogById, getWalkerById } from '@/utils/helpers';
import Image from 'next/image';
import Link from 'next/link';

export default async function InsightsPage() {
  // Get insights for all dogs
  const dogsWithInsights = await Promise.all(
    mockDogs.map(async (dog) => {
      const healthInsights = await getDogHealthInsights(dog.id);
      const walkerRecommendation = await getWalkerRecommendation(dog.id);
      const scheduleRecommendation = await getScheduleRecommendation(dog.id);
      
      return {
        dog,
        healthInsights,
        walkerRecommendation,
        scheduleRecommendation,
      };
    })
  );
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
        <p className="mt-2 text-gray-600">
          Personalized recommendations and insights powered by our AI
        </p>
      </div>
      
      {dogsWithInsights.map(({ dog, healthInsights, walkerRecommendation, scheduleRecommendation }) => (
        <div key={dog.id} className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <div className="h-10 w-10 rounded-full relative overflow-hidden mr-3">
              <Image
                src={dog.imageUrl || 'https://via.placeholder.com/100'}
                alt={dog.name}
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{dog.name}</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Insights */}
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="font-semibold text-blue-800">Health Insights</h3>
              </div>
              
              {healthInsights.hasInsights ? (
                <div>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-600">Average Distance</span>
                      <span className="font-medium">{healthInsights.averageDistance} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-600">Average Walk Time</span>
                      <span className="font-medium">{healthInsights.averageWalkTime} min</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-600">Average Mood</span>
                      <span className="font-medium">{healthInsights.averageMoodRating}/5</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-blue-700 mb-2">Recommendations:</h4>
                    <ul className="space-y-2">
                      {healthInsights.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="flex text-sm">
                          <span className="text-blue-600 mr-2">•</span>
                          <span className="text-gray-600">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">
                  Not enough walk data yet to generate insights for {dog.name}.
                </p>
              )}
            </div>
            
            {/* Walker Recommendation */}
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
                    src={(walkerRecommendation.data as any).imageUrl || 'https://via.placeholder.com/100'}
                    alt={(walkerRecommendation.data as any).name}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
                
                <div className="ml-4">
                  <p className="font-medium text-gray-900">{(walkerRecommendation.data as any).name}</p>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i} 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-3 w-3 ${i < Math.floor((walkerRecommendation.data as any).rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-xs text-gray-600">{(walkerRecommendation.data as any).rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-600">{walkerRecommendation.reason}</p>
                  
                  <div className="mt-3">
                    <Link href={`/walkers/${(walkerRecommendation.data as any).id}`} className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
                      View Profile
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 border-t border-primary-100 pt-4">
                <Link href={`/schedule/new?dogId=${dog.id}&walkerId=${(walkerRecommendation.data as any).id}`} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                  Schedule Walk with {(walkerRecommendation.data as any).name}
                </Link>
              </div>
            </div>
            
            {/* Schedule Recommendation */}
            <div className="bg-green-50 p-5 rounded-lg border border-green-100">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="font-semibold text-green-800">Optimal Schedule</h3>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  {scheduleRecommendation.reason}
                </p>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-green-600">Recommended Frequency</span>
                    <span className="font-medium">{(scheduleRecommendation.data as any).frequency} walks/week</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600">Recommended Duration</span>
                    <span className="font-medium">{(scheduleRecommendation.data as any).duration} minutes</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-green-700 mb-2">Suggested Weekly Schedule:</h4>
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {Object.entries((scheduleRecommendation.data as any).weeklySchedule).map(([day, times]: [string, any]) => (
                      <div key={day} className="bg-white rounded p-2 border border-green-100">
                        <div className="text-green-800 font-medium capitalize mb-1">{day.substring(0, 3)}</div>
                        {times.length > 0 ? (
                          times.map((time: string, i: number) => (
                            <div key={i} className="px-2 py-1 bg-green-100 rounded text-green-800 text-center">
                              {time}
                            </div>
                          ))
                        ) : (
                          <div className="px-2 py-1 bg-gray-100 rounded text-gray-400 text-center">
                            Rest
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-green-100">
                  <Link href={`/schedule/new?dogId=${dog.id}`} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                    Apply This Schedule
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 