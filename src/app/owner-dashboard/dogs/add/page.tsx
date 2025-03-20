'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { generateId } from '@/utils/helpers';

export default function AddDogPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: 1,
    size: 'medium' as 'small' | 'medium' | 'large',
    temperament: ['friendly'],
    specialNeeds: [] as string[],
    walkingPreferences: {
      frequency: 3,
      duration: 30,
      preferredTimes: ['morning']
    },
    newTemperament: '',
    newSpecialNeed: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties for walking preferences
    if (name.includes('walkingPreferences.')) {
      const preference = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        walkingPreferences: {
          ...prev.walkingPreferences,
          [preference]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePreferredTimeChange = (time: string) => {
    const currentTimes = formData.walkingPreferences.preferredTimes;
    const updatedTimes = currentTimes.includes(time)
      ? currentTimes.filter(t => t !== time)
      : [...currentTimes, time];
    
    setFormData(prev => ({
      ...prev,
      walkingPreferences: {
        ...prev.walkingPreferences,
        preferredTimes: updatedTimes
      }
    }));
  };

  const handleAddTemperament = () => {
    if (formData.newTemperament.trim() !== '') {
      setFormData(prev => ({
        ...prev,
        temperament: [...prev.temperament, prev.newTemperament.trim()],
        newTemperament: ''
      }));
    }
  };

  const handleRemoveTemperament = (index: number) => {
    setFormData(prev => ({
      ...prev,
      temperament: prev.temperament.filter((_, i) => i !== index)
    }));
  };

  const handleAddSpecialNeed = () => {
    if (formData.newSpecialNeed.trim() !== '') {
      setFormData(prev => ({
        ...prev,
        specialNeeds: [...prev.specialNeeds, prev.newSpecialNeed.trim()],
        newSpecialNeed: ''
      }));
    }
  };

  const handleRemoveSpecialNeed = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialNeeds: prev.specialNeeds.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    
    // In a real app, this would be an API call
    // For demo, simulate creating a dog
    setTimeout(() => {
      // Create a new dog ID
      const newDog = {
        id: generateId('dog'),
        name: formData.name,
        breed: formData.breed,
        age: Number(formData.age),
        size: formData.size,
        temperament: formData.temperament,
        specialNeeds: formData.specialNeeds,
        ownerId: user.profileId || '',
        walkingPreferences: {
          frequency: Number(formData.walkingPreferences.frequency),
          duration: Number(formData.walkingPreferences.duration),
          preferredTimes: formData.walkingPreferences.preferredTimes
        },
        // Set assessment status to pending to trigger assessment process
        assessmentStatus: 'pending'
      };
      
      // In a real app, save this to the database
      console.log('New dog created:', newDog);
      
      // Redirect to request assessment page
      router.push(`/owner-dashboard/dogs/assessment-request/${newDog.id}`);
    }, 1000);
  };

  return (
    <RouteGuard requiredPermission={{ action: 'create', resource: 'dogs' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Add a New Dog</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div>
              <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
              <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Dog's Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="breed" className="block text-sm font-medium text-gray-700">
                    Breed
                  </label>
                  <input
                    type="text"
                    id="breed"
                    name="breed"
                    required
                    value={formData.breed}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                    Age (years)
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    min="0"
                    step="1"
                    required
                    value={formData.age}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700">
                    Size
                  </label>
                  <select
                    id="size"
                    name="size"
                    required
                    value={formData.size}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Temperament */}
            <div>
              <h2 className="text-lg font-medium text-gray-900">Temperament</h2>
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    id="newTemperament"
                    name="newTemperament"
                    value={formData.newTemperament}
                    onChange={handleChange}
                    placeholder="E.g., friendly, energetic"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddTemperament}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.temperament.map((trait, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                    >
                      {trait}
                      <button
                        type="button"
                        onClick={() => handleRemoveTemperament(index)}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none"
                      >
                        <span className="sr-only">Remove {trait}</span>
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Special Needs */}
            <div>
              <h2 className="text-lg font-medium text-gray-900">Special Needs (Optional)</h2>
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    id="newSpecialNeed"
                    name="newSpecialNeed"
                    value={formData.newSpecialNeed}
                    onChange={handleChange}
                    placeholder="E.g., medication, dietary restrictions"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecialNeed}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.specialNeeds.map((need, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800"
                    >
                      {need}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialNeed(index)}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-red-400 hover:bg-red-200 hover:text-red-500 focus:outline-none"
                      >
                        <span className="sr-only">Remove {need}</span>
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Walking Preferences */}
            <div>
              <h2 className="text-lg font-medium text-gray-900">Walking Preferences</h2>
              <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <label htmlFor="walkingPreferences.frequency" className="block text-sm font-medium text-gray-700">
                    How many walks per week?
                  </label>
                  <input
                    type="number"
                    id="walkingPreferences.frequency"
                    name="walkingPreferences.frequency"
                    min="1"
                    max="7"
                    required
                    value={formData.walkingPreferences.frequency}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="walkingPreferences.duration" className="block text-sm font-medium text-gray-700">
                    Preferred walk duration (minutes)
                  </label>
                  <select
                    id="walkingPreferences.duration"
                    name="walkingPreferences.duration"
                    required
                    value={formData.walkingPreferences.duration}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Preferred walking times
                  </label>
                  <div className="mt-2 space-y-2">
                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="morning"
                          name="morning"
                          type="checkbox"
                          checked={formData.walkingPreferences.preferredTimes.includes('morning')}
                          onChange={() => handlePreferredTimeChange('morning')}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="morning" className="font-medium text-gray-700">
                          Morning (6am - 12pm)
                        </label>
                      </div>
                    </div>
                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="afternoon"
                          name="afternoon"
                          type="checkbox"
                          checked={formData.walkingPreferences.preferredTimes.includes('afternoon')}
                          onChange={() => handlePreferredTimeChange('afternoon')}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="afternoon" className="font-medium text-gray-700">
                          Afternoon (12pm - 5pm)
                        </label>
                      </div>
                    </div>
                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="evening"
                          name="evening"
                          type="checkbox"
                          checked={formData.walkingPreferences.preferredTimes.includes('evening')}
                          onChange={() => handlePreferredTimeChange('evening')}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="evening" className="font-medium text-gray-700">
                          Evening (5pm - 10pm)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <Link
                href="/owner-dashboard/dogs"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Dog'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </RouteGuard>
  );
} 