#!/bin/sh
set -e

echo "Starting Wedding Photo App..."

# Wait for database to be ready
echo "Waiting for database..."
sleep 5

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Seed database if needed (only in development)
if [ "$NODE_ENV" != "production" ]; then
  echo "Seeding database..."
  npx prisma db seed || true
fi

# Start the application
echo "Starting Next.js server..."
exec node server.js
