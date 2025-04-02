import { POST, GET } from '@/app/api/subscriptions/users/route';
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
  user: {
    findUnique: jest.fn(),
  },
  subscriptionPlan: {
    findUnique: jest.fn(),
  },
  userSubscription: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Subscription API', () => {
  const mockUser = {
    id: 'test_user_1',
    email: 'test@example.com',
    role: 'owner',
    owner: {
      id: 'owner_1',
      name: 'Test Owner',
    },
  };

  const mockPlan = {
    id: 'plan_1',
    name: 'Basic',
    walkCredits: 5,
    walkDuration: 60,
    price: 7500,
    features: ['Valid for 30 days'],
    isActive: true,
  };

  const mockSubscription = {
    id: 'sub_1',
    userId: 'test_user_1',
    planId: 'plan_1',
    planName: 'Basic',
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    creditsRemaining: 5,
    walkCredits: 5,
    walkDuration: 60,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/subscriptions/users', () => {
    describe('Subscription Creation', () => {
      it('should create a new subscription successfully', async () => {
        // Mock dependencies
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);
        (prisma.userSubscription.create as jest.Mock).mockResolvedValue(mockSubscription);

        const request = new MockNextRequest('http://localhost:3000/api/subscriptions/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': mockUser.id,
            'user-role': 'owner',
          },
          body: JSON.stringify({
            userId: mockUser.id,
            planId: mockPlan.id,
          }),
        }) as any;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscription).toBeDefined();
        expect(data.subscription.userId).toBe(mockUser.id);
        expect(data.subscription.planId).toBe(mockPlan.id);
        expect(data.subscription.status).toBe('active');
        expect(data.subscription.walkCredits).toBe(mockPlan.walkCredits);
      });

      it('should handle inactive subscription plans', async () => {
        const inactivePlan = { ...mockPlan, isActive: false };
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(inactivePlan);

        const request = new MockNextRequest('http://localhost:3000/api/subscriptions/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': mockUser.id,
            'user-role': 'owner',
          },
          body: JSON.stringify({
            userId: mockUser.id,
            planId: inactivePlan.id,
          }),
        }) as any;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Selected subscription plan is not active');
      });

      it('should prevent duplicate active subscriptions', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);
        (prisma.userSubscription.findMany as jest.Mock).mockResolvedValue([mockSubscription]);

        const request = new MockNextRequest('http://localhost:3000/api/subscriptions/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': mockUser.id,
            'user-role': 'owner',
          },
          body: JSON.stringify({
            userId: mockUser.id,
            planId: mockPlan.id,
          }),
        }) as any;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('User already has an active subscription');
      });
    });

    describe('Input Validation', () => {
      it('should validate required fields', async () => {
        const request = new MockNextRequest('http://localhost:3000/api/subscriptions/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': mockUser.id,
            'user-role': 'owner',
          },
          body: JSON.stringify({}),
        }) as any;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Plan ID and User ID are required');
      });

      it('should validate user authorization', async () => {
        const request = new MockNextRequest('http://localhost:3000/api/subscriptions/users', {
          method: 'POST',
          body: JSON.stringify({
            userId: mockUser.id,
            planId: mockPlan.id,
          }),
        }) as any;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });
  });

  describe('GET /api/subscriptions/users', () => {
    describe('Subscription Retrieval', () => {
      it('should return all subscriptions for admin', async () => {
        const mockSubscriptions = [
          mockSubscription,
          { ...mockSubscription, id: 'sub_2', userId: 'user_2' },
        ];
        (prisma.userSubscription.findMany as jest.Mock).mockResolvedValue(mockSubscriptions);

        const request = new MockNextRequest('http://localhost:3000/api/subscriptions/users', {
          headers: {
            'user-id': 'admin_1',
            'user-role': 'admin',
          },
        }) as any;

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscriptions).toHaveLength(2);
        expect(data.subscriptions[0].id).toBe('sub_1');
        expect(data.subscriptions[1].id).toBe('sub_2');
      });

      it('should return filtered subscriptions for owner', async () => {
        (prisma.userSubscription.findMany as jest.Mock).mockResolvedValue([mockSubscription]);

        const request = new MockNextRequest('http://localhost:3000/api/subscriptions/users', {
          headers: {
            'user-id': mockUser.id,
            'user-role': 'owner',
          },
        }) as any;

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscriptions).toHaveLength(1);
        expect(data.subscriptions[0].userId).toBe(mockUser.id);
      });

      it('should handle no subscriptions found', async () => {
        (prisma.userSubscription.findMany as jest.Mock).mockResolvedValue([]);

        const request = new MockNextRequest('http://localhost:3000/api/subscriptions/users', {
          headers: {
            'user-id': mockUser.id,
            'user-role': 'owner',
          },
        }) as any;

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscriptions).toHaveLength(0);
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        (prisma.userSubscription.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

        const request = new MockNextRequest('http://localhost:3000/api/subscriptions/users', {
          headers: {
            'user-id': mockUser.id,
            'user-role': 'owner',
          },
        }) as any;

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch subscriptions');
      });

      it('should require authentication', async () => {
        const request = new MockNextRequest('http://localhost:3000/api/subscriptions/users') as any;

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });
  });
}); 