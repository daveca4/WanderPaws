import Link from 'next/link';
// Removed mock data import
import NewDogForm from '@/components/NewDogForm';

export default function AddDogPage() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link href="/dogs" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dogs
        </Link>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Add a New Dog</h1>
        </div>
        
        <div className="p-6">
          <NewDogForm owners={mockOwners} />
        </div>
      </div>
    </div>
  );
} 