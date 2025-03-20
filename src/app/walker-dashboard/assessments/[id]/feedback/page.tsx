'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { getAssessmentById, submitAssessmentFeedback, updateAssessment } from '@/lib/mockAssessments';
import { getDogById, getOwnerById } from '@/utils/helpers';
import { Assessment, AssessmentFeedback } from '@/lib/types';
import { formatDate } from '@/utils/helpers';

export default function SubmitFeedbackPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [formData, setFormData] = useState<Omit<AssessmentFeedback, 'id' | 'assessmentId' | 'submittedDate'>>({
    walkerId: '',
    behaviorRatings: {
      socialization: 3,
      leashManners: 3,
      aggression: 3,
      obedience: 3,
      energyLevel: 3
    },
    concerns: [],
    strengths: [],
    recommendations: '',
    suitableForGroupWalks: false,
    walkerNotes: '',
    recommendedWalkerExperience: 'intermediate'
  });
  const [newStrength, setNewStrength] = useState('');
  const [newConcern, setNewConcern] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const loadAssessment = () => {
      const foundAssessment = getAssessmentById(params.id);
      
      if (foundAssessment) {
        setAssessment(foundAssessment);
        
        // Pre-populate form with walker ID
        setFormData(prev => ({
          ...prev,
          walkerId: user.profileId || ''
        }));
        
        // If feedback already exists, pre-populate the form
        if (foundAssessment.feedback) {
          setFormData({
            walkerId: foundAssessment.feedback.walkerId,
            behaviorRatings: foundAssessment.feedback.behaviorRatings,
            concerns: foundAssessment.feedback.concerns,
            strengths: foundAssessment.feedback.strengths,
            recommendations: foundAssessment.feedback.recommendations,
            suitableForGroupWalks: foundAssessment.feedback.suitableForGroupWalks,
            walkerNotes: foundAssessment.feedback.walkerNotes,
            photosOrVideos: foundAssessment.feedback.photosOrVideos,
            recommendedWalkerExperience: foundAssessment.feedback.recommendedWalkerExperience
          });
        }
      }
      
      setLoading(false);
    };
    
    // Simulate API call
    setTimeout(loadAssessment, 500);
  }, [params.id, user]);

  const handleRatingChange = (category: keyof AssessmentFeedback['behaviorRatings'], value: 1 | 2 | 3 | 4 | 5) => {
    setFormData(prev => ({
      ...prev,
      behaviorRatings: {
        ...prev.behaviorRatings,
        [category]: value
      }
    }));
  };

  const handleAddStrength = () => {
    if (newStrength.trim() !== '') {
      setFormData(prev => ({
        ...prev,
        strengths: [...prev.strengths, newStrength.trim()]
      }));
      setNewStrength('');
    }
  };

  const handleRemoveStrength = (index: number) => {
    setFormData(prev => ({
      ...prev,
      strengths: prev.strengths.filter((_, i) => i !== index)
    }));
  };

  const handleAddConcern = () => {
    if (newConcern.trim() !== '') {
      setFormData(prev => ({
        ...prev,
        concerns: [...prev.concerns, newConcern.trim()]
      }));
      setNewConcern('');
    }
  };

  const handleRemoveConcern = (index: number) => {
    setFormData(prev => ({
      ...prev,
      concerns: prev.concerns.filter((_, i) => i !== index)
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assessment || !user) return;
    
    setSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      // Submit feedback
      const feedback = submitAssessmentFeedback(assessment.id, formData);
      
      if (feedback) {
        // Update assessment status to completed
        const updatedAssessment = updateAssessment(assessment.id, {
          status: 'completed',
          feedback
        });
        
        if (updatedAssessment) {
          // Navigate back to walker dashboard
          router.push('/walker-dashboard');
        } else {
          alert('An error occurred while updating the assessment.');
          setSubmitting(false);
        }
      } else {
        alert('An error occurred while submitting feedback.');
        setSubmitting(false);
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
          href="/walker-dashboard"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // If the walker is not assigned to this assessment, don't allow feedback
  if (assessment.assignedWalkerId !== user?.profileId) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Not Authorized</h2>
        <p className="text-gray-500 mb-4">You are not assigned to this assessment.</p>
        <Link
          href="/walker-dashboard"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // If assessment is not in 'scheduled' status, don't allow feedback
  if (assessment.status !== 'scheduled') {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Assessment Not Ready</h2>
        <p className="text-gray-500 mb-4">
          {assessment.status === 'pending' 
            ? 'This assessment is still pending and not yet scheduled.' 
            : assessment.status === 'completed'
              ? 'This assessment has already been completed.'
              : 'This assessment has been cancelled.'}
        </p>
        <Link
          href="/walker-dashboard"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const dog = getDogById(assessment.dogId);
  const owner = getOwnerById(assessment.ownerId);

  return (
    <RouteGuard requiredPermission={{ action: 'update', resource: 'walks' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Submit Assessment Feedback
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              For {dog?.name || 'Unknown Dog'} - Scheduled on {formatDate(assessment.scheduledDate)}
            </p>
          </div>
          <div>
            <Link
              href="/walker-dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Dog Information
            </h3>
          </div>
          
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
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
                        <p className="text-sm text-gray-500">Size: {dog.size}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-red-500">Dog not found</span>
                  )}
                </dd>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Notes from Admin</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {assessment.adminNotes || <span className="text-gray-400">No notes provided</span>}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Assessment Feedback
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Provide detailed feedback about the dog's behavior and temperament
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Behavior Ratings */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Behavior Ratings</h4>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Socialization Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Socialization with Other Dogs
                    </label>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Poor</span>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleRatingChange('socialization', value as 1 | 2 | 3 | 4 | 5)}
                          className={`h-8 w-8 mx-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                            formData.behaviorRatings.socialization >= value ? 'bg-primary-500' : 'bg-gray-200'
                          }`}
                          aria-label={`Rate ${value} out of 5`}
                        >
                          {value}
                        </button>
                      ))}
                      <span className="text-sm text-gray-500 ml-2">Excellent</span>
                    </div>
                  </div>
                  
                  {/* Leash Manners Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Leash Manners
                    </label>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Poor</span>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleRatingChange('leashManners', value as 1 | 2 | 3 | 4 | 5)}
                          className={`h-8 w-8 mx-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                            formData.behaviorRatings.leashManners >= value ? 'bg-primary-500' : 'bg-gray-200'
                          }`}
                          aria-label={`Rate ${value} out of 5`}
                        >
                          {value}
                        </button>
                      ))}
                      <span className="text-sm text-gray-500 ml-2">Excellent</span>
                    </div>
                  </div>
                  
                  {/* Aggression Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aggression Level (lower is better)
                    </label>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">None</span>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleRatingChange('aggression', value as 1 | 2 | 3 | 4 | 5)}
                          className={`h-8 w-8 mx-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                            formData.behaviorRatings.aggression >= value ? 'bg-red-500' : 'bg-gray-200'
                          }`}
                          aria-label={`Rate ${value} out of 5`}
                        >
                          {value}
                        </button>
                      ))}
                      <span className="text-sm text-gray-500 ml-2">High</span>
                    </div>
                  </div>
                  
                  {/* Obedience Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Obedience to Commands
                    </label>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Poor</span>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleRatingChange('obedience', value as 1 | 2 | 3 | 4 | 5)}
                          className={`h-8 w-8 mx-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                            formData.behaviorRatings.obedience >= value ? 'bg-primary-500' : 'bg-gray-200'
                          }`}
                          aria-label={`Rate ${value} out of 5`}
                        >
                          {value}
                        </button>
                      ))}
                      <span className="text-sm text-gray-500 ml-2">Excellent</span>
                    </div>
                  </div>
                  
                  {/* Energy Level Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Energy Level
                    </label>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Low</span>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleRatingChange('energyLevel', value as 1 | 2 | 3 | 4 | 5)}
                          className={`h-8 w-8 mx-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                            formData.behaviorRatings.energyLevel >= value ? 'bg-primary-500' : 'bg-gray-200'
                          }`}
                          aria-label={`Rate ${value} out of 5`}
                        >
                          {value}
                        </button>
                      ))}
                      <span className="text-sm text-gray-500 ml-2">High</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Strengths */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dog's Strengths
                </label>
                <div className="flex items-center mb-2">
                  <input
                    type="text"
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Add a strength (e.g., 'Good with children')"
                  />
                  <button
                    type="button"
                    onClick={handleAddStrength}
                    disabled={newStrength.trim() === ''}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                
                {formData.strengths.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {formData.strengths.map((strength, index) => (
                      <li 
                        key={index} 
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
                      >
                        <span className="text-sm">{strength}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStrength(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">No strengths added yet</p>
                )}
              </div>
              
              {/* Concerns */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concerns
                </label>
                <div className="flex items-center mb-2">
                  <input
                    type="text"
                    value={newConcern}
                    onChange={(e) => setNewConcern(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Add a concern (e.g., 'Pulls on leash')"
                  />
                  <button
                    type="button"
                    onClick={handleAddConcern}
                    disabled={newConcern.trim() === ''}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                
                {formData.concerns.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {formData.concerns.map((concern, index) => (
                      <li 
                        key={index} 
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
                      >
                        <span className="text-sm">{concern}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveConcern(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">No concerns added yet</p>
                )}
              </div>
              
              {/* Recommendations */}
              <div>
                <label htmlFor="recommendations" className="block text-sm font-medium text-gray-700">
                  Recommendations
                </label>
                <textarea
                  id="recommendations"
                  name="recommendations"
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Provide detailed recommendations about this dog..."
                  value={formData.recommendations}
                  onChange={handleChange}
                ></textarea>
              </div>
              
              {/* Walker Notes */}
              <div>
                <label htmlFor="walkerNotes" className="block text-sm font-medium text-gray-700">
                  Additional Notes
                </label>
                <textarea
                  id="walkerNotes"
                  name="walkerNotes"
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Any additional observations or notes..."
                  value={formData.walkerNotes}
                  onChange={handleChange}
                ></textarea>
              </div>
              
              {/* Group Walks Suitability */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="suitableForGroupWalks"
                    name="suitableForGroupWalks"
                    type="checkbox"
                    checked={formData.suitableForGroupWalks}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        suitableForGroupWalks: e.target.checked
                      }));
                    }}
                    className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="suitableForGroupWalks" className="font-medium text-gray-700">
                    Suitable for Group Walks
                  </label>
                  <p className="text-gray-500">
                    Check if this dog would be suitable for walking with other dogs
                  </p>
                </div>
              </div>
              
              {/* Recommended Walker Experience */}
              <div>
                <label htmlFor="recommendedWalkerExperience" className="block text-sm font-medium text-gray-700">
                  Recommended Walker Experience Level
                </label>
                <select
                  id="recommendedWalkerExperience"
                  name="recommendedWalkerExperience"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={formData.recommendedWalkerExperience}
                  onChange={handleChange}
                >
                  <option value="beginner">Beginner (Any walker)</option>
                  <option value="intermediate">Intermediate (Some experience required)</option>
                  <option value="expert">Expert (Significant experience needed)</option>
                </select>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <Link
                  href="/walker-dashboard"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  disabled={submitting || !formData.recommendations}
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 