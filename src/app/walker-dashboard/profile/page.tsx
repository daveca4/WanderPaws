'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { getWalkerById } from '@/utils/helpers';
import { Walker, TimeSlot } from '@/lib/types';

interface AvailabilityEditProps {
  availability: Walker['availability'];
  onSave: (newAvailability: Walker['availability']) => void;
  onCancel: () => void;
}

function EditAvailability({ availability, onSave, onCancel }: AvailabilityEditProps) {
  const [editedAvailability, setEditedAvailability] = useState<Walker['availability']>({...availability});
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const addTimeSlot = (day: string) => {
    const dayKey = day as keyof typeof editedAvailability;
    const newSlot: TimeSlot = { start: '09:00', end: '17:00' };
    
    setEditedAvailability({
      ...editedAvailability,
      [dayKey]: [...(editedAvailability[dayKey] || []), newSlot]
    });
  };

  const removeTimeSlot = (day: string, index: number) => {
    const dayKey = day as keyof typeof editedAvailability;
    const updatedSlots = [...(editedAvailability[dayKey] || [])];
    updatedSlots.splice(index, 1);
    
    setEditedAvailability({
      ...editedAvailability,
      [dayKey]: updatedSlots
    });
  };

  const updateTimeSlot = (day: string, index: number, field: 'start' | 'end', value: string) => {
    const dayKey = day as keyof typeof editedAvailability;
    const updatedSlots = [...(editedAvailability[dayKey] || [])];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    
    setEditedAvailability({
      ...editedAvailability,
      [dayKey]: updatedSlots
    });
  };

  const handleSave = () => {
    onSave(editedAvailability);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Edit Availability</h2>
        <div className="space-x-2">
          <button 
            onClick={onCancel}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            Save
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {days.map(day => (
          <div key={day} className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-900 capitalize">{day}</h3>
              <button
                onClick={() => addTimeSlot(day)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                + Add Time Slot
              </button>
            </div>
            
            {(!editedAvailability[day as keyof typeof editedAvailability] || 
              editedAvailability[day as keyof typeof editedAvailability].length === 0) && (
              <p className="text-sm text-gray-500 italic">Not available</p>
            )}
            
            {editedAvailability[day as keyof typeof editedAvailability]?.map((slot, index) => (
              <div key={index} className="flex items-center space-x-2 mt-2">
                <select
                  value={slot.start}
                  onChange={(e) => updateTimeSlot(day, index, 'start', e.target.value)}
                  className="block w-full max-w-[120px] pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <option key={hour} value={`${hour}:00`}>{`${hour}:00`}</option>
                    );
                  })}
                </select>
                <span>to</span>
                <select
                  value={slot.end}
                  onChange={(e) => updateTimeSlot(day, index, 'end', e.target.value)}
                  className="block w-full max-w-[120px] pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <option key={hour} value={`${hour}:00`}>{`${hour}:00`}</option>
                    );
                  })}
                </select>
                <button
                  onClick={() => removeTimeSlot(day, index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50 p-4 rounded-md">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Your availability is automatically synced with the booking system. 
          Clients will only be able to book walks during your available time slots.
        </p>
      </div>
    </div>
  );
}

export default function WalkerProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [walker, setWalker] = useState<Walker | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  
  // Redirect if not a walker or admin
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'walker' && user.role !== 'admin') {
        router.push('/unauthorized');
      } else if (user.profileId) {
        // Get walker profile
        const walkerProfile = getWalkerById(user.profileId);
        if (walkerProfile) {
          setWalker(walkerProfile);
        }
      }
    }
  }, [user, loading, router]);

  // If loading or not walker/admin, show loading state
  if (loading || !user || (user.role !== 'walker' && user.role !== 'admin') || !walker) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Format availability time slots for display
  const formatAvailability = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map(day => {
      const slots = walker.availability[day as keyof typeof walker.availability];
      if (!slots || slots.length === 0) {
        return { day, formattedSlots: 'Not available' };
      }
      
      const formattedSlots = slots.map(slot => `${slot.start} - ${slot.end}`).join(', ');
      return { day, formattedSlots };
    });
  };

  const handleSaveAvailability = (newAvailability: Walker['availability']) => {
    // In a real app, this would make an API call to update the walker's availability
    setWalker({
      ...walker,
      availability: newAvailability
    });
    setIsEditingAvailability(false);
    
    // Show success message (in a real app)
    console.log('Availability updated successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            Edit Profile
          </button>
        ) : (
          <div className="space-x-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 relative">
                <Image
                  src={walker.imageUrl || 'https://via.placeholder.com/128'}
                  alt={walker.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              <h2 className="mt-4 text-xl font-semibold text-gray-900">{walker.name}</h2>
              <p className="text-sm text-gray-500">{walker.email}</p>
              <p className="text-sm text-gray-500">{walker.phone}</p>
              
              <div className="mt-4 flex items-center">
                <span className="text-yellow-500 mr-1">★</span>
                <span className="font-medium">{walker.rating}</span>
                <span className="text-gray-500">/5 rating</span>
              </div>
            </div>
            
            <div className="border-t border-gray-100 mt-6 pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bio</h3>
              <p className="text-sm text-gray-700">{walker.bio}</p>
            </div>
            
            <div className="border-t border-gray-100 mt-6 pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {walker.specialties.map((specialty, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="border-t border-gray-100 mt-6 pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Certifications</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                {walker.certificationsOrTraining.map((cert, index) => (
                  <li key={index}>{cert}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Availability & Preferences */}
        <div className="lg:col-span-2">
          {isEditingAvailability ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <EditAvailability 
                availability={walker.availability}
                onSave={handleSaveAvailability}
                onCancel={() => setIsEditingAvailability(false)}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Availability</h2>
                <button
                  onClick={() => setIsEditingAvailability(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Availability
                </button>
              </div>
              
              <div className="space-y-4">
                {formatAvailability().map(({ day, formattedSlots }) => (
                  <div key={day} className="grid grid-cols-3 gap-4 items-center">
                    <div className="col-span-1">
                      <p className="font-medium text-gray-700 capitalize">{day}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-600">{formattedSlots}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-700">
                  Your availability is automatically synced with the booking system. 
                  Clients will only be able to book walks during your available time slots.
                </p>
              </div>
            </div>
          )}
          
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preferred Dog Sizes</h3>
                <div className="flex flex-wrap gap-2">
                  {walker.preferredDogSizes.map((size, index) => (
                    <span 
                      key={index} 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        size === 'small' 
                          ? 'bg-blue-100 text-blue-800' 
                          : size === 'medium' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
            
            <div className="space-y-4">
              <button className="text-sm text-primary-600 hover:text-primary-700">
                Change Password
              </button>
              <button className="text-sm text-primary-600 hover:text-primary-700">
                Notification Preferences
              </button>
              <button className="text-sm text-red-600 hover:text-red-700">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 