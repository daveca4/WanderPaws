'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, addDays, isBefore, parseISO, differenceInDays } from 'date-fns';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { getDogsForUser } from '@/utils/userHelper';

// Define interfaces for our data types
interface Dog {
  id: string;
  name: string;
  breed?: string;
  age?: number;
  [key: string]: any; // Allow for additional properties
}

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
  const { dogs, userSubscriptions } = useData();

  // Print on component mount
  useEffect(() => {
    console.log('🔵 BOOKING PAGE MOUNTED');
    setIsLoading(true); // Start loading state
  }, []);

  // Basic state management
  const [userDogs, setUserDogs] = useState<Dog[]>([]);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [walkerName, setWalkerName] = useState('');
  
  const [availableDates, setAvailableDates] = useState<DateAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  
  const [timeSlot, setTimeSlot] = useState(''); // 'morning' or 'afternoon'
  const [notes, setNotes] = useState('');
  
  // Recurring booking options
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('weekly');
  const [endDate, setEndDate] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Derived state
  const [requiredCredits, setRequiredCredits] = useState(1);
  const [remainingCredits, setRemainingCredits] = useState(0);

  // Debug logging
  useEffect(() => {
    console.log('=== Create Booking Page ===');
    console.log('Current user:', user);
    console.log('Available dogs from context:', dogs);
    console.log('User subscriptions:', userSubscriptions);
  }, [user, dogs, userSubscriptions]);

  // Get minimum booking date (48 hours from now)
  const getMinimumBookingDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return format(date, 'yyyy-MM-dd');
  };

  // Load user's dogs using the same logic as "my dogs" section
  useEffect(() => {
    if (!user || !dogs || !Array.isArray(dogs)) {
      console.log('🔴 Dog loading aborted - missing user or dogs data');
      setIsLoading(false);
      return;
    }

    console.log('🔵 Loading dogs for user:', user.id);
    console.log('🔵 Total dogs in context:', dogs.length);
    
    // Use the EXACT same approach as my dogs section - simple, direct, no special cases
    const userDogs = getDogsForUser(dogs, user);
    
    console.log('🔵 Found user dogs:', userDogs.length, userDogs.map(d => d.name));
    console.log('🔵 User ID used for matching:', user.id);
    console.log('🔵 Profile ID used for matching:', user.profileId);
    
    // Set the dogs and select the first one if available
    setUserDogs(userDogs);
    
    if (userDogs.length > 0) {
      if (!selectedDog) {
        console.log('🔵 Auto-selecting first dog:', userDogs[0].name);
        setSelectedDog(userDogs[0]);
      }
    } else {
      console.log('🔴 No dogs found for this user');
    }
    
    setIsLoading(false);
  }, [user, dogs]);

  // Load user's subscription and credits
  useEffect(() => {
    if (!user || !userSubscriptions) return;
    
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

  // When dog is selected, fetch available dates
  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!selectedDog) return;
      
      setIsLoading(true);
      try {
        // Get a 30-day range for availability
        const startDate = format(new Date(), 'yyyy-MM-dd');
        const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
        
        const response = await fetch(
          `/api/walks/availability/range?dogId=${selectedDog.id}&startDate=${startDate}&endDate=${endDate}`
        );
        
        if (!response.ok) throw new Error('Failed to fetch availability');
        
        const data = await response.json();
        console.log('Availability data:', data);
        
        // Extract available dates from the API response
        const dates = processAvailabilityData(data.availability || {});
        setAvailableDates(dates);
        
        // Set walker name if available
        if (data.walkerName) {
          setWalkerName(data.walkerName);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching availability:', error);
        setError('Could not load available dates. Please try again later.');
        setIsLoading(false);
      }
    };

    if (selectedDog) {
      fetchAvailableDates();
    }
  }, [selectedDog]);

  // Calculate required credits when recurring options change
  useEffect(() => {
    if (!isRecurring || !endDate || !selectedDate) {
      setRequiredCredits(1);
      return;
    }
    
    try {
      const start = parseISO(selectedDate);
      const end = parseISO(endDate);
      
      let totalOccurrences = 0;
      
      switch (frequency) {
        case 'weekly':
          totalOccurrences = Math.floor(differenceInDays(end, start) / 7) + 1;
          break;
        case 'biweekly':
          totalOccurrences = Math.floor(differenceInDays(end, start) / 14) + 1;
          break;
        case 'monthly':
          // Approximate - not exact due to varying month lengths
          totalOccurrences = Math.floor(differenceInDays(end, start) / 30) + 1;
          break;
        default:
          totalOccurrences = 1;
      }
      
      setRequiredCredits(Math.max(1, totalOccurrences));
    } catch (error) {
      console.error('Error calculating credits:', error);
      setRequiredCredits(1);
    }
  }, [isRecurring, frequency, selectedDate, endDate]);

  // Process the API response into a usable format
  const processAvailabilityData = (availabilityData: Record<string, TimeSlot[]>): DateAvailability[] => {
    const availableDates: DateAvailability[] = [];
    
    Object.entries(availabilityData).forEach(([dateStr, slots]) => {
      // Skip dates before minimum booking date
      if (isBefore(new Date(dateStr), new Date(getMinimumBookingDate()))) {
        return;
      }
      
      // Check if any slots are available for this date
      if (!Array.isArray(slots) || slots.length === 0) {
        return;
      }
      
      // Check for morning and afternoon availability
      let hasMorning = false;
      let hasAfternoon = false;
      
      slots.forEach(slot => {
        // Skip if explicitly marked as unavailable
        if (slot.available === false) return;
        
        // Check for morning slot (time either contains AM or is before noon)
        if (
          // Check time as string
          (typeof slot.time === 'string' && 
            (slot.time.toLowerCase().includes('am') || 
             (slot.time.includes(':') && parseInt(slot.time.split(':')[0], 10) < 12))) ||
          // Check nested time object
          (slot.time && typeof slot.time === 'object' && slot.time.start && 
            parseInt(slot.time.start.split(':')[0], 10) < 12) ||
          // Check direct start property
          (slot.start && parseInt(slot.start.split(':')[0], 10) < 12)
        ) {
          hasMorning = true;
        }
        
        // Check for afternoon slot (time either contains PM or is after noon)
        if (
          // Check time as string
          (typeof slot.time === 'string' && 
            (slot.time.toLowerCase().includes('pm') || 
             (slot.time.includes(':') && parseInt(slot.time.split(':')[0], 10) >= 12))) ||
          // Check nested time object
          (slot.time && typeof slot.time === 'object' && slot.time.start && 
            parseInt(slot.time.start.split(':')[0], 10) >= 12) ||
          // Check direct start property
          (slot.start && parseInt(slot.start.split(':')[0], 10) >= 12)
        ) {
          hasAfternoon = true;
        }
      });
      
      // Add the date to our list if it has any availability
      if (hasMorning || hasAfternoon) {
        availableDates.push({
          date: dateStr,
          hasMorning,
          hasAfternoon,
          formattedDate: format(new Date(dateStr), 'EEEE, MMMM d, yyyy')
        });
      }
    });
    
    return availableDates;
  };

  // Handle dog selection
  const handleDogChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dogId = e.target.value;
    if (!dogId) {
      setSelectedDog(null);
      return;
    }
    
    const dog = userDogs.find(dog => dog.id === dogId);
    if (dog) {
      setSelectedDog(dog);
      // Reset other selections when dog changes
      setSelectedDate('');
      setTimeSlot('');
    }
  };

  // Handle date selection
  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dateStr = e.target.value;
    setSelectedDate(dateStr);
    setTimeSlot(''); // Reset time slot when date changes
    
    // Set minimum end date for recurring bookings
    if (isRecurring) {
      const minEndDate = format(addDays(new Date(dateStr), 7), 'yyyy-MM-dd');
      if (!endDate || isBefore(new Date(endDate), new Date(minEndDate))) {
        setEndDate(minEndDate);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validate inputs
    if (!selectedDog) {
      setError('Please select a dog');
      return;
    }
    
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    
    if (!timeSlot) {
      setError('Please select a time slot');
      return;
    }
    
    if (isRecurring && (!endDate || !frequency)) {
      setError('Please complete all recurring booking fields');
      return;
    }
    
    if (isRecurring && requiredCredits > remainingCredits) {
      setError(`You don't have enough walk credits (${requiredCredits} required, ${remainingCredits} available)`);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const bookingData = {
        dogId: selectedDog.id,
        date: selectedDate,
        timeSlot: timeSlot === 'morning' ? '8:00 AM' : '1:00 PM',
        notes,
        isRecurring,
        recurrenceFrequency: isRecurring ? frequency : null,
        recurrenceEndDate: isRecurring ? endDate : null
      };
      
      const response = await fetch('/api/walks/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book walk');
      }
      
      const data = await response.json();
      setSuccessMessage('Your walk has been booked successfully!');
      
      // Redirect after short delay - fix the redirect to go to main dashboard
      setTimeout(() => {
        router.push('/owner-dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error booking walk:', error);
      setError(error instanceof Error ? error.message : 'Failed to book your walk. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RouteGuard requiredPermission={{ action: 'create', resource: 'walks' }}>
      <div className="bg-white shadow rounded-lg p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Schedule a Dog Walk</h2>
          <Link
            href="/owner-dashboard"
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Information Alert */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Booking Information:</strong>
              </p>
              <ul className="list-disc ml-5 mt-1 text-sm text-blue-700">
                <li>All walks are 60 minutes in duration</li>
                <li>Walks must be booked at least 48 hours in advance</li>
                <li>Available time slots are based on your assigned walker's schedule</li>
                <li>Each walker can walk up to 6 dogs at once (AM/PM)</li>
                <li>Your dog must have completed an assessment to have an assigned walker</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Success message */}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select your dog */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Step 1: Select Your Dog</h3>
            
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-primary-600 rounded-full"></div>
                <span className="text-gray-500">Loading your dogs...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {userDogs.length === 0 ? (
                  <div className="p-4 bg-amber-50 rounded-md border border-amber-200">
                    <p className="text-amber-700 font-medium">You don't have any dogs registered yet.</p>
                    <Link 
                      href="/owner-dashboard/my-dogs"
                      className="mt-2 inline-block text-sm text-amber-600 hover:text-amber-800 underline"
                    >
                      Add a dog
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
                      {userDogs.map(dog => (
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
            )}
          </div>

          {/* Step 2: Select date */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Step 2: Select a Date</h3>
            
            {!selectedDog ? (
              <p className="text-sm text-gray-500">Please select a dog first</p>
            ) : isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-primary-600 rounded-full"></div>
                <span className="text-gray-500">Loading available dates...</span>
              </div>
            ) : (
              <>
                {availableDates.length === 0 ? (
                  <div className="p-4 bg-amber-50 rounded-md border border-amber-200">
                    <p className="text-amber-700">
                      No available dates found for the next 30 days. Your assigned walker may not have availability.
                    </p>
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
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Step 3: Select a Time</h3>
            
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
          <div className="border rounded-lg p-4">
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
                        onChange={(e) => setFrequency(e.target.value)}
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
          <div className="border rounded-lg p-4">
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
        </form>
      </div>
    </RouteGuard>
  );
} 