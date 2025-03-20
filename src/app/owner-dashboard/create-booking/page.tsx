'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { getDogsByOwnerId, getWalkerById } from '@/utils/helpers';
import { getUserActiveSubscription } from '@/lib/mockSubscriptions';
import { 
  getAvailableTimeSlots, 
  getTimeFromTimeSlot,
  isWalkerAvailable
} from '@/lib/mockBookings';
import { Dog, Walker } from '@/lib/types';
import { mockWalkers } from '@/lib/mockData';
import { generateId } from '@/utils/helpers';

export default function CreateBookingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<('AM' | 'PM')[]>([]);
  
  const [formData, setFormData] = useState({
    dogId: '',
    walkerId: '',
    date: '',
    timeSlot: '',
    notes: '',
  });
  
  useEffect(() => {
    if (!user) return;
    
    const loadData = () => {
      // Get owner's dogs
      const ownerDogs = getDogsByOwnerId(user.profileId || '');
      
      // Filter out dogs that haven't been approved yet
      const approvedDogs = ownerDogs.filter(dog => 
        dog.assessmentStatus === 'approved' || dog.assessmentStatus === 'not_required'
      );
      
      setDogs(approvedDogs);
      
      // Get active subscription
      const activeSubscription = getUserActiveSubscription(user.id);
      setSubscription(activeSubscription);
      
      // Get available walkers
      setWalkers(mockWalkers);
      
      setLoading(false);
    };
    
    setTimeout(loadData, 500);
  }, [user]);
  
  // Check for available time slots when walker or date changes
  useEffect(() => {
    if (formData.walkerId && formData.date) {
      const slots = getAvailableTimeSlots(formData.walkerId, formData.date);
      setAvailableTimeSlots(slots);
      
      // Reset the time slot if previously selected one is no longer available
      if (formData.timeSlot && !slots.includes(formData.timeSlot as 'AM' | 'PM')) {
        setFormData(prev => ({ ...prev, timeSlot: '' }));
      }
    } else {
      setAvailableTimeSlots([]);
    }
  }, [formData.walkerId, formData.date]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !subscription || subscription.creditsRemaining <= 0) return;
    
    setSubmitting(true);
    
    // Validate form
    if (!formData.dogId || !formData.walkerId || !formData.date || !formData.timeSlot) {
      alert('Please fill out all required fields');
      setSubmitting(false);
      return;
    }
    
    // Check if the slot is still available (in case it was booked while form was open)
    if (!isWalkerAvailable(formData.walkerId, formData.date, formData.timeSlot as 'AM' | 'PM')) {
      alert('Sorry, this time slot is no longer available. Please select another.');
      setAvailableTimeSlots(getAvailableTimeSlots(formData.walkerId, formData.date));
      setSubmitting(false);
      return;
    }
    
    // In a real app, this would make an API call to create a booking
    setTimeout(() => {
      // Get start time based on time slot
      const startTime = getTimeFromTimeSlot(formData.timeSlot as 'AM' | 'PM');
      
      const selectedDog = dogs.find(dog => dog.id === formData.dogId);
      
      const newWalk = {
        id: generateId('walk'),
        dogId: formData.dogId,
        walkerId: formData.walkerId,
        date: formData.date,
        startTime: startTime,
        timeSlot: formData.timeSlot as 'AM' | 'PM',
        duration: subscription.walkDuration || 60,
        status: 'scheduled',
        notes: formData.notes,
        subscriptionId: subscription.id
      };
      
      console.log('New walk created:', newWalk);
      
      // In a real app, this would also update the subscription credits
      
      // Redirect to the bookings page
      router.push('/owner-dashboard/bookings');
    }, 1000);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // Check if the user has an active subscription with credits
  if (!subscription) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Subscription Required</h2>
        <p className="text-gray-500 mb-4">
          You need an active subscription with available credits to book walks.
        </p>
        <Link
          href="/owner-dashboard/subscriptions"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Get a Subscription
        </Link>
      </div>
    );
  }
  
  // Check if the user has any approved dogs
  if (dogs.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">No Approved Dogs</h2>
        <p className="text-gray-500 mb-4">
          You don't have any dogs that have been approved for walking yet.
        </p>
        <Link
          href="/owner-dashboard/dogs"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Manage Your Dogs
        </Link>
      </div>
    );
  }
  
  // Check if the user has any credits remaining
  if (subscription.creditsRemaining <= 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">No Credits Remaining</h2>
        <p className="text-gray-500 mb-4">
          You've used all your walk credits. Please purchase a new subscription to book more walks.
        </p>
        <Link
          href="/owner-dashboard/subscriptions"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Get More Credits
        </Link>
      </div>
    );
  }
  
  return (
    <RouteGuard requiredPermission={{ action: 'create', resource: 'walks' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Book a Dog Walk</h1>
            <p className="mt-1 text-sm text-gray-500">
              You have {subscription.creditsRemaining} walk credits remaining
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Walk Details
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Schedule a walk with one of our qualified dog walkers
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dog Selection */}
              <div>
                <label htmlFor="dogId" className="block text-sm font-medium text-gray-700">
                  Choose a Dog
                </label>
                <select
                  id="dogId"
                  name="dogId"
                  required
                  value={formData.dogId}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select a dog</option>
                  {dogs.map(dog => (
                    <option key={dog.id} value={dog.id}>
                      {dog.name} ({dog.breed})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Walker Selection */}
              <div>
                <label htmlFor="walkerId" className="block text-sm font-medium text-gray-700">
                  Choose a Walker
                </label>
                <select
                  id="walkerId"
                  name="walkerId"
                  required
                  value={formData.walkerId}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select a walker</option>
                  {walkers.map(walker => (
                    <option key={walker.id} value={walker.id}>
                      {walker.name} (Rating: {walker.rating}/5)
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Date and Time Slot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700">
                    Time Slot
                  </label>
                  <select
                    id="timeSlot"
                    name="timeSlot"
                    required
                    value={formData.timeSlot}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    disabled={availableTimeSlots.length === 0}
                  >
                    <option value="">Select a time slot</option>
                    {availableTimeSlots.includes('AM') && (
                      <option value="AM">Morning (9:00 AM)</option>
                    )}
                    {availableTimeSlots.includes('PM') && (
                      <option value="PM">Afternoon (2:00 PM)</option>
                    )}
                  </select>
                  {formData.walkerId && formData.date && availableTimeSlots.length === 0 && (
                    <p className="mt-1 text-xs text-red-500">
                      No available slots for this walker on this date.
                    </p>
                  )}
                  {!formData.walkerId && (
                    <p className="mt-1 text-xs text-gray-500">
                      Please select a walker and date first.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Walk Duration - Display Only */}
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Walk Duration
                </label>
                <input
                  type="text"
                  id="duration"
                  disabled
                  value={`${subscription.walkDuration || 60} minutes`}
                  className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Walk duration is based on your subscription plan
                </p>
              </div>
              
              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Special Instructions (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Any special instructions for the walker..."
                ></textarea>
              </div>
              
              {/* Walker Capacity Info */}
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-blue-700">
                      Walkers have a maximum capacity of 6 dogs per walk, with two walks per day (morning and afternoon).
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Subscription Info */}
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-blue-700">
                      This walk will use 1 credit from your {subscription.walkCredits}-walk subscription plan.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-5">
                <Link
                  href="/owner-dashboard/bookings"
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting || availableTimeSlots.length === 0}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {submitting ? 'Booking...' : 'Book Walk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 