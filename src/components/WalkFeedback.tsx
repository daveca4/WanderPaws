'use client';

import { useState } from 'react';
import { useSubmitWalkFeedback } from '@/lib/hooks/useDataHooks';

interface WalkFeedbackProps {
  walkId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function WalkFeedback({ walkId, onSuccess, onCancel }: WalkFeedbackProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  
  const mutation = useSubmitWalkFeedback();
  const { mutate } = mutation;
  const isLoading = mutation.status === 'pending';
  const error = mutation.error;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      return; // Rating is required
    }
    
    mutate(
      { walkId, feedback: { rating, comment } },
      {
        onSuccess: () => {
          onSuccess();
        }
      }
    );
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          How would you rate this walk?
        </label>
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                rating >= value 
                  ? 'bg-yellow-400 text-white' 
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill={rating >= value ? 'currentColor' : 'none'} 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          ))}
        </div>
        {rating === 0 && (
          <p className="mt-1 text-sm text-red-600">Please select a rating</p>
        )}
      </div>
      
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
          Comments (optional)
        </label>
        <textarea
          id="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about the walk..."
          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
        />
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error instanceof Error ? error.message : 'An error occurred while submitting feedback.'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex space-x-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || rating === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isLoading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </form>
  );
} 