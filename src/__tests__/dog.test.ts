import { POST, GET } from '@/app/api/data/dogs/route';
import prisma from '@/lib/db';

// Mock NextRequest
class MockNextRequest {
  private url: string;
  private options: any;

  constructor(url: string, options: any = {}) {
    this.url = url;
    this.options = options;
  }

  get nextUrl() {
    return new URL(this.url);
  }

  get headers() {
    return new Map(Object.entries(this.options.headers || {}));
  }

  async json() {
    return JSON.parse(this.options.body || '{}');
  }
}

// Mock Prisma
jest.mock('@/lib/db', () => ({
  dog: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  owner: {
    findUnique: jest.fn(),
  },
}));

describe('Dog Management API', () => {
  const mockOwner = {
    id: 'owner_1',
    name: 'Test Owner',
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zip: '12345',
    },
  };

  const mockDog = {
    id: 'dog_1',
    name: 'Buddy',
    breed: 'Labrador',
    age: 3,
    size: 'medium',
    temperament: ['friendly', 'energetic'],
    specialNeeds: [],
    ownerId: 'owner_1',
    address: mockOwner.address,
    assessmentStatus: 'pending',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/data/dogs', () => {
    it('should create a new dog successfully', async () => {
      // Mock dependencies
      (prisma.owner.findUnique as jest.Mock).mockResolvedValue(mockOwner);
      (prisma.dog.create as jest.Mock).mockResolvedValue(mockDog);

      // Create mock request with headers
      const request = new MockNextRequest('http://localhost:3000/api/data/dogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': mockOwner.id,
          'user-role': 'owner',
        },
        body: JSON.stringify({
          name: 'Buddy',
          breed: 'Labrador',
          age: 3,
          size: 'medium',
          temperament: ['friendly', 'energetic'],
          specialNeeds: [],
        }),
      }) as any;

      // Execute request
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(201);
      expect(data.name).toBe('Buddy');
      expect(data.ownerId).toBe(mockOwner.id);
      expect(data.assessmentStatus).toBe('pending');
    });

    it('should return 400 if required fields are missing', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/data/dogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': mockOwner.id,
          'user-role': 'owner',
        },
        body: JSON.stringify({
          // Missing required fields
          breed: 'Labrador',
        }),
      }) as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.errors).toContain('name is required');
    });

    it('should return 404 if owner is not found', async () => {
      (prisma.owner.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new MockNextRequest('http://localhost:3000/api/data/dogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'non_existent_owner',
          'user-role': 'owner',
        },
        body: JSON.stringify({
          name: 'Buddy',
          breed: 'Labrador',
          age: 3,
          size: 'medium',
        }),
      }) as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Owner profile not found');
    });
  });

  describe('GET /api/data/dogs', () => {
    it('should return filtered dogs for owner', async () => {
      const mockDogs = [mockDog];
      (prisma.dog.findMany as jest.Mock).mockResolvedValue(mockDogs);

      const request = new MockNextRequest('http://localhost:3000/api/data/dogs', {
        headers: {
          'user-id': mockOwner.id,
          'user-role': 'owner',
        },
      }) as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].ownerId).toBe(mockOwner.id);
    });

    it('should return all dogs for admin', async () => {
      const mockDogs = [
        mockDog,
        { ...mockDog, id: 'dog_2', ownerId: 'owner_2' },
      ];
      (prisma.dog.findMany as jest.Mock).mockResolvedValue(mockDogs);

      const request = new MockNextRequest('http://localhost:3000/api/data/dogs', {
        headers: {
          'user-id': 'admin_1',
          'user-role': 'admin',
        },
      }) as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
    });

    it('should return 401 if user headers are missing', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/data/dogs') as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized - Missing user information');
    });
  });
}); 