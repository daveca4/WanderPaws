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
    age: '',
    size: 'medium' as 'small' | 'medium' | 'large',
    temperament: [] as string[],
    specialNeeds: [] as string[],
    imageUrl: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    },
    newTemperament: '',
    newSpecialNeed: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties for address
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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

  const ensureOwnerProfile = async () => {
    if (!user) return null;
    
    try {
      // Call the API to ensure owner profile exists
      const response = await fetch('/api/data/owners/ensure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          name: user.name || 'Dog Owner',
          email: user.email,
          phone: ''
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to ensure owner profile');
      }
      
      const ownerData = await response.json();
      return ownerData.id; // Return the owner ID
    } catch (error) {
      console.error('Error ensuring owner profile:', error);
      return null;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    
    try {
      // First ensure the owner profile exists
      const ownerId = user.profileId || await ensureOwnerProfile();
      
      if (!ownerId) {
        throw new Error("Could not find or create owner profile");
      }
      
      const dogData = {
        name: formData.name,
        breed: formData.breed,
        age: Number(formData.age),
        size: formData.size,
        temperament: formData.temperament,
        specialNeeds: formData.specialNeeds,
        ownerId: ownerId,
        address: formData.address,
        assessmentStatus: 'pending'
      };
      
      console.log('Submitting new dog:', dogData);
      
      // Call the API to save the dog
      const response = await fetch('/api/data/dogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dogData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create dog');
      }
      
      const newDog = await response.json();
      console.log('New dog created:', newDog);
      
      // Redirect to assessment request page
      router.push(`/owner-dashboard/dogs/assessment-request/${newDog.id}`);
    } catch (error) {
      console.error('Error saving dog:', error);
      alert(`Failed to save dog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
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

            {/* Address Section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900">Address Information</h2>
              <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div className="sm:col-span-2">
                  <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="address.street"
                    name="address.street"
                    required
                    value={formData.address.street}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    id="address.city"
                    name="address.city"
                    required
                    value={formData.address.city}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
                    State / Province
                  </label>
                  <input
                    type="text"
                    id="address.state"
                    name="address.state"
                    required
                    value={formData.address.state}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="address.zip" className="block text-sm font-medium text-gray-700">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="address.zip"
                    name="address.zip"
                    required
                    value={formData.address.zip}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
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