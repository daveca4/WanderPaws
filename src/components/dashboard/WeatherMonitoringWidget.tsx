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

interface WeatherSummary {
  temperature: number;
  condition: string;
  wind: number;
  humidity: number;
  precipitation: number;
  updated: string;
}

interface Location {
  id: string;
  name: string;
  postcode: string;
  latitude: number;
  longitude: number;
  weather?: WeatherSummary;
}

// In-memory storage for locations
let locationsStorage: Location[] = [];

export function WeatherMonitoringWidget() {
  const { user } = useAuth();
  const [warnings, setWarnings] = useState<WeatherWarning[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'warnings' | 'locations'>('summary');
  const [newLocation, setNewLocation] = useState({
    name: '',
    postcode: '',
  });

  useEffect(() => {
    // Load locations from in-memory storage
    setLocations(locationsStorage);
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      // Simulate weather data for locations
      const updatedLocations = locationsStorage.map(location => {
        // Generate random weather data
        const weather: WeatherSummary = {
          temperature: Math.floor(Math.random() * 25) + 5, // 5-30°C
          condition: ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Snowy'][Math.floor(Math.random() * 5)],
          wind: Math.floor(Math.random() * 30) + 5, // 5-35 km/h
          humidity: Math.floor(Math.random() * 60) + 30, // 30-90%
          precipitation: Math.floor(Math.random() * 100), // 0-100% chance
          updated: new Date().toISOString()
        };
        
        return {
          ...location,
          weather
        };
      });
      
      setLocations(updatedLocations);
      locationsStorage = updatedLocations;
      
      // Generate warnings based on weather conditions - real API implementation would be here
      const warnings: WeatherWarning[] = [];
      updatedLocations.forEach(location => {
        if (!location.weather) return;
        
        // Create a warning if conditions meet criteria
        if (location.weather.condition === 'Rainy' && location.weather.precipitation > 70) {
          warnings.push({
            id: `${location.id}-rain-${Date.now()}`,
            location: location.name,
            severity: 'yellow',
            type: 'Heavy Rain Warning',
            description: 'Heavy rain expected. Potential for flooding in low-lying areas.',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          });
        }
        
        if (location.weather.condition === 'Windy' && location.weather.wind > 25) {
          warnings.push({
            id: `${location.id}-wind-${Date.now()}`,
            location: location.name,
            severity: 'amber',
            type: 'Strong Wind Warning',
            description: 'Strong winds expected. Potential for damage to structures and falling branches.',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          });
        }
        
        if (location.weather.condition === 'Snowy') {
          warnings.push({
            id: `${location.id}-snow-${Date.now()}`,
            location: location.name,
            severity: 'red',
            type: 'Snow Warning',
            description: 'Heavy snowfall expected. Travel may be severely affected.',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      });
      
      setWarnings(warnings);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Check for duplicate postcode
      if (locationsStorage.some(loc => loc.postcode.toLowerCase() === newLocation.postcode.toLowerCase())) {
        alert('A location with this postcode already exists');
        return;
      }

      const newLocationData: Location = {
        id: `loc-${Date.now()}`,
        name: newLocation.name,
        postcode: newLocation.postcode,
        latitude: 51.5074, // Dummy coordinates
        longitude: -0.1278,
      };

      // Add to in-memory storage
      locationsStorage.push(newLocationData);
      
      // Fetch weather data for the new location
      fetchWeatherData();
      
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

  const renderWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Sunny':
        return (
          <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        );
      case 'Cloudy':
        return (
          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
          </svg>
        );
      case 'Rainy':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
            <path d="M9 17a1 1 0 11-2 0 1 1 0 012 0zm2-1a1 1 0 11-2 0 1 1 0 012 0zm2-1a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        );
      case 'Windy':
        return (
          <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 5a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
            <path d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
            <path d="M8 15a1 1 0 011-1h6a1 1 0 110 2H9a1 1 0 01-1-1z" />
          </svg>
        );
      case 'Snowy':
        return (
          <svg className="w-6 h-6 text-blue-200" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 17a1 1 0 001 1h-1a1 1 0 100-2h1a1 1 0 000 1zm0-14a1 1 0 100 2 1 1 0 000-2zM3.5 3.75a.75.75 0 00-1.5 0v.012a.75.75 0 001.5 0V3.75zm1.75.75a.75.75 0 000-1.5h-.012a.75.75 0 000 1.5H5.25zm.48 7.58a.75.75 0 10-1.06 1.06l.013.012a.75.75 0 101.06-1.06l-.013-.012zM10 18a.75.75 0 01-.75-.75v-.012a.75.75 0 011.5 0V17.25A.75.75 0 0110 18zm3.75-.24a.75.75 0 100-1.5h-.012a.75.75 0 000 1.5h.012zm-6.013-3.243l-.012-.012a.75.75 0 00-1.06 1.06l.012.012a.75.75 0 101.06-1.06zm8.013-.75a.75.75 0 01-.75-.75v-.012a.75.75 0 011.5 0V13.25a.75.75 0 01-.75.75zm.013-10.5a.75.75 0 00-1.5 0v.012a.75.75 0 001.5 0V3.25z" />
            <path d="M11 17a1 1 0 001 1h-1a1 1 0 100-2h1a1 1 0 000 1zm0-14a1 1 0 100 2 1 1 0 000-2zm-8 0a1 1 0 00-1 1v.589a1 1 0 002 0V4a1 1 0 00-1-1zM3.884 4.888A1 1 0 105.26 5a1 1 0 10-1.376-.112zM10 18a1 1 0 01-1-1v-.589a1 1 0 012 0V17a1 1 0 01-1 1zm4-4a1 1 0 00.884-.884A1 1 0 1014 14a1 1 0 00.884-.884zM6 11h-.589a1 1 0 000 2H6a1 1 0 000-2zm11 0h.589a1 1 0 010 2H17a1 1 0 010-2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Weather Monitoring</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'summary'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('warnings')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'warnings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Warnings
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'locations'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Locations
          </button>
        </div>
      </div>

      {activeTab === 'summary' && (
        <div>
          {locations.length === 0 ? (
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-gray-500">No locations added yet. Add locations to see weather summaries.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {locations.map((location) => (
                <div 
                  key={location.id} 
                  className="p-3 rounded bg-gray-50 border border-gray-200 hover:shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{location.name}</h3>
                      <p className="text-xs text-gray-500">{location.postcode}</p>
                    </div>
                    {location.weather && renderWeatherIcon(location.weather.condition)}
                  </div>

                  {location.weather ? (
                    <div className="mt-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center">
                          <span className="text-gray-600">Temperature:</span>
                          <span className="ml-1 font-medium">{location.weather.temperature}°C</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-600">Condition:</span>
                          <span className="ml-1 font-medium">{location.weather.condition}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-600">Wind:</span>
                          <span className="ml-1 font-medium">{location.weather.wind} km/h</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-600">Humidity:</span>
                          <span className="ml-1 font-medium">{location.weather.humidity}%</span>
                        </div>
                        <div className="flex items-center col-span-2">
                          <span className="text-gray-600">Precipitation:</span>
                          <span className="ml-1 font-medium">{location.weather.precipitation}%</span>
                        </div>
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-xs text-gray-400">
                          Updated: {new Date(location.weather.updated).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-500">
                      Weather data unavailable
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-right">
            <button
              onClick={fetchWeatherData}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Refresh Weather Data
            </button>
          </div>
        </div>
      )}

      {activeTab === 'warnings' && (
        <div>
          {warnings.length === 0 ? (
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-gray-500">No active weather warnings for monitored locations.</p>
            </div>
          ) : (
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
                      <h3 className="font-medium">{warning.location}</h3>
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
          )}
        </div>
      )}

      {activeTab === 'locations' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <button
              onClick={() => setIsAddingLocation(!isAddingLocation)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isAddingLocation ? 'Cancel' : 'Add Location'}
            </button>
          </div>

          {isAddingLocation && (
            <form onSubmit={handleAddLocation} className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location Name</label>
                  <input
                    type="text"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postcode</label>
                  <input
                    type="text"
                    value={newLocation.postcode}
                    onChange={(e) => setNewLocation({ ...newLocation, postcode: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-3 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Add Location
              </button>
            </form>
          )}

          {locations.length === 0 ? (
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-gray-500">No locations added yet. Add a location to start monitoring.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded text-sm border border-gray-200"
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
          )}
        </div>
      )}
    </div>
  );
} 