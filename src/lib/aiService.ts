import { Dog, Walker, Walk } from './types';

// Get dog health insights based on walk history and behavior
export const getDogHealthInsights = async (
  dogId: string,
  dogs: Dog[],
  walks: Walk[]
): Promise<string> => {
  // Get the dog
  const dog = dogs.find(d => d.id === dogId);
  if (!dog) {
    return "Could not find dog data for analysis.";
  }

  // Get walks for this dog
  const dogWalks = walks.filter(w => w.dogId === dogId);
  
  // Generate insights
  const totalWalks = dogWalks.length;
  const completedWalks = dogWalks.filter(w => w.status === 'completed').length;
  
  if (totalWalks === 0) {
    return `${dog.name} hasn't had any walks yet. Regular walks are important for your dog's physical and mental health.`;
  }
  
  // Simple insights based on completion rate
  const completionRate = (completedWalks / totalWalks) * 100;
  
  if (completionRate < 70) {
    return `${dog.name} has missed ${totalWalks - completedWalks} out of ${totalWalks} scheduled walks. Consistency is key to maintaining good health - try to stick to your walking schedule.`;
  }
  
  return `${dog.name} has completed ${completedWalks} out of ${totalWalks} walks (${completionRate.toFixed(0)}% completion rate). Regular exercise is helping maintain good health!`;
};

// Recommend a compatible walker for a specific dog
export const getWalkerRecommendation = async (
  dogId: string,
  dogs: Dog[],
  walkers: Walker[],
  walks: Walk[]
): Promise<{ walkerId: string; reasons: string[] }> => {
  // Get the dog
  const dog = dogs.find(d => d.id === dogId);
  if (!dog) {
    return { walkerId: '', reasons: ["Could not find dog data for recommendation."] };
  }
  
  // Exit early if no walkers
  if (walkers.length === 0) {
    return { walkerId: '', reasons: ["No walkers available for recommendation."] };
  }
  
  // Calculate compatibility scores for each walker
  const scoredWalkers = walkers.map(walker => {
    let score = 0;
    const reasons: string[] = [];
    
    // Experience with breed
    if (walker.specialties?.includes(dog.breed)) {
      score += 10;
      reasons.push(`Has experience with ${dog.breed}s`);
    }
    
    // Experience with dog size
    if (dog.size === 'large' && walker.canHandleLargeDogs) {
      score += 5;
      reasons.push('Comfortable with large dogs');
    }
    
    // Experience with behavioral issues
    if (dog.behavioralIssues?.length && walker.canHandleBehavioralIssues) {
      score += 5;
      reasons.push('Experienced with behavioral issues');
    }
    
    // Geographic proximity (would require location data)
    // Prior successful walks with this dog
    const successfulWalks = walks.filter(w => 
      w.dogId === dogId && 
      w.walkerId === walker.id && 
      w.status === 'completed'
    );
    
    if (successfulWalks.length > 0) {
      score += successfulWalks.length * 2;
      reasons.push(`Has completed ${successfulWalks.length} successful walks with ${dog.name}`);
    }
    
    return { walker, score, reasons };
  });
  
  // Sort by score
  scoredWalkers.sort((a, b) => b.score - a.score);
  
  // Get the top recommendation
  const topRecommendation = scoredWalkers[0];
  
  // If we have no strong recommendations, provide a generic response
  if (topRecommendation.score < 5) {
    return { 
      walkerId: topRecommendation.walker.id, 
      reasons: ["Available for new clients", "Matches your schedule requirements"] 
    };
  }
  
  return { 
    walkerId: topRecommendation.walker.id, 
    reasons: topRecommendation.reasons 
  };
};

// Get personalized dog care tips based on breed and behavior
export const getDogCareTips = async (
  dogId: string,
  dogs: Dog[]
): Promise<string[]> => {
  const dog = dogs.find(d => d.id === dogId);
  if (!dog) {
    return ["Could not find dog data to provide care tips."];
  }
  
  const tips: string[] = [];
  
  // Breed-specific tips
  switch (dog.breed.toLowerCase()) {
    case 'labrador retriever':
      tips.push('Labradors are prone to joint issues - consider supplements with glucosamine and chondroitin.');
      tips.push('Labradors love water! Consider swimming as a low-impact exercise.');
      break;
    case 'german shepherd':
      tips.push('German Shepherds benefit from mental stimulation - try puzzle toys and advanced training.');
      tips.push('Watch for signs of hip dysplasia, a common issue in this breed.');
      break;
    case 'border collie':
      tips.push('Border Collies need constant mental challenges - agility training is perfect for them.');
      tips.push('Without sufficient exercise and mental stimulation, Border Collies may develop destructive behaviors.');
      break;
    default:
      tips.push(`Regular exercise is important for ${dog.name}'s physical and mental wellbeing.`);
  }
  
  // Age-specific tips
  const age = dog.age; // Use age directly as a number
  if (age < 2) {
    tips.push('Puppies need socialization with other dogs and people - consider puppy playdates and training classes.');
    tips.push('Be patient with house training - consistency is key.');
  } else if (age > 8) {
    tips.push('Senior dogs may need more frequent but shorter walks to maintain joint health.');
    tips.push('Consider a joint supplement and watch for signs of arthritis or stiffness.');
  }
  
  // Weight tips
  if (dog.weight && dog.weight > getBreedAverageWeight(dog.breed) * 1.2) {
    tips.push('Your dog appears to be overweight - consider adjusting food portions and increasing exercise.');
  }
  
  // Behavioral tips
  if (dog.behavioralIssues?.includes('separation anxiety')) {
    tips.push('For separation anxiety, try gradually increasing alone time and using enrichment toys.');
  }
  if (dog.behavioralIssues?.includes('leash pulling')) {
    tips.push('For leash pulling, consider a front-clip harness and practice loose-leash walking exercises.');
  }
  
  // Add some general tips if we don't have many specific ones
  if (tips.length < 3) {
    tips.push('Regular veterinary check-ups are essential for maintaining good health.');
    tips.push('Fresh water should always be available for your dog.');
    tips.push('Consider rotating toys to keep your dog mentally stimulated.');
  }
  
  return tips;
};

// Helper function to estimate average weight by breed
function getBreedAverageWeight(breed: string): number {
  const breedWeights: Record<string, number> = {
    'labrador retriever': 30,
    'german shepherd': 34,
    'border collie': 20,
    'beagle': 10,
    'chihuahua': 3,
    'great dane': 70,
    'bulldog': 23,
    'poodle': 28, // standard poodle
    'pug': 8,
    'golden retriever': 32,
  };
  
  return breedWeights[breed.toLowerCase()] || 25; // Default if breed not found
}

// Get daily walk duration recommendations based on breed, age, and size
export const getWalkDurationRecommendation = async (
  dogId: string,
  dogs: Dog[]
): Promise<{ recommendedMinutes: number; explanation: string }> => {
  const dog = dogs.find(d => d.id === dogId);
  if (!dog) {
    return { 
      recommendedMinutes: 30, 
      explanation: "Could not find dog data. Using default recommendation of 30 minutes." 
    };
  }
  
  let baseMinutes = 30; // Default starting point
  const factors: string[] = [];
  
  // Adjust for breed energy level
  const highEnergyBreeds = ['border collie', 'australian shepherd', 'jack russell terrier', 'dalmatian'];
  const lowEnergyBreeds = ['bulldog', 'basset hound', 'shih tzu', 'pug'];
  
  if (highEnergyBreeds.includes(dog.breed.toLowerCase())) {
    baseMinutes += 15;
    factors.push(`${dog.breed}s are high-energy dogs`);
  } else if (lowEnergyBreeds.includes(dog.breed.toLowerCase())) {
    baseMinutes -= 10;
    factors.push(`${dog.breed}s are lower-energy dogs`);
  }
  
  // Adjust for age
  const age = dog.age; // Use age directly as a number
  if (age < 2) {
    // Puppies need exercise but not too much
    baseMinutes = Math.min(baseMinutes, 20 + (age * 5));
    factors.push("puppies shouldn't overexercise as their joints are still developing");
  } else if (age > 8) {
    // Senior dogs may need less
    baseMinutes -= (age - 8) * 2;
    factors.push("senior dogs typically need gentler, shorter exercise");
  }
  
  // Adjust for size
  switch (dog.size) {
    case 'small':
      baseMinutes -= 5;
      factors.push("smaller dogs generally need less exercise time");
      break;
    case 'large':
      baseMinutes += 5;
      factors.push("larger dogs typically need more exercise time");
      break;
  }
  
  // Minimum and maximum bounds
  baseMinutes = Math.max(15, baseMinutes); // At least 15 minutes
  baseMinutes = Math.min(60, baseMinutes); // No more than 60 minutes
  
  // Generate explanation
  let explanation = `${baseMinutes} minutes is recommended for ${dog.name} because `;
  explanation += factors.join(" and ") + ".";
  
  return {
    recommendedMinutes: baseMinutes,
    explanation: explanation
  };
};
