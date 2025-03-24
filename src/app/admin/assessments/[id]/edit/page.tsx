'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import RouteGuard from '@/components/RouteGuard';
// Removed mock data import
// Removed mock data import
import { getDogById, getWalkerById, getOwnerById } from '@/utils/helpers';
import { Assessment, Walker } from '@/lib/types';
import { formatDate } from '@/utils/helpers';

export default function EditAssessmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [formData, setFormData] = useState({
    assignedWalkerId: '',
    scheduledDate: '',
    adminNotes: '',
    status: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = () => {
      // Get assessment data
      const foundAssessment = getAssessmentById(params.id);
      if (foundAssessment) {
        setAssessment(foundAssessment);
        setFormData({
          assignedWalkerId: foundAssessment.assignedWalkerId || '',
          scheduledDate: foundAssessment.scheduledDate.substring(0, 10), // extract YYYY-MM-DD
          adminNotes: foundAssessment.adminNotes || '',
          status: foundAssessment.status
        });
      }
      
      // Get available walkers
      setWalkers(mockWalkers);
      
      setLoading(false);
    };
    
    // Simulate API call
    setTimeout(loadData, 500);
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assessment) return;
    
    setSaving(true);
    
    // Format date for API
    const formattedDate = new Date(formData.scheduledDate);
    formattedDate.setHours(12, 0, 0, 0); // Default to noon
    
    // Prepare updates
    const updates: Partial<Assessment> = {
      assignedWalkerId: formData.assignedWalkerId || undefined,
      scheduledDate: formattedDate.toISOString(),
      adminNotes: formData.adminNotes,
      status: formData.status as 'pending' | 'scheduled' | 'completed' | 'cancelled'
    };
    
    // Simulate API call
    setTimeout(() => {
      const updatedAssessment = updateAssessment(assessment.id, updates);
      
      if (updatedAssessment) {
        // Navigate back to the assessment detail page
        router.push(`/admin/assessments/${assessment.id}`);
      } else {
        alert('An error occurred while updating the assessment.');
        setSaving(false);
      }
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Assessment Not Found</h2>
        <p className="text-gray-500 mb-4">The assessment you're looking for doesn't exist or has been removed.</p>
        <Link
          href="/admin/assessments"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Back to Assessments
        </Link>
      </div>
    );
  }

  const dog = getDogById(assessment.dogId);
  const owner = getOwnerById(assessment.ownerId);

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Assessment for {dog?.name || 'Unknown Dog'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Created on {formatDate(assessment.createdDate)}
            </p>
          </div>
          <div>
            <Link
              href={`/admin/assessments/${assessment.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Assessment Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Update assessment details and assign a walker
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Status Selection */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={assessment.status === 'completed'}
                >
                  <option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              {/* Walker Assignment */}
              <div>
                <label htmlFor="assignedWalkerId" className="block text-sm font-medium text-gray-700">
                  Assign Walker
                </label>
                <select
                  id="assignedWalkerId"
                  name="assignedWalkerId"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={formData.assignedWalkerId}
                  onChange={handleChange}
                  disabled={assessment.status === 'completed'}
                >
                  <option value="">-- Select a Walker --</option>
                  {walkers.map(walker => (
                    <option key={walker.id} value={walker.id}>
                      {walker.name} (Rating: {walker.rating}/5)
                    </option>
                  ))}
                </select>
                {formData.status === 'scheduled' && !formData.assignedWalkerId && (
                  <p className="mt-2 text-sm text-red-600">
                    A walker must be assigned when status is set to Scheduled
                  </p>
                )}
              </div>
              
              {/* Scheduled Date */}
              <div>
                <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  id="scheduledDate"
                  name="scheduledDate"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  disabled={assessment.status === 'completed'}
                />
              </div>
              
              {/* Admin Notes */}
              <div>
                <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700">
                  Notes for Walker
                </label>
                <textarea
                  id="adminNotes"
                  name="adminNotes"
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Add detailed instructions for the walker conducting this assessment..."
                  value={formData.adminNotes}
                  onChange={handleChange}
                  disabled={assessment.status === 'completed'}
                ></textarea>
              </div>
              
              {/* Dog and Owner Information (read-only) */}
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Dog</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {dog ? (
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        {dog.imageUrl ? (
                          <Image
                            src={dog.imageUrl}
                            alt={dog.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{dog.name}</p>
                        <p className="text-sm text-gray-500">{dog.breed}, {dog.age} years old</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-red-500">Dog not found</span>
                  )}
                </dd>
                
                <dt className="text-sm font-medium text-gray-500 mt-4">Owner</dt>
                <dd className="mt-4 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {owner ? (
                    <p>{owner.name}</p>
                  ) : (
                    <span className="text-red-500">Owner not found</span>
                  )}
                </dd>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <Link
                  href={`/admin/assessments/${assessment.id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  disabled={saving || assessment.status === 'completed' || (formData.status === 'scheduled' && !formData.assignedWalkerId)}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 