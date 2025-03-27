'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import S3Image from '@/components/S3Image';
import type { Dog } from '@/lib/types';

type DogCardProps = {
  dog: Dog;
};

export const DogCard: React.FC<DogCardProps> = ({ dog }) => {
  const router = useRouter();

  return (
    <div 
      key={dog.id} 
      className="bg-white shadow rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => router.push(`/owner-dashboard/dogs/${dog.id}`)}
    >
      <div className="h-48 bg-gray-200 relative">
        <S3Image 
          src={dog.imageUrl} 
          alt={dog.name} 
          fill
          className="object-cover"
          defaultImage="/dog-placeholder.png"
        />
      </div>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900">{dog.name}</h2>
        <p className="text-sm text-gray-500">
          {dog.breed} • {dog.age} {dog.age === 1 ? 'year' : 'years'} old
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
            {dog.size}
          </span>
          {dog.temperament && dog.temperament.length > 0 && 
            dog.temperament.slice(0, 2).map((trait, index) => (
              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {trait}
              </span>
            ))
          }
          {dog.temperament && dog.temperament.length > 2 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              +{dog.temperament.length - 2} more
            </span>
          )}
        </div>
        <div className="mt-4 flex justify-between">
          <Link
            href={`/owner-dashboard/dogs/${dog.id}/edit`}
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            Edit
          </Link>
          <Link
            href={`/owner-dashboard/schedule-walk?dogId=${dog.id}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            Schedule Walk
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DogCard; 