'use client';

import { useState } from 'react';
import { Owner, Dog } from '@/lib/types';
import { generateId } from '@/utils/helpers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface NewDogFormProps {
  owners: Owner[];
  initialData?: Partial<Dog>;
  isEditing?: boolean;
}

export default function NewDogForm({ owners, initialData, isEditing = false }: NewDogFormProps) {
  const router = useRouter();
  
  const [formData, setFormData] = useState<Partial<Dog>>({
    name: initialData?.name || '',
    breed: initialData?.breed || '',
    age: initialData?.age || 0,
    size: initialData?.size || 'medium',
    temperament: initialData?.temperament || [],
    specialNeeds: initialData?.specialNeeds || [],
    ownerId: initialData?.ownerId || (owners.length > 0 ? owners[0].id : ''),
    imageUrl: initialData?.imageUrl || '',
    walkingPreferences: {
      frequency: initialData?.walkingPreferences?.frequency || 3,
      duration: initialData?.walkingPreferences?.duration || 30,
      preferredTimes: initialData?.walkingPreferences?.preferredTimes || ['morning'],
      preferredRoutes: initialData?.walkingPreferences?.preferredRoutes || [],
    },
  });
  
  const [temperamentInput, setTemperamentInput] = useState('');
  const [specialNeedsInput, setSpecialNeedsInput] = useState('');
  
  const [formErrors, setFormErrors] = useState<{
    [key: string]: string;
  }>({});
  
  // This is a mock implementation. In a real app, we would save to a database.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const errors: { [key: string]: string } = {};
    
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.breed) errors.breed = 'Breed is required';
    if (!formData.ownerId) errors.ownerId = 'Owner is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Clear any previous errors
    setFormErrors({});
    
    // In a real app, this would send data to an API
    // For now, we'll just simulate success and navigate back
    
    console.log('Submitting dog data:', {
      ...formData,
      id: isEditing ? initialData?.id : generateId('dog'),
    });
    
    // Fake a small delay to simulate API call
    setTimeout(() => {
      // Navigate back to dogs list
      router.push('/dogs');
    }, 500);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (e.g., walkingPreferences.frequency)
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...(formData[parent as keyof typeof formData] as any),
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (e.g., walkingPreferences.frequency)
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...(formData[parent as keyof typeof formData] as any),
          [child]: parseInt(value) || 0,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0,
      });
    }
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    
    // This handles the preferredTimes checkbox array
    if (name === 'preferredTimes') {
      const currentTimes = [...(formData.walkingPreferences?.preferredTimes || [])];
      
      if (checked) {
        // Add to array if checked
        currentTimes.push(value);
      } else {
        // Remove from array if unchecked
        const index = currentTimes.indexOf(value);
        if (index > -1) {
          currentTimes.splice(index, 1);
        }
      }
      
      setFormData({
        ...formData,
        walkingPreferences: {
          ...formData.walkingPreferences!,
          preferredTimes: currentTimes,
        },
      });
    }
  };
  
  const addTemperament = () => {
    if (temperamentInput.trim()) {
      setFormData({
        ...formData,
        temperament: [...(formData.temperament || []), temperamentInput.trim()],
      });
      setTemperamentInput('');
    }
  };
  
  const removeTemperament = (index: number) => {
    const newTemperament = [...(formData.temperament || [])];
    newTemperament.splice(index, 1);
    setFormData({
      ...formData,
      temperament: newTemperament,
    });
  };
  
  const addSpecialNeed = () => {
    if (specialNeedsInput.trim()) {
      setFormData({
        ...formData,
        specialNeeds: [...(formData.specialNeeds || []), specialNeedsInput.trim()],
      });
      setSpecialNeedsInput('');
    }
  };
  
  const removeSpecialNeed = (index: number) => {
    const newSpecialNeeds = [...(formData.specialNeeds || [])];
    newSpecialNeeds.splice(index, 1);
    setFormData({
      ...formData,
      specialNeeds: newSpecialNeeds,
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                formErrors.name ? 'border-red-300' : ''
              }`}
            />
            {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
          </div>
          
          <div>
            <label htmlFor="breed" className="block text-sm font-medium text-gray-700">
              Breed *
            </label>
            <input
              type="text"
              name="breed"
              id="breed"
              value={formData.breed}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                formErrors.breed ? 'border-red-300' : ''
              }`}
            />
            {formErrors.breed && <p className="mt-1 text-sm text-red-600">{formErrors.breed}</p>}
          </div>
          
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700">
              Age (years)
            </label>
            <input
              type="number"
              name="age"
              id="age"
              min="0"
              value={formData.age}
              onChange={handleNumberChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="size" className="block text-sm font-medium text-gray-700">
              Size
            </label>
            <select
              name="size"
              id="size"
              value={formData.size}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">
              Owner *
            </label>
            <select
              name="ownerId"
              id="ownerId"
              value={formData.ownerId}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                formErrors.ownerId ? 'border-red-300' : ''
              }`}
            >
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
            {formErrors.ownerId && <p className="mt-1 text-sm text-red-600">{formErrors.ownerId}</p>}
          </div>
          
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
              Image URL
            </label>
            <input
              type="text"
              name="imageUrl"
              id="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/dog-image.jpg"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Optional: Link to a photo of the dog</p>
          </div>
        </div>
        
        {/* Additional Details */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Temperament</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                value={temperamentInput}
                onChange={(e) => setTemperamentInput(e.target.value)}
                className="flex-1 rounded-none rounded-l-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="e.g., friendly, energetic"
              />
              <button
                type="button"
                onClick={addTemperament}
                className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 hover:bg-gray-100"
              >
                Add
              </button>
            </div>
            
            {formData.temperament && formData.temperament.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.temperament.map((trait, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {trait}
                    <button
                      type="button"
                      onClick={() => removeTemperament(index)}
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 hover:bg-blue-300 text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Special Needs</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                value={specialNeedsInput}
                onChange={(e) => setSpecialNeedsInput(e.target.value)}
                className="flex-1 rounded-none rounded-l-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="e.g., medication, mobility issues"
              />
              <button
                type="button"
                onClick={addSpecialNeed}
                className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 hover:bg-gray-100"
              >
                Add
              </button>
            </div>
            
            {formData.specialNeeds && formData.specialNeeds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.specialNeeds.map((need, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                  >
                    {need}
                    <button
                      type="button"
                      onClick={() => removeSpecialNeed(index)}
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Walking Preferences</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="walkingPreferences.frequency" className="block text-sm font-medium text-gray-700">
                  Frequency (walks per week)
                </label>
                <input
                  type="number"
                  name="walkingPreferences.frequency"
                  id="walkingPreferences.frequency"
                  min="1"
                  max="14"
                  value={formData.walkingPreferences?.frequency}
                  onChange={handleNumberChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="walkingPreferences.duration" className="block text-sm font-medium text-gray-700">
                  Duration (minutes per walk)
                </label>
                <input
                  type="number"
                  name="walkingPreferences.duration"
                  id="walkingPreferences.duration"
                  min="5"
                  max="120"
                  step="5"
                  value={formData.walkingPreferences?.duration}
                  onChange={handleNumberChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Times</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="morning"
                    name="preferredTimes"
                    type="checkbox"
                    value="morning"
                    checked={formData.walkingPreferences?.preferredTimes?.includes('morning')}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="morning" className="ml-2 block text-sm text-gray-700">
                    Morning
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="afternoon"
                    name="preferredTimes"
                    type="checkbox"
                    value="afternoon"
                    checked={formData.walkingPreferences?.preferredTimes?.includes('afternoon')}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="afternoon" className="ml-2 block text-sm text-gray-700">
                    Afternoon
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="evening"
                    name="preferredTimes"
                    type="checkbox"
                    value="evening"
                    checked={formData.walkingPreferences?.preferredTimes?.includes('evening')}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="evening" className="ml-2 block text-sm text-gray-700">
                    Evening
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
        <Link
          href="/dogs"
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
        >
          {isEditing ? 'Update Dog' : 'Add Dog'}
        </button>
      </div>
    </form>
  );
} 