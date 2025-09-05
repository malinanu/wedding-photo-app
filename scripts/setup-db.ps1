# Setup script for Wedding Photo App with existing PostgreSQL (Windows)

Write-Host "🎉 Wedding Photo App Database Setup" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# Database credentials (using your existing PostgreSQL)
$DB_USER = "urlshortener"
$DB_PASSWORD = "password"
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "wedding_photos"

Write-Host "Using existing PostgreSQL with:" -ForegroundColor Cyan
Write-Host "  User: $DB_USER"
Write-Host "  Host: ${DB_HOST}:${DB_PORT}"
Write-Host ""

# Set PGPASSWORD environment variable for psql
$env:PGPASSWORD = $DB_PASSWORD

# Check if database exists
Write-Host "Checking if database '$DB_NAME' exists..." -ForegroundColor Yellow

$checkDb = psql -U $DB_USER -h $DB_HOST -p $DB_PORT -lqt 2>$null | Select-String $DB_NAME

if ($checkDb) {
    Write-Host "✅ Database '$DB_NAME' already exists" -ForegroundColor Green
} else {
    Write-Host "Creating database '$DB_NAME'..." -ForegroundColor Yellow
    
    $createResult = psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create database. Please check your PostgreSQL connection." -ForegroundColor Red
        Write-Host $createResult
        exit 1
    }
}

# Remove PGPASSWORD from environment
Remove-Item Env:PGPASSWORD

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy .env.example to .env: " -NoNewline
Write-Host "cp .env.example .env" -ForegroundColor Yellow
Write-Host "2. Update .env with your Google Cloud Storage credentials"
Write-Host "3. Run migrations: " -NoNewline
Write-Host "npx prisma migrate deploy" -ForegroundColor Yellow
Write-Host "4. Start the app: " -NoNewline
Write-Host "npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Setup complete!" -ForegroundColor Green
