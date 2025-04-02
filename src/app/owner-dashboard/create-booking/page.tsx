'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, addDays, isBefore, parseISO, differenceInDays } from 'date-fns';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { useOwnerDogs, useEnsureOwnerProfile, useOwnerByUserId, useUserSubscriptions } from '@/lib/hooks/useDataHooks';
import { 
  useDogAvailability, 
  useDogAvailabilityRange, 
  useCreateBooking,
  DateRange
} from '@/lib/hooks/useBookingHooks';
import { Dog, Owner } from '@/lib/types';
import { api } from '@/lib/api/client';

// Define interfaces for our data types
interface TimeSlot {
  time?: string | { start: string; end: string };
  available?: boolean;
  start?: string;
  end?: string;
}

interface DateAvailability {
  date: string;
  hasMorning: boolean;
  hasAfternoon: boolean;
  formattedDate: string;
}

// Simple BookingPage with cleaner UI and error handling
export default function CreateBookingPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Use React Query hooks for data
  const { 
    data: dogs = [], 
    isPending: isLoadingDogs, 
    error: dogsError,
    refetch: refetchDogs
  } = useOwnerDogs();
  
  const {
    data: userSubscriptions = [],
    isPending: isLoadingSubscriptions
  } = useUserSubscriptions();
  
  const {
    data: ownerProfile,
    isPending: isLoadingOwner,
    error: ownerError
  } = useOwnerByUserId();
  
  const {
    mutate: ensureOwnerProfile,
    isPending: isCreatingProfile,
    isSuccess: isProfileCreated
  } = useEnsureOwnerProfile();

  // Print on component mount
  useEffect(() => {
    console.log('🔵 BOOKING PAGE MOUNTED');
  }, []);

  // Basic state management
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [walkerName, setWalkerName] = useState('');
  
  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlot, setTimeSlot] = useState(''); // 'morning' or 'afternoon'
  const [notes, setNotes] = useState('');
  
  // Recurring booking options
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [endDate, setEndDate] = useState('');
  
  // UI state
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Derived state
  const [requiredCredits, setRequiredCredits] = useState(1);
  const [remainingCredits, setRemainingCredits] = useState(0);

  const [showAdvancedDebug, setShowAdvancedDebug] = useState(false);

  // Create date range for availability
  const startDate = format(new Date(), 'yyyy-MM-dd');
  const rangeEndDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
  const dateRange: DateRange = { startDate, endDate: rangeEndDate };

  // Use React Query for availability data
  const {
    data: availabilityData,
    isPending: isLoadingAvailability,
  } = useDogAvailabilityRange(selectedDog?.id || '', dateRange);

  // Process availability data
  const availableDates = React.useMemo(() => {
    if (!availabilityData?.availability) return [];
    return processAvailabilityData(availabilityData.availability);
  }, [availabilityData]);

  // Set walker name when availability data changes
  useEffect(() => {
    if (availabilityData?.walkerName) {
      setWalkerName(availabilityData.walkerName);
    }
  }, [availabilityData]);

  // Use the booking mutation
  const { 
    mutate: createBooking, 
    isPending: isSubmitting, 
    isSuccess: isBookingSuccess,
    error: bookingError
  } = useCreateBooking();

  // Handle profile creation success
  useEffect(() => {
    if (isProfileCreated) {
      refetchDogs();
    }
  }, [isProfileCreated, refetchDogs]);

  // Handle booking success
  useEffect(() => {
    if (isBookingSuccess) {
      setSuccessMessage('Your walk has been booked successfully!');
      setTimeout(() => {
        router.push('/owner-dashboard/bookings');
      }, 2000);
    }
  }, [isBookingSuccess, router]);

  // Set error message when booking fails
  useEffect(() => {
    if (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : 'Failed to create booking');
    }
  }, [bookingError]);

  // Debug logging
  useEffect(() => {
    console.log('=== Create Booking Page ===');
    console.log('Current user:', user);
    console.log('Available dogs from context:', dogs);
    console.log('User subscriptions:', userSubscriptions);
    console.log('Owner profile:', ownerProfile);
  }, [user, dogs, userSubscriptions, ownerProfile]);

  // Handle dog selection
  const handleDogChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const dogId = event.target.value;
    console.log('CreateBooking - Dog selected:', dogId);
    
    // Add type handling for dogs data
    const dogsArray = Array.isArray(dogs) ? dogs : dogs?.data || [];
    const selectedDog = dogsArray.find(dog => dog.id === dogId) || null;
    setSelectedDog(selectedDog);
    setSelectedDate('');
    setTimeSlot('');
  };

  // Load user's subscription and credits
  useEffect(() => {
    if (!user || !userSubscriptions.length) return;
    
    try {
      // Find user's active subscription
      const activeSubscription = userSubscriptions.find(sub => 
        sub.status === 'active' && 
        new Date(sub.endDate) > new Date() && 
        (sub.userId === user.id || sub.userId === user.profileId)
      );
      
      if (activeSubscription) {
        // Use creditsRemaining based on schema
        const credits = activeSubscription.creditsRemaining || 0;
        setRemainingCredits(credits);
      } else {
        // No active subscription found
        setRemainingCredits(0);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setRemainingCredits(0);
    }
  }, [user, userSubscriptions]);

  // Calculate required credits when recurring options change
  useEffect(() => {
    if (!isRecurring || !endDate || !selectedDate) {
      setRequiredCredits(1);
      return;
    }
    
    try {
      const start = parseISO(selectedDate);
      const end = parseISO(endDate);
      
      if (isBefore(end, start)) {
        // End date is before start date
        setRequiredCredits(1);
        return;
      }
      
      let days = differenceInDays(end, start);
      
      // Calculate number of occurrences based on frequency
      let occurrences = 1; // At least the first booking
      
      if (frequency === 'daily') {
        occurrences += days;
      } else if (frequency === 'weekly') {
        occurrences += Math.floor(days / 7);
      } else if (frequency === 'biweekly') {
        occurrences += Math.floor(days / 14);
      } else if (frequency === 'monthly') {
        occurrences += Math.floor(days / 30);
      }
      
      setRequiredCredits(occurrences);
    } catch (error) {
      console.error('Error calculating required credits:', error);
      setRequiredCredits(1);
    }
  }, [isRecurring, frequency, selectedDate, endDate]);

  // Process availability data from API response
  const processAvailabilityData = (availability: Record<string, any>): DateAvailability[] => {
    const dates: DateAvailability[] = [];
    
    for (const [dateStr, slots] of Object.entries(availability)) {
      const date = new Date(dateStr);
      
      // Skip dates in the past
      if (isBefore(date, new Date())) {
        continue;
      }
      
      // Check if morning and afternoon slots are available
      const hasMorning = slots.morning?.available || false;
      const hasAfternoon = slots.afternoon?.available || false;
      
      // Skip if no slots available
      if (!hasMorning && !hasAfternoon) {
        continue;
      }
      
      dates.push({
        date: dateStr,
        hasMorning,
        hasAfternoon,
        formattedDate: format(date, 'EEEE, MMMM d, yyyy')
      });
    }
    
    return dates;
  };

  // Handle date selection
  const handleDateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const date = event.target.value;
    setSelectedDate(date);
    setTimeSlot('');
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedDog || !selectedDate || !timeSlot) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (requiredCredits > remainingCredits) {
      setError(`You don't have enough credits for this booking. Required: ${requiredCredits}, Available: ${remainingCredits}`);
      return;
    }
    
    setError('');
    
    // Prepare booking data and use React Query mutation
    const bookingData = {
      dogId: selectedDog.id,
      date: selectedDate,
      timeSlot: timeSlot,
      notes: notes,
      isRecurring: isRecurring,
      frequency: isRecurring ? frequency : undefined,
      endDate: isRecurring ? endDate : undefined
    };
    
    createBooking(bookingData);
  };

  // Handle ensuring user has owner profile
  const handleCreateProfile = () => {
    ensureOwnerProfile({
      name: user?.name || '',
      email: user?.email || ''
    });
  };

  // Advanced Debugging Panel
  const AdvancedDebugPanel = () => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-gray-700">Advanced Debugging</h3>
        <button
          onClick={() => setShowAdvancedDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-1">User Info</h4>
          <pre className="bg-white rounded border p-2 overflow-auto max-h-32">
            {JSON.stringify({
              id: user?.id,
              name: user?.name,
              email: user?.email,
              role: user?.role,
              profileId: user?.profileId
            }, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-semibold mb-1">Owner Profile</h4>
          {ownerProfile ? (
            <pre className="bg-white rounded border p-2 overflow-auto max-h-32">
              {JSON.stringify(ownerProfile, null, 2)}
            </pre>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
              <p className="text-yellow-700">No owner profile found</p>
              <button
                onClick={handleCreateProfile}
                disabled={isCreatingProfile}
                className="mt-2 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-1 px-2 rounded disabled:opacity-50"
              >
                {isCreatingProfile ? 'Creating...' : 'Create Owner Profile'}
              </button>
            </div>
          )}
        </div>
        
        <div>
          <h4 className="font-semibold mb-1">Dogs ({Array.isArray(dogs) ? dogs.length : (dogs?.data?.length || 0)})</h4>
          <pre className="bg-white rounded border p-2 overflow-auto max-h-36">
            {JSON.stringify(
              (Array.isArray(dogs) ? dogs : dogs?.data || []).map((dog: any) => ({
                id: dog.id,
                name: dog.name,
                ownerId: dog.ownerId
              }))
            , null, 2)}
          </pre>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => refetchDogs()}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-1 px-2 rounded"
          >
            Refresh Dogs
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium py-1 px-2 rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );

  // Debug button
  const DebugButton = () => (
    <button
      onClick={() => setShowAdvancedDebug(true)}
      className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg opacity-50 hover:opacity-100 text-xs"
    >
      Debug Tools
    </button>
  );

  // Show loading state while setting up
  const isLoadingData = isLoadingDogs || isLoadingSubscriptions || isLoadingOwner;

  return (
    <RouteGuard requiredPermission={{ action: 'create', resource: 'walks' }}>
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Show advanced debugging if enabled */}
        {showAdvancedDebug && <AdvancedDebugPanel />}
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Book a Walk</h1>
          <p className="mt-2 text-gray-600">Schedule a walk for your dog with our professional walkers.</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            {/* Step 1: Select Dog */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select Your Dog</h2>
              
              {isLoadingData ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading your dogs...</p>
                </div>
              ) : !ownerProfile ? (
                <div className="text-center py-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="text-yellow-700 mb-2">Your owner profile needs to be set up first</div>
                  <p className="text-gray-600 mb-4">Before booking walks, we need to complete your owner profile.</p>
                  <button
                    type="button"
                    onClick={handleCreateProfile}
                    disabled={isCreatingProfile}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isCreatingProfile ? 'Creating Profile...' : 'Set Up Profile'}
                  </button>
                </div>
              ) : Array.isArray(dogs) ? dogs.length : (dogs?.data?.length || 0) === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">You haven't added any dogs yet.</p>
                  <Link
                    href="/owner-dashboard/dogs/add"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Add a Dog
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="dogSelect" className="block text-sm font-medium text-gray-700">
                    Choose a dog <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="dogSelect"
                    value={selectedDog ? selectedDog.id : ''}
                    onChange={handleDogChange}
                    className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select a dog</option>
                    {(Array.isArray(dogs) ? dogs : dogs?.data || []).map(dog => (
                      <option key={dog.id} value={dog.id}>
                        {dog.name}
                      </option>
                    ))}
                  </select>
                  
                  {walkerName && (
                    <p className="mt-2 text-sm text-gray-600">
                      Assigned walker: {walkerName}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Select date */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Select a Date</h2>
              
              {!selectedDog ? (
                <p className="text-sm text-gray-500">Please select a dog first</p>
              ) : isLoadingAvailability ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading available dates...</p>
                </div>
              ) : (
                <>
                  {availableDates.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">No available dates found for the next 30 days. Your assigned walker may not have availability.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label htmlFor="dateSelect" className="block text-sm font-medium text-gray-700">
                        Choose an available date <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="dateSelect"
                        value={selectedDate}
                        onChange={handleDateChange}
                        className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">Select a date</option>
                        {availableDates.map(({ date, formattedDate }) => (
                          <option key={date} value={date}>
                            {formattedDate}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Step 3: Select time slot */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Select a Time</h2>
              
              {!selectedDate ? (
                <p className="text-sm text-gray-500">Please select a date first</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {/* Morning option */}
                  {availableDates.find(d => d.date === selectedDate)?.hasMorning ? (
                    <button
                      type="button"
                      onClick={() => setTimeSlot('morning')}
                      className={`
                        p-4 rounded-lg border text-center transition-all
                        ${timeSlot === 'morning'
                          ? 'bg-teal-100 border-teal-500 text-teal-700' 
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
                      `}
                    >
                      <div className="text-2xl font-bold">Morning</div>
                      <div className="mt-2 text-sm">8:00 AM - 12:00 PM</div>
                    </button>
                  ) : (
                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-100 text-center">
                      <div className="text-2xl font-bold text-gray-400">Morning</div>
                      <div className="mt-2 text-sm text-gray-400">Not available</div>
                    </div>
                  )}
                  
                  {/* Afternoon option */}
                  {availableDates.find(d => d.date === selectedDate)?.hasAfternoon ? (
                    <button
                      type="button"
                      onClick={() => setTimeSlot('afternoon')}
                      className={`
                        p-4 rounded-lg border text-center transition-all
                        ${timeSlot === 'afternoon'
                          ? 'bg-teal-100 border-teal-500 text-teal-700' 
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
                      `}
                    >
                      <div className="text-2xl font-bold">Afternoon</div>
                      <div className="mt-2 text-sm">1:00 PM - 5:00 PM</div>
                    </button>
                  ) : (
                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-100 text-center">
                      <div className="text-2xl font-bold text-gray-400">Afternoon</div>
                      <div className="mt-2 text-sm text-gray-400">Not available</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 4: Recurring options */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-lg font-medium">Step 4: Recurring Booking Options</h3>
                <span className="text-sm text-gray-500">(Optional)</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="recurringCheckbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                  />
                  <label htmlFor="recurringCheckbox" className="text-sm font-medium text-gray-700">
                    Make this a recurring booking
                  </label>
                </div>
                
                {isRecurring && (
                  <div className="pl-6 space-y-4 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="frequencySelect" className="block text-sm font-medium text-gray-700">
                          How often? <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="frequencySelect"
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'biweekly' | 'monthly')}
                          className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required={isRecurring}
                        >
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Every 2 Weeks</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="endDateInput" className="block text-sm font-medium text-gray-700">
                          Until when? <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="endDateInput"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={selectedDate ? format(addDays(new Date(selectedDate), 7), 'yyyy-MM-dd') : ''}
                          className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required={isRecurring}
                        />
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-md text-sm">
                      <p>
                        This recurring booking will require <strong>{requiredCredits}</strong> walk credits.
                        You currently have <strong>{remainingCredits}</strong> credits remaining.
                      </p>
                      
                      {requiredCredits > remainingCredits && (
                        <p className="mt-2 text-red-500">
                          You don't have enough credits for this recurring booking schedule.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 5: Special instructions */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-lg font-medium">Step 5: Special Instructions</h3>
                <span className="text-sm text-gray-500">(Optional)</span>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="notesTextarea" className="block text-sm font-medium text-gray-700">
                  Notes for your walker
                </label>
                <textarea
                  id="notesTextarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Any special instructions or requests for this walk"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={
                isSubmitting || 
                !selectedDog || 
                !selectedDate || 
                !timeSlot ||
                (isRecurring && (!endDate || requiredCredits > remainingCredits))
              }
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Booking..." : "Book Walk"}
            </button>
          </div>
        </form>
        
        {/* Show debug button if debug mode is not active */}
        {!showAdvancedDebug && <DebugButton />}
      </div>
    </RouteGuard>
  );
} 