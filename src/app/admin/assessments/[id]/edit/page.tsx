'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import S3Image from '@/components/S3Image';
import RouteGuard from '@/components/RouteGuard';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { Assessment, Dog, Owner, Walker } from '@/lib/types';

export default function EditAssessmentPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const router = useRouter();
  const { assessments, dogs, owners, walkers, getDogById, getWalkerById, getOwnerById, updateAssessment } = useData();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [dog, setDog] = useState<Dog | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [status, setStatus] = useState<'pending' | 'scheduled' | 'completed' | 'cancelled'>('pending');
  const [assignedWalkerId, setAssignedWalkerId] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Define status options
  const statusOptions: { value: 'pending' | 'scheduled' | 'completed' | 'cancelled'; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];
  
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
        setStatus(foundAssessment.status);
        setAssignedWalkerId(foundAssessment.assignedWalkerId || '');
        setAdminNotes(foundAssessment.adminNotes || '');
        
        // Find the dog
        const foundDog = getDogById(foundAssessment.dogId);
        if (foundDog) setDog(foundDog);
        
        // Find the owner
        if (foundDog) {
          const foundOwner = getOwnerById(foundDog.ownerId);
          if (foundOwner) setOwner(foundOwner);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading assessment details:', err);
        setError('Failed to load assessment details');
        setLoading(false);
      }
    };
    
    loadData();
  }, [assessmentId, assessments, getDogById, getOwnerById]);
  
  const handleUpdateAssessment = async () => {
    if (!assessment) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const updatedAssessment = await updateAssessment(assessment.id, {
        status,
        assignedWalkerId: assignedWalkerId || undefined,
        adminNotes
      });
      
      setAssessment(updatedAssessment);
      setSuccess('Assessment updated successfully');
      
      // Redirect after successful update
      setTimeout(() => {
        router.push(`/admin/assessments/${assessment.id}`);
      }, 2000);
    } catch (err) {
      console.error('Error updating assessment:', err);
      setError('Failed to update assessment');
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Assessment</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update assessment details for {dog.name}
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
          {/* Assessment Information */}
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
              <h3 className="text-base font-medium text-gray-900 mb-3">Assessment Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Created:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(assessment.createdDate), 'PPP')}
                  </span>
                </div>
                
                {assessment.scheduledDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Scheduled For:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {format(new Date(assessment.scheduledDate), 'PPP p')}
                    </span>
                  </div>
                )}
                
                {assessment.assignedWalkerId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Walker:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {getWalkerById(assessment.assignedWalkerId)?.name || 'Unknown'}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Current Status:</span>
                  <span className={`text-sm font-medium ${
                    assessment.status === 'pending' ? 'text-yellow-600' : 
                    assessment.status === 'scheduled' ? 'text-blue-600' : 
                    assessment.status === 'completed' ? 'text-green-600' : 
                    'text-red-600'
                  }`}>
                    {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                  </span>
                </div>
              </div>
              
              {owner && (
                <>
                  <h3 className="text-base font-medium text-gray-900 mt-6 mb-3">Owner Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Name:</span>
                      <span className="text-sm font-medium text-gray-900">{owner.name}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Email:</span>
                      <span className="text-sm font-medium text-gray-900">{owner.email}</span>
                    </div>
                    
                    {owner.phone && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Phone:</span>
                        <span className="text-sm font-medium text-gray-900">{owner.phone}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Edit Form */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Edit Assessment</h2>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'pending' | 'scheduled' | 'completed' | 'cancelled')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {status !== 'pending' && status !== 'cancelled' && (
                  <div>
                    <label htmlFor="walkerId" className="block text-sm font-medium text-gray-700">
                      Assigned Walker
                    </label>
                    <select
                      id="walkerId"
                      name="walkerId"
                      value={assignedWalkerId}
                      onChange={(e) => setAssignedWalkerId(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      <option value="">-- Select a walker --</option>
                      {walkers.map(walker => (
                        <option key={walker.id} value={walker.id}>
                          {walker.name} - {walker.preferredDogSizes.join(', ')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700">
                    Admin Notes
                  </label>
                  <textarea
                    id="adminNotes"
                    name="adminNotes"
                    rows={5}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this assessment"
                    className="mt-1 block w-full border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  ></textarea>
                </div>
                
                <div className="flex space-x-3">
                  {status === 'pending' && (
                    <Link
                      href={`/admin/assessments/${assessment.id}/schedule`}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Schedule Assessment
                    </Link>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleUpdateAssessment}
                    disabled={submitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
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