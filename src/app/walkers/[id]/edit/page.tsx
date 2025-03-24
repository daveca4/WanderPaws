'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
// Removed mock data import
import { Walker, TimeSlot } from '@/lib/types';

export default function EditWalker() {
  const router = useRouter();
  const params = useParams();
  const walkerId = params.id as string;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [walker, setWalker] = useState<Walker | null>(null);
  
  // Form state with default empty values
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    specialties: [] as string[],
    preferredDogSizes: [] as ('small' | 'medium' | 'large')[],
    certificationsOrTraining: [] as string[],
    imageUrl: '',
    availability: {
      monday: [] as TimeSlot[],
      tuesday: [] as TimeSlot[],
      wednesday: [] as TimeSlot[],
      thursday: [] as TimeSlot[],
      friday: [] as TimeSlot[],
      saturday: [] as TimeSlot[],
      sunday: [] as TimeSlot[],
    },
  });

  const dogSizes = ['small', 'medium', 'large'];
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const specialtyOptions = [
    'Puppy Training',
    'Senior Dogs',
    'High Energy Dogs',
    'Behavior Management',
    'Special Needs',
    'Group Walks',
    'Overnight Care',
    'First Aid Certified',
    'Medical Administration',
    'Behavioral Specialist',
  ];

  // Fetch walker data
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/auth/login');
      return;
    }

    // In a real app, this would be an API call
    const foundWalker = mockWalkers.find(w => w.id === walkerId);
    
    if (foundWalker) {
      setWalker(foundWalker);
      setFormData({
        name: foundWalker.name,
        email: foundWalker.email,
        phone: foundWalker.phone,
        bio: foundWalker.bio,
        specialties: foundWalker.specialties,
        preferredDogSizes: foundWalker.preferredDogSizes,
        certificationsOrTraining: foundWalker.certificationsOrTraining,
        imageUrl: foundWalker.imageUrl || '',
        availability: foundWalker.availability,
      });
    }
    
    setLoading(false);
  }, [walkerId, user, router]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes (for availability)
  const handleDogSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const sizeValue = value as 'small' | 'medium' | 'large';
    
    setFormData(prev => ({
      ...prev,
      preferredDogSizes: checked
        ? [...prev.preferredDogSizes, sizeValue]
        : prev.preferredDogSizes.filter(size => size !== sizeValue)
    }));
  };

  // Handle specialty changes
  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      specialties: checked
        ? [...prev.specialties, value]
        : prev.specialties.filter(s => s !== value)
    }));
  };

  // Handle time slot changes for a specific day and period (AM/PM)
  const handleTimeSlotChange = (day: string, period: 'AM' | 'PM', checked: boolean) => {
    setFormData(prev => {
      const dayKey = day as keyof typeof prev.availability;
      const currentSlots = [...prev.availability[dayKey]];
      
      // Define time ranges for AM and PM
      const amSlot = { start: '08:00', end: '11:00' };
      const pmSlot = { start: '13:00', end: '16:00' };
      
      if (checked) {
        // Add the slot if it doesn't exist
        if (period === 'AM' && !currentSlots.some(slot => slot.start === '08:00')) {
          return {
            ...prev,
            availability: {
              ...prev.availability,
              [dayKey]: [...currentSlots, amSlot]
            }
          };
        } else if (period === 'PM' && !currentSlots.some(slot => slot.start === '13:00')) {
          return {
            ...prev,
            availability: {
              ...prev.availability,
              [dayKey]: [...currentSlots, pmSlot]
            }
          };
        }
      } else {
        // Remove the slot
        return {
          ...prev,
          availability: {
            ...prev.availability,
            [dayKey]: currentSlots.filter(slot => 
              period === 'AM' ? slot.start !== '08:00' : slot.start !== '13:00'
            )
          }
        };
      }
      
      return prev; // No changes if slot already exists or doesn't exist
    });
  };

  // Check if a specific time slot exists
  const hasTimeSlot = (day: string, period: 'AM' | 'PM'): boolean => {
    const slots = formData.availability[day as keyof typeof formData.availability];
    return period === 'AM' 
      ? slots.some(slot => slot.start === '08:00') 
      : slots.some(slot => slot.start === '13:00');
  };

  // Handle certification input
  const [newCert, setNewCert] = useState('');
  
  const handleAddCertification = () => {
    if (newCert.trim()) {
      setFormData(prev => ({
        ...prev,
        certificationsOrTraining: [...prev.certificationsOrTraining, newCert.trim()]
      }));
      setNewCert('');
    }
  };

  const handleRemoveCertification = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certificationsOrTraining: prev.certificationsOrTraining.filter(c => c !== cert)
    }));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // In a real app, you'd make an API call here
      // For this demo, we'll simulate a delay and redirect
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate successful update
      console.log('Updated walker data:', { id: walkerId, ...formData });
      
      router.push(`/walkers/${walkerId}`);
    } catch (error) {
      console.error('Error updating walker:', error);
      setFormError('Failed to update walker. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!walker) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Walker not found</p>
              <div className="mt-2">
                <Link href="/walkers" className="text-sm font-medium text-yellow-700 underline hover:text-yellow-600">
                  Return to walkers list
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href={`/walkers/${walkerId}`} className="mr-4 text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Walker</h1>
      </div>

      {formError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            {formData.imageUrl && (
              <div className="flex justify-center mb-4">
                <div className="relative h-32 w-32 rounded-full overflow-hidden">
                  <Image 
                    src={formData.imageUrl} 
                    alt={formData.name}
                    className="object-cover"
                    fill
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Image URL
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formData.imageUrl}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formData.bio}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="mb-6 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Specialties & Skills</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {specialtyOptions.map((specialty) => (
                <div key={specialty} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`specialty-${specialty}`}
                    name={`specialty-${specialty}`}
                    value={specialty}
                    checked={formData.specialties.includes(specialty)}
                    onChange={handleSpecialtyChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`specialty-${specialty}`} className="ml-2 block text-sm text-gray-700">
                    {specialty}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferred Dog Sizes</h2>
            <div className="flex flex-wrap gap-6">
              {dogSizes.map((size) => (
                <div key={size} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`size-${size}`}
                    name={`size-${size}`}
                    value={size}
                    checked={formData.preferredDogSizes.includes(size as 'small' | 'medium' | 'large')}
                    onChange={handleDogSizeChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`size-${size}`} className="ml-2 block text-sm text-gray-700 capitalize">
                    {size}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Certifications & Training</h2>
            <div>
              <div className="flex">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={newCert}
                  onChange={(e) => setNewCert(e.target.value)}
                  placeholder="Add a certification or training"
                />
                <button
                  type="button"
                  onClick={handleAddCertification}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.certificationsOrTraining.map((cert, index) => (
                  <div 
                    key={index} 
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {cert}
                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(cert)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Availability</h2>
            <div className="grid grid-cols-1 gap-4">
              {daysOfWeek.map((day) => (
                <div key={day} className="border rounded-md p-4">
                  <h3 className="text-md font-medium text-gray-900 capitalize mb-3">{day}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${day}-am`}
                        checked={hasTimeSlot(day, 'AM')}
                        onChange={(e) => handleTimeSlotChange(day, 'AM', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`${day}-am`} className="ml-2 block text-sm text-gray-700">
                        Morning (8:00 AM - 11:00 AM)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${day}-pm`}
                        checked={hasTimeSlot(day, 'PM')}
                        onChange={(e) => handleTimeSlotChange(day, 'PM', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`${day}-pm`} className="ml-2 block text-sm text-gray-700">
                        Afternoon (1:00 PM - 4:00 PM)
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
            <Link 
              href={`/walkers/${walkerId}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 