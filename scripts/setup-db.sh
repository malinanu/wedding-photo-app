#!/bin/bash

# Setup script for Wedding Photo App with existing PostgreSQL

echo "🎉 Wedding Photo App Database Setup"
echo "===================================="
echo ""

# Database credentials (using your existing PostgreSQL)
DB_USER="urlshortener"
DB_PASSWORD="password"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="wedding_photos"

echo "Using existing PostgreSQL with:"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST:$DB_PORT"
echo ""

# Check if database exists
echo "Checking if database '$DB_NAME' exists..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -p $DB_PORT -lqt | cut -d \| -f 1 | grep -qw $DB_NAME

if [ $? -eq 0 ]; then
    echo "✅ Database '$DB_NAME' already exists"
else
    echo "Creating database '$DB_NAME'..."
    PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME;"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database created successfully"
    else
        echo "❌ Failed to create database. Please check your PostgreSQL connection."
        exit 1
    fi
fi

echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env: cp .env.example .env"
echo "2. Update .env with your Google Cloud Storage credentials"
echo "3. Run migrations: npx prisma migrate deploy"
echo "4. Start the app: npm run dev"
echo ""
echo "🚀 Setup complete!"
