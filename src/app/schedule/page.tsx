import { getUpcomingWalks, getPastWalks, getDogById, getWalkerById, formatDate, formatTime } from '@/utils/helpers';
import Image from 'next/image';
import Link from 'next/link';

export default function SchedulePage() {
  const upcomingWalks = getUpcomingWalks();
  const pastWalks = getPastWalks(undefined, 5);
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <Link href="/schedule/new" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Schedule Walk
        </Link>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Walks</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {upcomingWalks.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No upcoming walks scheduled</p>
              <Link href="/schedule/new" className="mt-3 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
                Schedule your first walk
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          ) : (
            upcomingWalks.map((walk) => {
              const dog = getDogById(walk.dogId);
              const walker = getWalkerById(walk.walkerId);
              
              if (!dog || !walker) return null;
              
              return (
                <div key={walk.id} className="p-6 hover:bg-gray-50">
                  <div className="sm:flex sm:items-center sm:justify-between">
                    <div className="sm:flex sm:items-center">
                      <div className="flex-shrink-0">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-full relative overflow-hidden">
                            <Image
                              src={dog.imageUrl || 'https://via.placeholder.com/100'}
                              alt={dog.name}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                          <div className="h-12 w-12 rounded-full relative overflow-hidden -ml-4 ring-2 ring-white">
                            <Image
                              src={walker.imageUrl || 'https://via.placeholder.com/100'}
                              alt={walker.name}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-0 sm:ml-4">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {dog.name} with {walker.name}
                          </h3>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Scheduled
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(walk.date)} at {formatTime(walk.startTime)}</span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{walk.duration} minutes</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-0 sm:flex sm:items-center">
                      <Link href={`/schedule/${walk.id}`} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        View Details
                      </Link>
                      <Link href={`/schedule/${walk.id}/edit`} className="mt-2 sm:mt-0 sm:ml-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Past Walks</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {pastWalks.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No past walks found</p>
            </div>
          ) : (
            pastWalks.map((walk) => {
              const dog = getDogById(walk.dogId);
              const walker = getWalkerById(walk.walkerId);
              
              if (!dog || !walker) return null;
              
              return (
                <div key={walk.id} className="p-6 hover:bg-gray-50">
                  <div className="sm:flex sm:items-center sm:justify-between">
                    <div className="sm:flex sm:items-center">
                      <div className="flex-shrink-0">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-full relative overflow-hidden">
                            <Image
                              src={dog.imageUrl || 'https://via.placeholder.com/100'}
                              alt={dog.name}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-0 sm:ml-4">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {dog.name} with {walker.name}
                          </h3>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Completed
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(walk.date)} at {formatTime(walk.startTime)}</span>
                        </div>
                        {walk.metrics && (
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>{walk.metrics.distanceCovered.toFixed(1)} km · {walk.metrics.totalTime} minutes</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-0">
                      <Link href={`/schedule/${walk.id}`} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
} 