import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

let prisma: PrismaClient;

// Function to create a new PrismaClient instance with logging and error handling
function createPrismaClient(): PrismaClient {
  // Log the database connection attempt
  logger.info('Creating PrismaClient instance', {
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL
  });
  
  if (!process.env.DATABASE_URL) {
    logger.error('DATABASE_URL is not defined in environment variables');
    throw new Error('DATABASE_URL is not defined in environment variables');
  }
  
  const client = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' }
    ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  
  // Set up listeners for Prisma Client events
  client.$on('query', (e) => {
    if (process.env.DEBUG_PRISMA === 'true') {
      logger.debug('Prisma Query', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`
      });
    }
  });
  
  // Log successful initialization
  logger.success('PrismaClient initialized successfully');
  
  return client;
}

if (typeof window === 'undefined') {
  // We're on the server
  try {
    if (process.env.NODE_ENV === 'production') {
      prisma = createPrismaClient();
    } else {
      // In development, use a global variable so that the value
      // is preserved across module reloads caused by HMR (Hot Module Replacement).
      if (!global.prisma) {
        logger.info('Initializing global PrismaClient for development');
        global.prisma = createPrismaClient();
      } else {
        logger.info('Using existing global PrismaClient instance');
      }
      prisma = global.prisma;
    }
  } catch (error) {
    logger.error('Failed to initialize PrismaClient', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Create a stub client that logs errors when used
    prisma = new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === '$connect' || prop === '$disconnect' || prop === '$on' || prop === '$use') {
          return () => Promise.resolve();
        }
        
        return () => {
          const errorMsg = `Database is not available. Failed to access ${String(prop)}`;
          logger.error(errorMsg);
          return Promise.reject(new Error(errorMsg));
        };
      }
    });
  }
} else {
  // We're in the browser
  // Create a dummy object that throws helpful errors when accessed
  prisma = new Proxy({} as PrismaClient, {
    get(_target, prop) {
      throw new Error(
        `PrismaClient cannot be accessed on the client side (tried to access ${String(prop)}). Please use data context or server components for database access.`
      );
    },
  });
}

// Add query performance monitoring in development
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  prisma.$use(async (params: any, next: any) => {
    const start = performance.now();
    
    try {
      const result = await next(params);
      const end = performance.now();
      const time = end - start;
      
      if (time > 100) {
        logger.warn(`Slow query detected: ${params.model}.${params.action}`, {
          duration: `${time.toFixed(2)}ms`,
          model: params.model,
          action: params.action
        });
      }
      
      return result;
    } catch (error) {
      logger.error(`Query error in ${params.model}.${params.action}`, {
        error,
        model: params.model,
        action: params.action,
        args: params.args
      });
      throw error;
    }
  });
}

// Test the DB connection immediately to catch issues early
if (typeof window === 'undefined') {
  (async () => {
    try {
      logger.info('Testing database connection...');
      // Simple query to check connection
      await prisma.$queryRaw`SELECT 1 as test`;
      logger.success('Database connection successful');
    } catch (error) {
      logger.error('Database connection test failed', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })();
}

// Export the prisma instance
export default prisma;

// IMPORTANT: All exports below should ONLY be used in server components or API routes

// Stripe Customer Functions
export async function getStripeCustomer(userId: string) {
  try {
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be called from the server side');
    }
    
    return await prisma.stripeCustomer.findUnique({
      where: {
        userId,
      },
    });
  } catch (error) {
    console.error('Error getting Stripe customer:', error);
    return null;
  }
}

export async function createStripeCustomerRecord(stripeCustomerId: string, userId: string, email: string) {
  try {
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be called from the server side');
    }
    
    return await prisma.stripeCustomer.create({
      data: {
        id: stripeCustomerId,
        userId,
        email,
      },
    });
  } catch (error) {
    console.error('Error creating Stripe customer record:', error);
    throw new Error(`Failed to create Stripe customer record: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Subscription Functions
export async function createSubscription(
  userId: string,
  planId: string,
  planName: string,
  walkCredits: number,
  walkDuration: number,
  validityPeriod: number,
  amount: number,
  stripePaymentId: string
) {
  try {
    console.log('Creating subscription for user:', {
      userId,
      planId,
      planName,
      walkCredits,
      validityPeriod,
      amount,
      stripePaymentId
    });
    
    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + validityPeriod);
    
    console.log('Subscription period:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      validityPeriod
    });
    
    const subscription = await prisma.userSubscription.create({
      data: {
        userId,
        planId,
        planName,
        walkCredits,
        walkDuration,
        creditsRemaining: walkCredits,
        startDate,
        endDate,
        status: 'active',
        purchaseAmount: amount,
        purchaseDate: startDate,
        stripePayments: {
          connect: {
            id: stripePaymentId,
          },
        },
      },
    });
    
    console.log('✅ Subscription created successfully:', {
      subscriptionId: subscription.id,
      userId,
      planId,
      status: subscription.status
    });
    
    return subscription;
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    throw error;
  }
}

// Payment Functions
export async function createStripePayment(
  id: string,
  stripeCustomerId: string,
  amount: number,
  status: string,
  paymentIntentId?: string,
  checkoutSessionId?: string,
  metadata?: Record<string, string>
) {
  try {
    console.log('Creating Stripe payment record:', {
      id,
      customerId: stripeCustomerId,
      amount,
      status,
      paymentIntentId,
      checkoutSessionId
    });
    
    const payment = await prisma.stripePayment.create({
      data: {
        id,
        stripeCustomerId,
        amount,
        status,
        paymentIntentId,
        checkoutSessionId,
        metadata: metadata || {},
      },
    });
    
    console.log('✅ Stripe payment record created:', payment.id);
    return payment;
  } catch (error) {
    console.error('❌ Error creating Stripe payment record:', error);
    throw error;
  }
}

// Update a Stripe payment with the subscription ID
export async function updateStripePaymentWithSubscription(
  paymentId: string,
  subscriptionId: string
) {
  try {
    console.log('Updating payment record with subscription:', {
      paymentId,
      subscriptionId
    });
    
    const payment = await prisma.stripePayment.update({
      where: { id: paymentId },
      data: {
        subscription: {
          connect: {
            id: subscriptionId,
          },
        },
      },
    });
    
    console.log('✅ Payment record updated with subscription ID:', {
      paymentId: payment.id,
      subscriptionId
    });
    
    return payment;
  } catch (error) {
    console.error('❌ Error updating payment with subscription:', error);
    throw error;
  }
} 