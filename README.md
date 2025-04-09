# WanderPaws - Dog Walking Application

WanderPaws is a comprehensive dog walking platform that connects dog owners with professional walkers, provides assessment services, subscription management, and an admin dashboard for business insights.

## Features

- **Smart Dog-Walker Matching**: AI analyzes dog temperament, walker specialties, and past experiences to recommend the most suitable walkers
- **Intelligent Scheduling**: Generates optimized walk schedules based on dog needs, walker availability, and owner preferences
- **Health & Behavior Insights**: Tracks and analyzes walk metrics to provide actionable insights about your dog's health and behavior
- **Detailed Walk Tracking**: Logs comprehensive walk data including distance, duration, bathroom breaks, mood, and observed behaviors
- **User-Friendly Interface**: Modern, intuitive dashboard for dog owners and walkers

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **AI/ML**: Integrated with OpenAI for intelligent recommendations and insights
- **Data Visualization**: Interactive charts and maps for visualizing walk data

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/src/app` - Next.js application routes and pages
- `/src/components` - Reusable UI components
- `/src/lib` - Core application logic, types, and data models
- `/src/utils` - Helper functions and utilities

## AI Capabilities

WanderPaws uses AI to:

1. **Match dogs with compatible walkers** by analyzing factors such as:
   - Dog temperament and special needs
   - Walker specialties and experience
   - Past walk ratings and feedback
   - Walker availability and preferred dog sizes

2. **Generate optimized walking schedules** considering:
   - Dog exercise requirements based on breed, age, and size
   - Owner preferences and constraints
   - Historical walking patterns
   - Weather conditions (in future versions)

3. **Provide health and behavior insights** by analyzing:
   - Walk metrics (distance, duration, pace)
   - Bathroom habits
   - Mood ratings
   - Observed behaviors
   - Trends over time

## Stripe Integration

### Testing on Localhost

When testing Stripe payments locally, webhooks won't be able to reach your localhost server. Here are two ways to work around this:

#### Option 1: Use Stripe CLI for webhook forwarding

1. [Install the Stripe CLI](https://stripe.com/docs/stripe-cli#install)
2. Login to your Stripe account:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/stripe/webhook
   ```
4. Use the webhook signing secret provided by the CLI in your `.env.local` file:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

#### Option 2: Manual subscription creation

The application includes a fallback mechanism that detects if a payment was successful but the subscription wasn't created automatically. It will show a "Create Subscription Manually" button that triggers the same process that would normally be handled by the webhook.

### Stripe Environment Variables

Make sure to set these environment variables in your `.env.local` file:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

---

WanderPaws - Making dog walking more intelligent, efficient, and insightful.

## Production Deployment Guide

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- AWS S3 bucket for media storage
- Cloudinary account for image/video processing
- Stripe account for payments

### Environment Setup

1. Clone the repository
2. Copy `.env.sample` to `.env` and configure all required environment variables:

```bash
cp .env.sample .env
```

3. Edit the `.env` file with your production values:

### Required Environment Variables

- **Database**
  - `DATABASE_URL`: PostgreSQL connection string

- **Cloudinary**
  - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
  - `CLOUDINARY_API_KEY`: API key for Cloudinary
  - `CLOUDINARY_API_SECRET`: API secret for Cloudinary
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Public cloud name for client-side

- **AWS S3**
  - `AWS_REGION`: Region where your S3 bucket is located
  - `AWS_ACCESS_KEY_ID`: Access key for AWS
  - `AWS_SECRET_ACCESS_KEY`: Secret key for AWS
  - `AWS_S3_BUCKET_NAME`: Name of your S3 bucket
  - `NEXT_PUBLIC_AWS_S3_BUCKET_NAME`: Public bucket name for client-side
  - `NEXT_PUBLIC_AWS_REGION`: Public AWS region for client-side

- **Stripe**
  - `STRIPE_SECRET_KEY`: Your Stripe secret key
  - `STRIPE_WEBHOOK_SECRET`: Secret for Stripe webhooks
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Publishable key for client-side
  - `NEXT_PUBLIC_BASE_URL`: Your production domain (e.g., https://wanderpaws.com)

### Database Setup

1. Ensure your PostgreSQL database is running and accessible
2. Run the database migrations:

```bash
npx prisma migrate deploy
```

### Building for Production

1. Install dependencies:

```bash
npm install
```

2. Build the application:

```bash
npm run build
```

3. Start the production server:

```bash
npm start
```

### Deployment Options

#### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add all environment variables in the Vercel dashboard
3. Deploy the application

#### Docker

1. Build the Docker image:

```bash
docker build -t wanderpaws .
```

2. Run the container with environment variables:

```bash
docker run -p 3000:3000 --env-file .env wanderpaws
```

### Monitoring & Production Considerations

- Configure error tracking by setting up Sentry and setting the `SENTRY_DSN` environment variable
- Review and adjust rate limiting for API routes
- Set up database connection pooling for production
- Configure AWS S3 bucket CORS settings for file uploads
- Set up Stripe webhooks for payment event handling

### Security Checklist

- Ensure all API keys and secrets are properly secured
- Set up proper CORS headers
- Enable HTTPS for all traffic
- Implement rate limiting for authentication endpoints
- Review database permissions and ensure least privilege principle

## License

All rights reserved. This code is not open source and should not be redistributed without permission.

##