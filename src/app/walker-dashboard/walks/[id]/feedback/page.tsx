'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
// Removed mock data import
import { Walk, Dog } from '@/lib/types';

// Format date for display
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Function to get dog details by ID
const getDogById = (dogId: string): Dog | undefined => {
  return mockDogs.find(dog => dog.id === dogId);
};

export default function WalkFeedbackPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const walkId = params.id;
  
  const [walk, setWalk] = useState<Walk | null>(null);
  const [dog, setDog] = useState<Dog | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Form state
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [poopCount, setPoopCount] = useState<number>(0);
  const [peeCount, setPeeCount] = useState<number>(0);
  const [moodRating, setMoodRating] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [behaviorsObserved, setBehaviorsObserved] = useState<string[]>([]);
  const [behaviorInput, setBehaviorInput] = useState<string>('');
  
  // Redirect if not a walker or admin
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'walker' && user.role !== 'admin') {
        router.push('/unauthorized');
      } else {
        // Find the walk by ID
        const foundWalk = mockWalks.find(w => w.id === walkId);
        
        // Check if the walk exists, is completed, and belongs to this walker
        if (!foundWalk) {
          setFormError('Walk not found');
        } else if (foundWalk.walkerId !== user.profileId) {
          setFormError('You are not authorized to provide feedback for this walk');
        } else if (foundWalk.status !== 'completed') {
          setFormError('Feedback can only be provided for completed walks');
        } else if (foundWalk.feedback) {
          setFormError('Feedback has already been provided for this walk');
        } else {
          setWalk(foundWalk);
          const dogInfo = getDogById(foundWalk.dogId);
          if (dogInfo) {
            setDog(dogInfo);
          }
        }
      }
    }
  }, [walkId, user, loading, router]);
  
  const addBehavior = () => {
    if (behaviorInput.trim() && !behaviorsObserved.includes(behaviorInput.trim())) {
      setBehaviorsObserved([...behaviorsObserved, behaviorInput.trim()]);
      setBehaviorInput('');
    }
  };
  
  const removeBehavior = (behavior: string) => {
    setBehaviorsObserved(behaviorsObserved.filter(b => b !== behavior));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walk || !dog) return;
    
    try {
      setSaving(true);
      setFormError(null);
      
      // Prepare feedback data
      const feedbackData = {
        rating,
        comment,
        timestamp: new Date().toISOString()
      };
      
      // Prepare metrics data
      const metricsData = {
        distanceCovered: 0, // This would be calculated in a real app
        totalTime: walk.duration, // Using scheduled duration as a fallback
        poopCount,
        peeCount,
        moodRating,
        behaviorsObserved
      };
      
      // In a real app, this would make an API call to update the walk with feedback
      console.log('Submitting feedback:', feedbackData);
      console.log('Submitting metrics:', metricsData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect back to walks page
      router.push('/walker-dashboard/walks');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFormError('Failed to submit feedback. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // If loading or not walker/admin, show loading state
  if (loading || !user || (user.role !== 'walker' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // If there's an error finding the walk or it's not valid
  if (formError && !walk) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Walk Feedback</h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{formError}</p>
            <button
              onClick={() => router.push('/walker-dashboard/walks')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Return to Walks
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Walk Feedback</h1>
        <button
          onClick={() => router.push('/walker-dashboard/walks')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500"
        >
          Back to Walks
        </button>
      </div>
      
      {dog && walk && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
              <Image
                src={dog.imageUrl || 'https://via.placeholder.com/64'}
                alt={dog.name}
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">{dog.name}</h2>
              <p className="text-gray-500">{dog.breed} • {dog.size}</p>
              <p className="text-gray-500">Walk on {formatDate(walk.date)}</p>
            </div>
          </div>
          
          {formError && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{formError}</h3>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How was the walk with {dog.name}?
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`h-8 w-8 rounded-full focus:outline-none ${
                      rating >= star ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {rating === 1 ? 'Poor' : 
                   rating === 2 ? 'Fair' : 
                   rating === 3 ? 'Good' : 
                   rating === 4 ? 'Very Good' : 'Excellent'}
                </span>
              </div>
            </div>
            
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Comments about the walk
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share any thoughts or observations about the walk..."
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Walk Metrics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="poopCount" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of poops
                  </label>
                  <input
                    type="number"
                    id="poopCount"
                    min="0"
                    value={poopCount}
                    onChange={(e) => setPoopCount(parseInt(e.target.value) || 0)}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="peeCount" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of pees
                  </label>
                  <input
                    type="number"
                    id="peeCount"
                    min="0"
                    value={peeCount}
                    onChange={(e) => setPeeCount(parseInt(e.target.value) || 0)}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {dog.name}'s mood during the walk
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => setMoodRating(mood as 1 | 2 | 3 | 4 | 5)}
                      className={`h-8 w-8 rounded-full focus:outline-none ${
                        moodRating >= mood 
                          ? 'text-blue-500' 
                          : 'text-gray-300'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 110-12 6 6 0 010 12zm-3-4a1 1 0 100-2 1 1 0 000 2zm6-1a1 1 0 11-2 0 1 1 0 012 0zM7 9a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {moodRating === 1 ? 'Anxious' : 
                     moodRating === 2 ? 'Nervous' : 
                     moodRating === 3 ? 'Neutral' : 
                     moodRating === 4 ? 'Happy' : 'Excellent'}
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Behaviors observed during the walk
                </label>
                
                <div className="flex">
                  <input
                    type="text"
                    value={behaviorInput}
                    onChange={(e) => setBehaviorInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBehavior())}
                    placeholder="Enter a behavior..."
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-l-md"
                  />
                  <button
                    type="button"
                    onClick={addBehavior}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Add
                  </button>
                </div>
                
                {behaviorsObserved.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {behaviorsObserved.map((behavior, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {behavior}
                        <button
                          type="button"
                          onClick={() => removeBehavior(behavior)}
                          className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600"
                        >
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="mt-2 text-sm text-gray-500">
                  Examples: playful, tired, distracted, anxious, friendly with other dogs
                </p>
              </div>
            </div>
            
            <div className="pt-6 flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/walker-dashboard/walks')}
                className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {saving ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 