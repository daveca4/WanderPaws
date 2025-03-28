'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { getDogsByOwnerId } from '@/utils/dataHelpers';

// Define the workflow steps
const WORKFLOW_STEPS = [
  { 
    title: 'Register Account',
    description: 'Create your account',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    href: '/profile'
  },
  { 
    title: 'Add Dog',
    description: 'Register your pet',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    href: '/owner-dashboard/dogs/add'
  },
  { 
    title: 'Dog Assessment',
    description: 'All dogs need to be assessed before they can be walked with WanderPaws',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    href: '/owner-dashboard/assessment'
  },
  { 
    title: 'Buy Subscription',
    description: 'Choose a plan',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    href: '/owner-dashboard/subscriptions'
  },
  { 
    title: 'Book Walks',
    description: 'Schedule dog walks',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    href: '/owner-dashboard/create-booking'
  }
];

export function WorkflowProgress() {
  const { user } = useAuth();
  const { dogs = [], assessments = [], walks = [], userSubscriptions = [] } = useData();
  const [workflowStatus, setWorkflowStatus] = useState<
    {step: string; completed: boolean; enabled: boolean; pendingAssessment?: boolean}[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Check if there's already an assessment and determine the appropriate URL
  const dogAssessmentStepUrl = () => {
    // Check if there's already an assessment
    const hasAssessment = user && user.profileId && assessments.some(a => a.ownerId === user.profileId);
    
    return hasAssessment 
      ? '/owner-dashboard/assessment/status' 
      : '/owner-dashboard/assessment';
  };

  useEffect(() => {
    if (!user) return;

    // Fetch this data from DataContext
    const checkWorkflowStatus = () => {
      // Step 1: Register Account - always completed if user exists
      const isRegistered = !!user;

      // Step 2: Add Dog - check if user has added any dogs
      const userDogs = getDogsByOwnerId(dogs, user.profileId || '');
      const hasAddedDogs = userDogs.length > 0;

      // Step 3: Dog Assessment - check if any dogs have completed assessments
      const dogAssessments = assessments.filter(assessment => 
        userDogs.some(dog => assessment.dogId === dog.id)
      );
      const hasCompletedAssessment = dogAssessments.some(assessment => 
        assessment.status === 'completed' && assessment.result === 'approved'
      );
      
      // Check if there are any pending or scheduled assessments
      const hasPendingAssessment = dogAssessments.some(assessment => 
        assessment.status === 'pending' || assessment.status === 'scheduled'
      );

      // Step 4: Buy Subscription - check if user has an active subscription
      const now = new Date();
      const activeSubscription = userSubscriptions?.find(sub => 
        sub.userId === user.id && 
        sub.status === 'active' && 
        new Date(sub.endDate) >= now
      );
      const hasActiveSubscription = !!activeSubscription;

      // Step 5: Book Walks - check if user has any bookings
      const userWalks = walks.filter(walk => 
        userDogs.some(dog => walk.dogId === dog.id)
      );
      const hasBookings = userWalks.length > 0;

      // Set up workflow status
      const status = [
        { step: 'Register Account', completed: isRegistered, enabled: true },
        { step: 'Add Dog', completed: hasAddedDogs, enabled: true },
        { step: 'Dog Assessment', completed: hasCompletedAssessment, enabled: hasAddedDogs, pendingAssessment: hasPendingAssessment },
        { step: 'Buy Subscription', completed: hasActiveSubscription, enabled: hasCompletedAssessment },
        { step: 'Book Walks', completed: hasBookings, enabled: hasActiveSubscription }
      ];

      setWorkflowStatus(status);
      setLoading(false);
    };

    // Check status immediately when data is available
    checkWorkflowStatus();
  }, [user, dogs, assessments, walks, userSubscriptions]);

  if (loading) {
    return (
      <div className="animate-pulse bg-white shadow rounded-lg overflow-hidden">
        <div className="h-24 bg-gray-200"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
      <div className="p-4 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Getting Started with WanderPaws</h2>
        <div className="grid grid-cols-1 gap-4 auto-cols-fr" style={{
          gridTemplateColumns: `repeat(${workflowStatus.filter(status => !status.completed).length}, minmax(0, 1fr))`
        }}>
          {WORKFLOW_STEPS.map((step, index) => {
            const status = workflowStatus[index];
            // Skip completed steps
            if (status?.completed) return null;
            
            let bgColor = "bg-gray-100";
            let textColor = "text-gray-500";
            let borderColor = "border-gray-200";
            
            if (status?.enabled && !status?.completed) {
              bgColor = "bg-blue-50";
              textColor = "text-blue-700";
              borderColor = "border-blue-400";
            }
            
            // Determine href based on status
            let href = step.href;
            let stepIcon = step.icon;
            let statusDescription = step.description;
            
            // If it's a Dog Assessment with pending/scheduled assessment
            if (step.title === 'Dog Assessment' && status?.pendingAssessment) {
              href = dogAssessmentStepUrl(); // Link to assessment status page
              stepIcon = 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'; // Checkmark in circle icon
              statusDescription = 'Assessment pending';
              
              // Change colors to indicate pending status
              if (!status.completed) {
                bgColor = "bg-yellow-50";
                textColor = "text-yellow-700";
                borderColor = "border-yellow-400";
              }
            }
            
            return (
              <Link 
                key={step.title}
                href={status?.enabled ? href : "#"}
                className={`relative flex flex-col items-center p-4 rounded-lg border-2 ${borderColor} ${bgColor} ${!status?.enabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md transition-shadow'}`}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => !status?.enabled && e.preventDefault()}
              >
                <div className={`rounded-full p-2 mb-2 ${status?.enabled ? 'bg-blue-100' : 'bg-gray-200'}`}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-6 w-6 ${status?.enabled ? 'text-blue-600' : 'text-gray-500'}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stepIcon} />
                  </svg>
                </div>
                <span className={`text-sm font-medium ${textColor} text-center`}>{step.title}</span>
                <span className="text-xs text-center mt-1">{statusDescription}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
} 