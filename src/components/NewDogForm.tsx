'use client';

import { useState } from 'react';
import { Owner, Dog } from '@/lib/types';
import { generateId } from '@/utils/helpers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DogImageUploader from './DogImageUploader';
import { useData } from '@/lib/DataContext';

interface NewDogFormProps {
  owners: Owner[];
  initialData?: Partial<Dog>;
  isEditing?: boolean;
}

export default function NewDogForm({ owners, initialData, isEditing = false }: NewDogFormProps) {
  const router = useRouter();
  const { createDog, updateDog } = useData();
  
  const [formData, setFormData] = useState<Partial<Dog>>({
    name: initialData?.name || '',
    breed: initialData?.breed || '',
    age: initialData?.age || 0,
    size: initialData?.size || 'medium',
    temperament: initialData?.temperament || [],
    specialNeeds: initialData?.specialNeeds || [],
    ownerId: initialData?.ownerId || (owners.length > 0 ? owners[0].id : ''),
    imageUrl: initialData?.imageUrl || '',
    address: initialData?.address || {
      street: '',
      city: '',
      state: '',
      zip: ''
    },
  });
  
  const [temperamentInput, setTemperamentInput] = useState('');
  const [specialNeedsInput, setSpecialNeedsInput] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    [key: string]: string;
  }>({});
  
  const handleSubmit = async (e: React.FormEvent) => {
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
    setIsSubmitting(true);
    
    try {
      // Actually save the data using our API
      if (isEditing && initialData?.id) {
        await updateDog(initialData.id, formData);
      } else {
        await createDog(formData as Omit<Dog, 'id'>);
      }
      
      // Navigate back to dogs list
      router.push('/dogs');
    } catch (error) {
      console.error('Error saving dog:', error);
      setFormErrors({
        submit: error instanceof Error ? error.message : 'Failed to save dog'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties (e.g., address.street)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev?.[parent as keyof typeof prev] as object),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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
    
    // This method is no longer needed since we removed the walkingPreferences checkboxes
    // Keeping it for other checkbox uses in the future
    if (name === 'otherCheckboxes') {
      // Handle other checkboxes if needed
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
  
  // Handle image upload
  const handleImageUploaded = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl
    }));
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-6">
          <DogImageUploader 
            initialImageUrl={formData.imageUrl} 
            onImageUploaded={handleImageUploaded} 
          />
          
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
          
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
              <div className="sm:col-span-2">
                <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address.street"
                  id="address.street"
                  required
                  value={(formData.address as any)?.street || ''}
                  onChange={handleChange}
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
                {formErrors['address.street'] && (
                  <p className="mt-2 text-sm text-red-600">{formErrors['address.street']}</p>
                )}
              </div>

              <div>
                <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  name="address.city"
                  id="address.city"
                  required
                  value={(formData.address as any)?.city || ''}
                  onChange={handleChange}
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
                {formErrors['address.city'] && (
                  <p className="mt-2 text-sm text-red-600">{formErrors['address.city']}</p>
                )}
              </div>

              <div>
                <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
                  State / Province
                </label>
                <input
                  type="text"
                  name="address.state"
                  id="address.state"
                  required
                  value={(formData.address as any)?.state || ''}
                  onChange={handleChange}
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
                {formErrors['address.state'] && (
                  <p className="mt-2 text-sm text-red-600">{formErrors['address.state']}</p>
                )}
              </div>

              <div>
                <label htmlFor="address.zip" className="block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="address.zip"
                  id="address.zip"
                  required
                  value={(formData.address as any)?.zip || ''}
                  onChange={handleChange}
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
                {formErrors['address.zip'] && (
                  <p className="mt-2 text-sm text-red-600">{formErrors['address.zip']}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <Link
          href="/dogs"
          className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Dog' : 'Add Dog'}
        </button>
      </div>
      
      {formErrors.submit && (
        <p className="mt-2 text-sm text-red-600">{formErrors.submit}</p>
      )}
    </form>
  );
} 