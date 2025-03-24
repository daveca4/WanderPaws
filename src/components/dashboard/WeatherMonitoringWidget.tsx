import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

interface WeatherWarning {
  id: string;
  location: string;
  severity: 'yellow' | 'amber' | 'red';
  type: string;
  description: string;
  startTime: string;
  endTime: string;
}

interface Location {
  id: string;
  name: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

// In-memory storage for locations
let locationsStorage: Location[] = [];

export function WeatherMonitoringWidget() {
  const { user } = useAuth();
  const [warnings, setWarnings] = useState<WeatherWarning[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    postcode: '',
  });

  useEffect(() => {
    // Load locations from in-memory storage
    setLocations(locationsStorage);
    fetchWeatherWarnings();
  }, []);

  const fetchWeatherWarnings = async () => {
    try {
      // Simulate weather warnings based on locations
      const mockWarnings: WeatherWarning[] = locations.map(location => ({
        id: `${location.id}-${Date.now()}`,
        location: location.name,
        severity: Math.random() > 0.7 ? 'red' : Math.random() > 0.4 ? 'amber' : 'yellow',
        type: 'Weather Warning',
        description: 'This is a simulated weather warning for testing purposes.',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }));

      setWarnings(mockWarnings);
    } catch (error) {
      console.error('Error fetching weather warnings:', error);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newLocationData: Location = {
        id: `loc-${Date.now()}`,
        name: newLocation.name,
        postcode: newLocation.postcode,
        latitude: 51.5074, // Dummy coordinates
        longitude: -0.1278,
      };

      // Add to in-memory storage
      locationsStorage.push(newLocationData);
      setLocations(locationsStorage);
      setIsAddingLocation(false);
      setNewLocation({ name: '', postcode: '' });
    } catch (error) {
      console.error('Error adding location:', error);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    try {
      // Remove from in-memory storage
      locationsStorage = locationsStorage.filter(loc => loc.id !== locationId);
      setLocations(locationsStorage);
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Weather Monitoring</h2>
        <button
          onClick={() => setIsAddingLocation(!isAddingLocation)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {isAddingLocation ? 'Cancel' : 'Add Location'}
        </button>
      </div>

      {isAddingLocation && (
        <form onSubmit={handleAddLocation} className="mb-4 p-4 bg-gray-50 rounded">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Location Name</label>
              <input
                type="text"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Postcode</label>
              <input
                type="text"
                value={newLocation.postcode}
                onChange={(e) => setNewLocation({ ...newLocation, postcode: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add Location
          </button>
        </form>
      )}

      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-2">Monitored Locations</h3>
        <div className="space-y-2">
          {locations.map((location) => (
            <div
              key={location.id}
              className="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <div>
                <span className="font-medium">{location.name}</span>
                <span className="text-gray-500 ml-2">({location.postcode})</span>
              </div>
              <button
                onClick={() => handleDeleteLocation(location.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-md font-medium text-gray-900 mb-2">Active Weather Warnings</h3>
        <div className="space-y-3">
          {warnings.map((warning) => (
            <div
              key={warning.id}
              className={`p-3 rounded ${
                warning.severity === 'red'
                  ? 'bg-red-50 border border-red-200'
                  : warning.severity === 'amber'
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{warning.location}</h4>
                  <p className="text-sm text-gray-600">{warning.type}</p>
                  <p className="text-sm mt-1">{warning.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(warning.startTime).toLocaleString()} -{' '}
                    {new Date(warning.endTime).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    warning.severity === 'red'
                      ? 'bg-red-100 text-red-800'
                      : warning.severity === 'amber'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {warning.severity.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 