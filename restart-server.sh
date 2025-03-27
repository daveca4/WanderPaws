#!/bin/bash

# Stop any running server
echo "Stopping any running Next.js server..."
pkill -f "next dev" || true

# Clear node_modules/.cache
echo "Clearing Next.js cache..."
rm -rf node_modules/.cache

# Run database optimization
echo "Running database optimization..."
npx prisma db push --accept-data-loss

# Start server with optimized settings
echo "Starting server with optimized settings..."
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

