'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { mockDogs } from '@/lib/mockData';
import { getUserActiveSubscription } from '@/lib/mockSubscriptions';
import { getAssessmentsByOwnerId } from '@/lib/mockAssessments';
import { getBookingsByOwnerId } from '@/lib/mockBookings';

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
    description: 'Schedule an assessment',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    href: '/owner-dashboard/dogs'
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
  const [workflowStatus, setWorkflowStatus] = useState<
    {step: string; completed: boolean; enabled: boolean}[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // In a real app, fetch this data from an API
    const checkWorkflowStatus = () => {
      // Step 1: Register Account - always completed if user exists
      const isRegistered = !!user;

      // Step 2: Add Dog - check if user has added any dogs
      const hasAddedDogs = mockDogs.some(dog => dog.ownerId === user.profileId);

      // Step 3: Dog Assessment - check if any dogs have completed assessments
      const assessments = getAssessmentsByOwnerId(user.profileId || '');
      const hasCompletedAssessment = assessments.some(assessment => 
        assessment.status === 'completed' && assessment.result === 'approved'
      );

      // Step 4: Buy Subscription - check if user has an active subscription
      const activeSubscription = getUserActiveSubscription(user.id);
      const hasActiveSubscription = !!activeSubscription;

      // Step 5: Book Walks - check if user has any bookings
      const bookings = getBookingsByOwnerId(user.profileId || '');
      const hasBookings = bookings.length > 0;

      // Set up workflow status
      const status = [
        { step: 'Register Account', completed: isRegistered, enabled: true },
        { step: 'Add Dog', completed: hasAddedDogs, enabled: isRegistered },
        { step: 'Dog Assessment', completed: hasCompletedAssessment, enabled: hasAddedDogs },
        { step: 'Buy Subscription', completed: hasActiveSubscription, enabled: hasCompletedAssessment },
        { step: 'Book Walks', completed: hasBookings, enabled: hasActiveSubscription }
      ];

      setWorkflowStatus(status);
      setLoading(false);
    };

    // Simulate API call
    setTimeout(checkWorkflowStatus, 500);
  }, [user]);

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {WORKFLOW_STEPS.map((step, index) => {
            const status = workflowStatus[index];
            let bgColor = "bg-gray-100";
            let textColor = "text-gray-500";
            let borderColor = "border-gray-200";
            
            if (status?.completed) {
              bgColor = "bg-green-50";
              textColor = "text-green-700";
              borderColor = "border-green-400";
            } else if (status?.enabled && !status?.completed) {
              bgColor = "bg-blue-50";
              textColor = "text-blue-700";
              borderColor = "border-blue-400";
            }
            
            return (
              <Link 
                key={step.title}
                href={status?.enabled ? step.href : "#"}
                className={`relative flex flex-col items-center p-4 rounded-lg border-2 ${borderColor} ${bgColor} ${!status?.enabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md transition-shadow'}`}
                onClick={(e) => !status?.enabled && e.preventDefault()}
              >
                <div className={`rounded-full p-2 mb-2 ${status?.completed ? 'bg-green-100' : (status?.enabled ? 'bg-blue-100' : 'bg-gray-200')}`}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-6 w-6 ${status?.completed ? 'text-green-600' : (status?.enabled ? 'text-blue-600' : 'text-gray-500')}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                  </svg>
                </div>
                <span className={`text-sm font-medium ${textColor} text-center`}>{step.title}</span>
                <span className="text-xs text-center mt-1">{step.description}</span>
                {status?.completed && (
                  <div className="absolute top-2 right-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
} 