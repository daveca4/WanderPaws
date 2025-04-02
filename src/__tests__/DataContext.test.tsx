import React from 'react';
import { render, act, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataProvider, useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';

// Mock AuthContext
jest.mock('@/lib/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('DataContext', () => {
  const mockUser = {
    id: 'test_user_1',
    email: 'test@example.com',
    role: 'owner',
    profileId: 'owner_1',
  };

  const mockSubscriptions = [
    {
      id: 'sub_1',
      userId: 'test_user_1',
      planId: 'plan_1',
      planName: 'Basic',
      status: 'active',
      startDate: '2025-04-02T11:39:08.159Z',
      endDate: '2025-05-02T11:39:08.157Z',
      creditsRemaining: 5,
      walkCredits: 5,
      walkDuration: 60,
    },
  ];

  const mockDogs = [
    {
      id: 'dog_1',
      name: 'Buddy',
      breed: 'Labrador',
      ownerId: 'test_user_1',
      assessmentStatus: 'completed',
    },
  ];

  const mockAssessments = [
    {
      id: 'assessment_1',
      dogId: 'dog_1',
      status: 'completed',
      walkerId: 'walker_1',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  // Test Components
  const TestComponent: React.FC = () => {
    const { userSubscriptions, dogs, assessments, isLoading, error } = useData();
    return (
      <div>
        {isLoading && <div data-testid="loading">Loading...</div>}
        {error && <div data-testid="error">Error: {error}</div>}
        {userSubscriptions.map(sub => (
          <div key={sub.id} data-testid="subscription">
            Plan: {sub.planName}, Credits: {sub.creditsRemaining}
          </div>
        ))}
        {dogs.map(dog => (
          <div key={dog.id} data-testid="dog">
            Dog: {dog.name}
          </div>
        ))}
        {assessments.map(assessment => (
          <div key={assessment.id} data-testid="assessment">
            Assessment: {assessment.status}
          </div>
        ))}
      </div>
    );
  };

  describe('Initial Data Loading', () => {
    it('should load all data types successfully', async () => {
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/subscriptions/users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ subscriptions: mockSubscriptions }),
          });
        } else if (url.includes('/api/data/dogs')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDogs),
          });
        } else if (url.includes('/api/data/assessments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockAssessments),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      });

      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('subscription')).toBeInTheDocument();
        expect(screen.getByTestId('dog')).toBeInTheDocument();
        expect(screen.getByTestId('assessment')).toBeInTheDocument();
      });

      expect(screen.getByText('Plan: Basic, Credits: 5')).toBeInTheDocument();
      expect(screen.getByText('Dog: Buddy')).toBeInTheDocument();
      expect(screen.getByText('Assessment: completed')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        })
      );

      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/data/subscriptions'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Data Refresh Functionality', () => {
    const TestRefreshComponent: React.FC = () => {
      const { refreshData, userSubscriptions, dogs, isLoading } = useData();
      return (
        <div>
          <button onClick={() => refreshData()} data-testid="refresh-button">
            Refresh
          </button>
          {isLoading && <div data-testid="loading">Loading...</div>}
          <div data-testid="subscription-count">
            Subscriptions: {userSubscriptions.length}
          </div>
          <div data-testid="dog-count">
            Dogs: {dogs.length}
          </div>
        </div>
      );
    };

    it('should refresh all data types', async () => {
      const updatedSubscriptions = [...mockSubscriptions, {
        id: 'sub_2',
        userId: 'test_user_1',
        planId: 'plan_2',
        planName: 'Premium',
        status: 'active',
        creditsRemaining: 10,
      }];

      mockFetch
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ subscriptions: mockSubscriptions }),
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDogs),
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ subscriptions: updatedSubscriptions }),
        }));

      render(
        <DataProvider>
          <TestRefreshComponent />
        </DataProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Subscriptions: 1')).toBeInTheDocument();
      });

      mockFetch.mockClear();

      await act(async () => {
        screen.getByTestId('refresh-button').click();
      });

      await waitFor(() => {
        expect(screen.getByText('Subscriptions: 2')).toBeInTheDocument();
      });
    });

    it('should handle refresh errors gracefully', async () => {
      mockFetch
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ subscriptions: mockSubscriptions }),
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Server Error'),
        }));

      render(
        <DataProvider>
          <TestRefreshComponent />
        </DataProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Subscriptions: 1')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByTestId('refresh-button').click();
      });

      // Data should remain unchanged after failed refresh
      expect(screen.getByText('Subscriptions: 1')).toBeInTheDocument();
    });
  });

  describe('Utility Functions', () => {
    const TestUtilityComponent: React.FC = () => {
      const { getDogById, getAssessmentById, getUserById } = useData();
      const dog = getDogById('dog_1');
      const assessment = getAssessmentById('assessment_1');
      const user = getUserById('test_user_1');
      
      return (
        <div>
          {dog && <div data-testid="found-dog">Found: {dog.name}</div>}
          {assessment && <div data-testid="found-assessment">Found: {assessment.status}</div>}
          {user && <div data-testid="found-user">Found: {user.email}</div>}
        </div>
      );
    };

    it('should find entities by ID', async () => {
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/data/dogs')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDogs),
          });
        } else if (url.includes('/api/data/assessments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockAssessments),
          });
        } else if (url.includes('/api/data/users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([mockUser]),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      });

      render(
        <DataProvider>
          <TestUtilityComponent />
        </DataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('found-dog')).toBeInTheDocument();
        expect(screen.getByTestId('found-assessment')).toBeInTheDocument();
        expect(screen.getByText('Found: Buddy')).toBeInTheDocument();
        expect(screen.getByText('Found: completed')).toBeInTheDocument();
      });
    });
  });
}); 