'use client';

import React from 'react';
import { Dog } from '@/lib/types';

interface AIRecommendationsProps {
  userDogs?: Dog[];
}

// AI recommendations component that displays personalized suggestions
export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ userDogs }) => {
  // For now this is a stub component, but it could use the userDogs data
  // to generate personalized recommendations in the future
  
  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h3 className="text-lg font-semibold mb-2">AI Recommendations</h3>
      <p className="text-gray-500">
        {userDogs && userDogs.length > 0
          ? `Recommendations based on ${userDogs.length} dog(s)`
          : 'No recommendations available'}
      </p>
    </div>
  );
};

export default AIRecommendations; 