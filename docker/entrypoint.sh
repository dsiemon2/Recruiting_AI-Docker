#!/bin/sh
set -e

# Wait for database file to be accessible
echo "Checking database..."

# Run Prisma migrations/push
echo "Running Prisma db push..."
npx prisma db push --skip-generate --accept-data-loss

# Run seed (it handles clearing and reseeding)
echo "Running database seed..."
npx prisma db seed || echo "Seed completed or already seeded"

# Start the application
echo "Starting application..."
exec "$@"
