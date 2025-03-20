'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { getWalkerById } from '@/utils/helpers';
import { Walker } from '@/lib/types';

export default function WalkerProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [walker, setWalker] = useState<Walker | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Availability</h2>
            
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
            
            <div className="border-t border-gray-100 mt-6 pt-6">
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