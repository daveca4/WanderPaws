'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, addDays, startOfDay, isWeekend } from 'date-fns';
import { Calendar } from '@/components/Calendar';
import S3Image from '@/components/S3Image';
import RouteGuard from '@/components/RouteGuard';
import { useData } from '@/lib/DataContext';
import { Assessment, Dog, Walker } from '@/lib/types';

export default function ScheduleAssessmentPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const router = useRouter();
  const { assessments, dogs, walkers, getDogById, getWalkerById, updateAssessment } = useData();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [dog, setDog] = useState<Dog | null>(null);
  const [availableWalkers, setAvailableWalkers] = useState<Walker[]>([]);
  const [filteredWalkers, setFilteredWalkers] = useState<Walker[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedWalkerId, setSelectedWalkerId] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Generate available times for scheduling
  const availableTimes = [
    '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00'
  ];
  
  // Generate available dates (next 14 days, excluding weekends)
  const generateAvailableDates = () => {
    const dates = [];
    let currentDate = startOfDay(new Date());
    
    for (let i = 0; i < 30; i++) {
      const nextDate = addDays(currentDate, i);
      
      // Include weekdays only
      if (!isWeekend(nextDate)) {
        dates.push(nextDate);
      }
      
      // Stop after collecting 14 weekdays
      if (dates.length >= 14) break;
    }
    
    return dates;
  };
  
  useEffect(() => {
    if (!assessmentId) return;
    
    const loadData = async () => {
      try {
        // Find the assessment
        const foundAssessment = assessments.find(a => a.id === assessmentId);
        
        if (!foundAssessment) {
          setError('Assessment not found');
          setLoading(false);
          return;
        }
        
        setAssessment(foundAssessment);
        
        // Find the dog
        const foundDog = getDogById(foundAssessment.dogId);
        if (foundDog) setDog(foundDog);
        
        // Set initial form values (if available)
        if (foundAssessment.scheduledDate) {
          setSelectedDate(new Date(foundAssessment.scheduledDate));
          setSelectedTime(format(new Date(foundAssessment.scheduledDate), 'HH:mm'));
        }
        
        setSelectedWalkerId(foundAssessment.assignedWalkerId || '');
        setAdminNotes(foundAssessment.adminNotes || '');
        
        // Filter walkers who can handle this dog size
        const dogSizePreference = foundDog?.size || 'medium';
        const suitableWalkers = walkers.filter(walker => 
          walker.preferredDogSizes.includes(dogSizePreference)
        );
        setAvailableWalkers(suitableWalkers);
        setFilteredWalkers(suitableWalkers);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading assessment details:', err);
        setError('Failed to load assessment details');
        setLoading(false);
      }
    };
    
    loadData();
  }, [assessmentId, assessments, dogs, walkers, getDogById, getWalkerById]);
  
  // Filter available walkers based on selected date and time
  useEffect(() => {
    if (!selectedDate || !selectedTime) {
      setFilteredWalkers(availableWalkers);
      return;
    }
    
    // In a real application, this would check walker availability
    // For now, we'll just randomly filter some walkers to simulate availability
    const filteredList = availableWalkers.filter(() => Math.random() > 0.3);
    setFilteredWalkers(filteredList);
  }, [selectedDate, selectedTime, availableWalkers]);
  
  const handleScheduleAssessment = async () => {
    if (!assessment || !selectedDate || !selectedTime || !selectedWalkerId) {
      setError('Please select date, time, and walker');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Combine date and time for scheduled date
      const scheduledDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
      
      const updatedAssessment = await updateAssessment(assessment.id, {
        scheduledDate: scheduledDateTime.toISOString(),
        assignedWalkerId: selectedWalkerId,
        status: 'scheduled',
        adminNotes: adminNotes
      });
      
      setAssessment(updatedAssessment);
      setSuccess('Assessment scheduled successfully');
      
      // Redirect to assessment details page after successful scheduling
      setTimeout(() => {
        router.push(`/admin/assessments/${assessment.id}`);
      }, 2000);
    } catch (err) {
      console.error('Error scheduling assessment:', err);
      setError('Failed to schedule assessment');
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (error && !assessment) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Error</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <Link
          href="/admin/assessments"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Return to Assessments
        </Link>
      </div>
    );
  }
  
  if (!assessment || !dog) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Assessment Not Found</h2>
        <p className="text-gray-500 mb-4">The requested assessment could not be found.</p>
        <Link
          href="/admin/assessments"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Return to Assessments
        </Link>
      </div>
    );
  }
  
  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule Assessment</h1>
            <p className="mt-1 text-sm text-gray-500">
              Schedule an assessment for {dog.name}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href={`/admin/assessments/${assessment.id}`}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Back to Assessment Details
            </Link>
          </div>
        </div>
        
        {/* Success Alert */}
        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Alert */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Dog Information */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-16 w-16 relative rounded-full overflow-hidden">
                  {dog.imageUrl ? (
                    <S3Image
                      src={dog.imageUrl}
                      alt={dog.name}
                      fill
                      className="object-cover"
                      defaultImage="/images/default-dog.png"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-2xl text-primary-600">
                        {dog.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-gray-900">{dog.name}</h2>
                  <p className="text-sm text-gray-500">
                    {dog.breed}, {dog.age} {dog.age === 1 ? 'year' : 'years'} old • {dog.size} size
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-medium text-gray-900 mb-3">Dog Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Temperament:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {dog.temperament ? dog.temperament.join(', ') : 'Not specified'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Special Needs:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {dog.specialNeeds && dog.specialNeeds.length > 0 
                      ? dog.specialNeeds.join(', ') 
                      : 'None'}
                  </span>
                </div>
              </div>
              
              <h3 className="text-base font-medium text-gray-900 mt-6 mb-3">Assessment Status</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${assessment.status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {assessment.status === 'pending' ? 'Pending Scheduling' : 'Assessment Scheduled'}
                  </span>
                </div>
                
                {assessment.scheduledDate && (
                  <div className="mt-2 text-sm text-gray-700">
                    Currently scheduled for: {format(new Date(assessment.scheduledDate), 'PPP p')}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Scheduling Form */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Schedule Assessment</h2>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Select Date
                  </label>
                  <div className="mt-1">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => {
                        // Disable dates in the past, weekends, or more than 14 days in the future
                        const today = startOfDay(new Date());
                        const twoWeeksLater = addDays(today, 14);
                        return (
                          date < today || 
                          isWeekend(date) || 
                          date > twoWeeksLater
                        );
                      }}
                      className="rounded-md border"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="assessmentTime" className="block text-sm font-medium text-gray-700">
                    Select Time
                  </label>
                  <select
                    id="assessmentTime"
                    name="assessmentTime"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    disabled={!selectedDate}
                  >
                    <option value="">-- Select a time --</option>
                    {availableTimes.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="walkerId" className="block text-sm font-medium text-gray-700">
                    Select Walker
                  </label>
                  <select
                    id="walkerId"
                    name="walkerId"
                    value={selectedWalkerId}
                    onChange={(e) => setSelectedWalkerId(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    disabled={!selectedDate || !selectedTime}
                  >
                    <option value="">-- Select a walker --</option>
                    {filteredWalkers.map(walker => (
                      <option key={walker.id} value={walker.id}>
                        {walker.name} - {walker.preferredDogSizes.join(', ')}
                      </option>
                    ))}
                  </select>
                  {selectedDate && selectedTime && filteredWalkers.length === 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      No walkers available at this time. Please select another date or time.
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700">
                    Notes for Walker (Optional)
                  </label>
                  <textarea
                    id="adminNotes"
                    name="adminNotes"
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add special instructions or information for the walker"
                    className="mt-1 block w-full border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  ></textarea>
                </div>
                
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleScheduleAssessment}
                    disabled={submitting || !selectedDate || !selectedTime || !selectedWalkerId}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {submitting ? 'Scheduling...' : 'Schedule Assessment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 