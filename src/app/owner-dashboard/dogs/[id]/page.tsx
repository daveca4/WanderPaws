'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useDog, useUpdateDog, useDeleteDog } from '@/lib/hooks/useDataHooks';
import { Dog } from '@/lib/types';
import { format } from 'date-fns';
import RouteGuard from '@/components/RouteGuard';
import Link from 'next/link';

// Temporary placeholder UI components until proper ones are created
const Tabs = ({ children, defaultValue }: { children: React.ReactNode, defaultValue?: string, value?: string, onValueChange?: (value: string) => void }) => <div>{children}</div>;
const TabsList = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={className}>{children}</div>;
const TabsTrigger = ({ children, value }: { children: React.ReactNode, value: string }) => <button>{children}</button>;
const TabsContent = ({ children, value }: { children: React.ReactNode, value: string }) => <div>{children}</div>;

const Card = ({ children }: { children: React.ReactNode }) => <div className="border rounded shadow-sm">{children}</div>;
const CardHeader = ({ children }: { children: React.ReactNode }) => <div className="p-4 border-b">{children}</div>;
const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={`p-4 ${className || ''}`}>{children}</div>;
const CardFooter = ({ children }: { children: React.ReactNode }) => <div className="p-4 border-t">{children}</div>;
const CardTitle = ({ children }: { children: React.ReactNode }) => <h3 className="text-lg font-semibold">{children}</h3>;

// Extend the Dog type with the additional properties used in this component
interface ExtendedDog extends Dog {
  photoUrl?: string;
  birthdate?: string;
  updatedAt?: string;
  allergies?: string;
  medications?: string;
  veterinarianName?: string;
  veterinarianPhone?: string;
  lastVetVisit?: string;
  vaccinationStatus?: string;
  energyLevel?: string;
  goodWithChildren?: boolean;
  goodWithDogs?: boolean;
  trainingStatus?: string;
  walkingStyle?: string;
  behavioralNotes?: string;
}

// Temporary placeholder components until proper ones are created
const DogProfileForm = ({ dog, onChange }: { dog: Partial<ExtendedDog>, onChange: (field: string, value: any) => void }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700">Name</label>
      <input 
        type="text" 
        value={dog.name || ''} 
        onChange={(e) => onChange('name', e.target.value)}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700">Breed</label>
      <input 
        type="text" 
        value={dog.breed || ''} 
        onChange={(e) => onChange('breed', e.target.value)}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
      />
    </div>
  </div>
);

const DogHealthForm = ({ dog, onChange }: { dog: Partial<ExtendedDog>, onChange: (field: string, value: any) => void }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700">Allergies</label>
      <input 
        type="text" 
        value={dog.allergies || ''} 
        onChange={(e) => onChange('allergies', e.target.value)}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700">Medications</label>
      <input 
        type="text" 
        value={dog.medications || ''} 
        onChange={(e) => onChange('medications', e.target.value)}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
      />
    </div>
  </div>
);

const DogBehaviorPanel = ({ dog, onChange }: { dog: Partial<ExtendedDog>, onChange: (field: string, value: any) => void }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700">Temperament</label>
      <input 
        type="text" 
        value={dog.temperament || ''} 
        onChange={(e) => onChange('temperament', e.target.value)}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700">Energy Level</label>
      <select 
        value={dog.energyLevel || ''} 
        onChange={(e) => onChange('energyLevel', e.target.value)}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
      >
        <option value="">Select Energy Level</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
    </div>
  </div>
);

export default function DogDetailsPage() {
  const params = useParams();
  const dogId = params?.id as string;
  const router = useRouter();
  
  // Fetch dog data using React Query hook
  const { 
    data: dogData, 
    isPending, 
    error, 
    refetch 
  } = useDog(dogId);
  
  // Cast the dog data to our extended type
  const dog = dogData as ExtendedDog | undefined;
  
  // Get mutations
  const { 
    mutate: updateDog, 
    isPending: isUpdating 
  } = useUpdateDog();
  
  const { 
    mutate: deleteDog, 
    isPending: isDeleting 
  } = useDeleteDog();

  // State for managing forms and UI
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // For form data
  const [formData, setFormData] = useState<Partial<ExtendedDog>>({});

  // Initialize form data when dog data is loaded
  useEffect(() => {
    if (dog) {
      setFormData(dog);
    }
  }, [dog]);

  // Handle form changes
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name) {
      alert('Dog name is required');
      return;
    }
    
    try {
      // Call the update mutation
      updateDog(
        { id: dogId, ...formData },
        {
          onSuccess: () => {
            setEditMode(false);
            refetch(); // Refresh dog data
          }
        }
      );
    } catch (error) {
      console.error('Error updating dog:', error);
      alert('Failed to update dog information');
    }
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    
    try {
      deleteDog(dogId, {
        onSuccess: () => {
          router.push('/owner-dashboard/dogs');
        }
      });
    } catch (error) {
      console.error('Error deleting dog:', error);
      alert('Failed to delete dog');
      setConfirmDelete(false);
    }
  };

  // Reset confirmation if user changes their mind
  const cancelDelete = () => {
    setConfirmDelete(false);
  };

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-lg font-semibold text-red-700">Error Loading Dog Details</h2>
        <p className="text-red-600">{error instanceof Error ? error.message : 'Failed to load dog details'}</p>
        <button 
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h2 className="text-lg font-semibold text-yellow-700">Dog Not Found</h2>
        <p className="text-yellow-600">The dog you're looking for could not be found.</p>
        <Link href="/owner-dashboard/dogs" className="mt-2 inline-block px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
          Back to Dogs
        </Link>
      </div>
    );
  }

  return (
    <RouteGuard requiredPermission={{ action: 'view', resource: 'dogs' }}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link 
              href="/owner-dashboard/dogs" 
              className="text-primary-600 hover:text-primary-800 mb-2 inline-block"
            >
              ← Back to Dogs
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{dog.name}</h1>
          </div>
          
          <div className="flex space-x-2">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Edit Dog
              </button>
            ) : (
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            )}
            
            <button
              onClick={handleDelete}
              className={`px-4 py-2 ${confirmDelete ? 'bg-red-600' : 'bg-red-100 text-red-700'} rounded-md ${confirmDelete ? 'hover:bg-red-700 text-white' : 'hover:bg-red-200'}`}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : confirmDelete ? 'Confirm Delete' : 'Delete Dog'}
            </button>
            
            {confirmDelete && (
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
        
        {editMode ? (
          // Edit mode - Show forms with submit button
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="health">Health</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <DogProfileForm dog={formData} onChange={handleChange} />
              </TabsContent>
              
              <TabsContent value="health">
                <DogHealthForm dog={formData} onChange={handleChange} />
              </TabsContent>
              
              <TabsContent value="behavior">
                <DogBehaviorPanel dog={formData} onChange={handleChange} />
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          // View mode - Read-only display
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Picture</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      {dog.photoUrl ? (
                        <div className="relative w-40 h-40 rounded-full overflow-hidden">
                          <Image 
                            src={dog.photoUrl} 
                            alt={dog.name}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-4xl">🐾</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Name</div>
                        <div className="text-lg">{dog.name}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-500">Breed</div>
                        <div>{dog.breed || 'Not specified'}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-500">Age</div>
                        <div>{dog.age ? `${dog.age} years` : 'Not specified'}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-500">Weight</div>
                        <div>{dog.weight ? `${dog.weight} kg` : 'Not specified'}</div>
                      </div>
                      
                      {dog.birthdate && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Birth Date</div>
                          <div>{format(new Date(dog.birthdate), 'MMMM d, yyyy')}</div>
                        </div>
                      )}
                      
                      <div>
                        <div className="text-sm font-medium text-gray-500">Last Updated</div>
                        <div>{dog.updatedAt ? format(new Date(dog.updatedAt), 'MMMM d, yyyy') : 'Never'}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="health">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Health Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Allergies</div>
                      <div>{dog.allergies || 'None known'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-500">Medications</div>
                      <div>{dog.medications || 'None'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-500">Veterinarian</div>
                      <div>{dog.veterinarianName || 'Not specified'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-500">Veterinarian Phone</div>
                      <div>{dog.veterinarianPhone || 'Not specified'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-500">Last Vet Visit</div>
                      <div>
                        {dog.lastVetVisit 
                          ? format(new Date(dog.lastVetVisit), 'MMMM d, yyyy') 
                          : 'Not recorded'
                        }
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-500">Vaccination Status</div>
                      <div>{dog.vaccinationStatus || 'Unknown'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-500">Special Needs</div>
                      <div>{dog.specialNeeds || 'None'}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="behavior">
              <Card>
                <CardHeader>
                  <CardTitle>Behavior & Training</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Temperament</div>
                    <div>{dog.temperament || 'Not specified'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Energy Level</div>
                    <div>{dog.energyLevel || 'Not specified'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Good with Children</div>
                    <div>{dog.goodWithChildren ? 'Yes' : dog.goodWithChildren === false ? 'No' : 'Unknown'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Good with Dogs</div>
                    <div>{dog.goodWithDogs ? 'Yes' : dog.goodWithDogs === false ? 'No' : 'Unknown'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Training Status</div>
                    <div>{dog.trainingStatus || 'Not specified'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Walking Style</div>
                    <div>{dog.walkingStyle || 'Not specified'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Behavioral Notes</div>
                    <div className="whitespace-pre-line">{dog.behavioralNotes || 'No notes'}</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </RouteGuard>
  );
} 