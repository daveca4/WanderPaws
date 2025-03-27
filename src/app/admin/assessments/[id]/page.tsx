'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import S3Image from '@/components/S3Image';
import RouteGuard from '@/components/RouteGuard';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { Assessment, Dog, Walker, Owner, AssessmentFeedback } from '@/lib/types';

export default function AssessmentDetailPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const router = useRouter();
  const { assessments, dogs, walkers, owners, getDogById, getOwnerById, getWalkerById, updateAssessment } = useData();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [dog, setDog] = useState<Dog | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [assignedWalker, setAssignedWalker] = useState<Walker | null>(null);
  const [availableWalkers, setAvailableWalkers] = useState<Walker[]>([]);
  const [selectedWalkerId, setSelectedWalkerId] = useState<string>('');
  const [assessmentResult, setAssessmentResult] = useState<'approved' | 'denied' | ''>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [resultNotes, setResultNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
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
        
        // Find the owner
        const foundOwner = getOwnerById(foundAssessment.ownerId);
        if (foundOwner) setOwner(foundOwner);
        
        // Find the assigned walker if any
        if (foundAssessment.assignedWalkerId) {
          const foundWalker = getWalkerById(foundAssessment.assignedWalkerId);
          if (foundWalker) setAssignedWalker(foundWalker);
        }
        
        // Set the form initial values
        setSelectedWalkerId(foundAssessment.assignedWalkerId || '');
        setAssessmentResult(foundAssessment.result || '');
        setAdminNotes(foundAssessment.adminNotes || '');
        setResultNotes(foundAssessment.resultNotes || '');
        
        // Filter walkers who can handle this dog size
        const dogSizePreference = foundDog?.size || 'medium';
        const filteredWalkers = walkers.filter(walker => 
          walker.preferredDogSizes.includes(dogSizePreference)
        );
        setAvailableWalkers(filteredWalkers);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading assessment details:', err);
        setError('Failed to load assessment details');
        setLoading(false);
      }
    };
    
    loadData();
  }, [assessmentId, assessments, dogs, owners, walkers, getDogById, getOwnerById, getWalkerById]);
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handleAssignWalker = async () => {
    if (!assessment || !selectedWalkerId) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const updatedAssessment = await updateAssessment(assessment.id, {
        assignedWalkerId: selectedWalkerId,
        status: 'scheduled',
        adminNotes: adminNotes
      });
      
      setAssessment(updatedAssessment);
      setSuccess('Walker assigned successfully');
      
      // Update assigned walker
      if (selectedWalkerId) {
        const walker = getWalkerById(selectedWalkerId);
        if (walker) setAssignedWalker(walker);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error assigning walker:', err);
      setError('Failed to assign walker');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleUpdateStatus = async (newStatus: 'pending' | 'scheduled' | 'completed' | 'cancelled') => {
    if (!assessment) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const updates: Partial<Assessment> = {
        status: newStatus
      };
      
      // If completing the assessment, include the result
      if (newStatus === 'completed' && assessmentResult) {
        updates.result = assessmentResult;
        updates.resultNotes = resultNotes;
      }
      
      const updatedAssessment = await updateAssessment(assessment.id, updates);
      
      setAssessment(updatedAssessment);
      setSuccess(`Assessment status updated to ${newStatus}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating assessment status:', err);
      setError('Failed to update assessment status');
    } finally {
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
  
  const showAssignWalkerForm = assessment.status === 'pending' || !assessment.assignedWalkerId;
  const showCompleteAssessmentForm = assessment.status === 'scheduled' && assessment.assignedWalkerId;
  
  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessment Details</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage assessment for {dog.name}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/admin/assessments"
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Back to All Assessments
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
          {/* Assessment Overview */}
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
                    {dog.breed}, {dog.age} {dog.age === 1 ? 'year' : 'years'} old
                  </p>
                </div>
                <div className="ml-auto">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(assessment.status)}`}>
                    {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-3">Assessment Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Requested On:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {format(new Date(assessment.createdDate), 'PPP')}
                      </span>
                    </div>
                    
                    {assessment.scheduledDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          {assessment.status === 'scheduled' ? 'Scheduled For:' : 'Assessment Date:'}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {format(new Date(assessment.scheduledDate), 'PPP')}
                        </span>
                      </div>
                    )}
                    
                    {assessment.assignedWalkerId && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Walker Assigned:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {assignedWalker?.name || 'Unknown Walker'}
                        </span>
                      </div>
                    )}
                    
                    {assessment.status === 'completed' && assessment.result && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Result:</span>
                        <span className={`text-sm font-medium ${assessment.result === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                          {assessment.result === 'approved' ? 'Approved' : 'Not Approved'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-3">Dog & Owner Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Dog Size:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dog.size.charAt(0).toUpperCase() + dog.size.slice(1)}
                      </span>
                    </div>
                    
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
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Owner:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {owner?.name || 'Unknown Owner'}
                      </span>
                    </div>
                    
                    {owner && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Contact:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {owner.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {assessment.adminNotes && (
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">Admin Notes</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{assessment.adminNotes}</p>
                    </div>
                  </div>
                )}
                
                {assessment.resultNotes && (
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">Assessment Notes</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{assessment.resultNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Assessment Management */}
          <div className="space-y-6">
            {/* Status Management */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Manage Assessment</h2>
              </div>
              
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Current Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(assessment.status)}`}>
                      {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {assessment.status !== 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('pending')}
                        disabled={submitting}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                      >
                        Mark as Pending
                      </button>
                    )}
                    
                    {assessment.status !== 'scheduled' && assessment.assignedWalkerId && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('scheduled')}
                        disabled={submitting}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        Mark as Scheduled
                      </button>
                    )}
                    
                    {assessment.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('cancelled')}
                        disabled={submitting}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        Cancel Assessment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Assign Walker Form */}
            {showAssignWalkerForm && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Assign Walker</h2>
                </div>
                
                <div className="px-4 py-5 sm:p-6">
                  <div className="space-y-4">
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
                      >
                        <option value="">-- Select a walker --</option>
                        {availableWalkers.map(walker => (
                          <option key={walker.id} value={walker.id}>
                            {walker.name} - {walker.preferredDogSizes.join(', ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700">
                        Notes for Walker
                      </label>
                      <textarea
                        id="adminNotes"
                        name="adminNotes"
                        rows={3}
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add special instructions for the walker"
                        className="mt-1 block w-full border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      ></textarea>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAssignWalker}
                        disabled={submitting || !selectedWalkerId}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {submitting ? 'Assigning...' : 'Assign Walker'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Complete Assessment Form */}
            {showCompleteAssessmentForm && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Complete Assessment</h2>
                </div>
                
                <div className="px-4 py-5 sm:p-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="assessmentResult" className="block text-sm font-medium text-gray-700">
                        Assessment Result
                      </label>
                      <select
                        id="assessmentResult"
                        name="assessmentResult"
                        value={assessmentResult}
                        onChange={(e) => setAssessmentResult(e.target.value as 'approved' | 'denied' | '')}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      >
                        <option value="">-- Select result --</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Not Approved</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="resultNotes" className="block text-sm font-medium text-gray-700">
                        Assessment Notes
                      </label>
                      <textarea
                        id="resultNotes"
                        name="resultNotes"
                        rows={5}
                        value={resultNotes}
                        onChange={(e) => setResultNotes(e.target.value)}
                        placeholder="Add notes about the assessment results"
                        className="mt-1 block w-full border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      ></textarea>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('completed')}
                        disabled={submitting || !assessmentResult}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {submitting ? 'Completing...' : 'Complete Assessment'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Feedback Display Section */}
            {assessment.feedback && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Walker Feedback</h2>
                </div>
                
                <div className="px-4 py-5 sm:p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Behavior Ratings</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Socialization:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {assessment.feedback.behaviorRatings.socialization}/5
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Leash Manners:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {assessment.feedback.behaviorRatings.leashManners}/5
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Aggression (Lower is better):</span>
                            <span className="text-sm font-medium text-gray-900">
                              {assessment.feedback.behaviorRatings.aggression}/5
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Obedience:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {assessment.feedback.behaviorRatings.obedience}/5
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Energy Level:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {assessment.feedback.behaviorRatings.energyLevel}/5
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Assessment Summary</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Suitable for Group Walks:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {assessment.feedback.suitableForGroupWalks ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Walker Experience Level:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {assessment.feedback.recommendedWalkerExperience.charAt(0).toUpperCase() + 
                               assessment.feedback.recommendedWalkerExperience.slice(1)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Submitted On:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {format(new Date(assessment.feedback.submittedDate), 'PPP')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Strengths</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {assessment.feedback.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-gray-700">{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {assessment.feedback.concerns.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Concerns</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {assessment.feedback.concerns.map((concern, index) => (
                            <li key={index} className="text-sm text-gray-700">{concern}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Walker Notes</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-md">
                        {assessment.feedback.walkerNotes}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-md">
                        {assessment.feedback.recommendations}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 