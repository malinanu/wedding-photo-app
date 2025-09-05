#!/bin/sh

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until nc -z -v -w30 host.docker.internal 5432
do
  echo "Waiting for database connection..."
  sleep 1
done

echo "PostgreSQL is up - executing command"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Try to run migrations (might fail if already applied)
echo "Running database migrations..."
npx prisma migrate deploy || true

# Start the application
echo "Starting Next.js application..."
exec node server.js
