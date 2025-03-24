#!/usr/bin/env bash
# This script creates all the required database tables
# Run this script on Render.com shell if the automatic migrations don't work

# Exit on error
set -e

# Run database migrations
echo "Running database migrations..."
npm run db:push

echo "Database setup completed successfully!"