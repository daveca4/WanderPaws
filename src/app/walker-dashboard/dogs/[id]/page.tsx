'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

export default function DogDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [dog, setDog] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDogDetails = async () => {
      try {
        if (!user) {
          router.push('/login');
          return;
        }

        if (user.role !== 'walker' && user.role !== 'admin') {
          router.push('/unauthorized');
          return;
        }

        // Fetch dog details
        const dogResponse = await fetch(`/api/data/dogs/${id}`);
        if (!dogResponse.ok) {
          throw new Error('Failed to fetch dog details');
        }
        const dogData = await dogResponse.json();
        setDog(dogData);

        // Fetch owner details
        if (dogData.ownerId) {
          const ownerResponse = await fetch(`/api/data/owners/${dogData.ownerId}`);
          if (ownerResponse.ok) {
            const ownerData = await ownerResponse.json();
            setOwner(ownerData);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dog details:', err);
        setError('Failed to load dog details. Please try again later.');
        setLoading(false);
      }
    };

    fetchDogDetails();
  }, [id, router, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !dog) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-red-500">{error || 'Dog not found'}</p>
        <Link 
          href="/walker-dashboard/dogs" 
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Back to Dogs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dog Details</h1>
        <Link 
          href="/walker-dashboard/dogs" 
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Dogs
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0 md:w-1/3 relative h-64 md:h-auto">
            {dog.imageUrl ? (
              <Image
                src={dog.imageUrl}
                alt={dog.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-xl">No image</span>
              </div>
            )}
          </div>
          
          <div className="p-6 md:w-2/3">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{dog.name}</h2>
                <p className="text-gray-600">{dog.breed}</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {dog.size.charAt(0).toUpperCase() + dog.size.slice(1)} Dog
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Dog Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Age:</span>
                    <span className="text-sm font-medium text-gray-900">{dog.age} {dog.age === 1 ? 'year' : 'years'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Temperament:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {dog.temperament && dog.temperament.length > 0 
                        ? dog.temperament.join(', ') 
                        : 'Not specified'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Special Needs:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {dog.specialNeeds && dog.specialNeeds.length > 0 
                        ? dog.specialNeeds.join(', ') 
                        : 'None'}
                    </span>
                  </div>
                </div>
              </div>
              
              {owner && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Owner Information</h3>
                  <div className="space-y-2">
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
                </div>
              )}
            </div>
            
            {dog.address && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Address</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-900">
                    {typeof dog.address === 'string' 
                      ? dog.address 
                      : `${dog.address.street || ''}, ${dog.address.city || ''}, ${dog.address.postalCode || ''}`}
                  </p>
                </div>
              </div>
            )}
            
            <div className="mt-8 flex flex-wrap gap-4">
              <Link 
                href={`/walker-dashboard/walks/schedule?dogId=${dog.id}`} 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Schedule Walk
              </Link>
              
              {dog.assessmentStatus !== 'completed' && (
                <Link 
                  href={`/walker-dashboard/assessments?dogId=${dog.id}`} 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  View Assessment
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 