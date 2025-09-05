# PostgreSQL Fix Script - Run as Administrator
Write-Host "=== PostgreSQL Database Setup Script ===" -ForegroundColor Green

# PostgreSQL paths
$pgBin = "C:\Program Files\PostgreSQL\17\bin"
$pgData = "C:\Program Files\PostgreSQL\17\data"

# Step 1: Stop PostgreSQL service
Write-Host "`nStep 1: Stopping PostgreSQL service..." -ForegroundColor Yellow
Stop-Service -Name "postgresql-x64-17" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Update pg_hba.conf for trust authentication
Write-Host "Step 2: Configuring authentication..." -ForegroundColor Yellow
$pgHbaPath = "$pgData\pg_hba.conf"
$pgHbaBackup = "$pgData\pg_hba.conf.backup_$(Get-Date -Format 'yyyyMMddHHmmss')"

# Backup original file
if (Test-Path $pgHbaPath) {
    Copy-Item $pgHbaPath $pgHbaBackup -Force
    Write-Host "  Backed up pg_hba.conf to $pgHbaBackup" -ForegroundColor Gray
}

# Create new pg_hba.conf with trust authentication
$pgHbaContent = @"
# PostgreSQL Client Authentication Configuration File
# Temporary trust authentication for setup

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     trust
# IPv4 local connections:
host    all             all             127.0.0.1/32            trust
# IPv6 local connections:
host    all             all             ::1/128                 trust
# Allow replication connections from localhost, by a user with the
# replication privilege.
local   replication     all                                     trust
host    replication     all             127.0.0.1/32            trust
host    replication     all             ::1/128                 trust
"@

$pgHbaContent | Out-File -FilePath $pgHbaPath -Encoding UTF8 -Force

# Step 3: Start PostgreSQL service
Write-Host "Step 3: Starting PostgreSQL service..." -ForegroundColor Yellow
Start-Service -Name "postgresql-x64-17"
Start-Sleep -Seconds 3

# Step 4: Create database and user
Write-Host "Step 4: Setting up database and user..." -ForegroundColor Yellow

# Drop and recreate user and database
$sqlCommands = @"
-- Drop existing connections to the database
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'wedding_photos' AND pid <> pg_backend_pid();

-- Drop database if exists
DROP DATABASE IF EXISTS wedding_photos;

-- Drop user if exists
DROP USER IF EXISTS urlshortener;

-- Create user with password
CREATE USER urlshortener WITH PASSWORD 'password';

-- Create database
CREATE DATABASE wedding_photos OWNER urlshortener;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE wedding_photos TO urlshortener;
"@

$sqlCommands | & "$pgBin\psql.exe" -U postgres -h localhost -p 5432

# Step 5: Restore secure authentication
Write-Host "`nStep 5: Restoring secure authentication..." -ForegroundColor Yellow

$pgHbaSecure = @"
# PostgreSQL Client Authentication Configuration File
# Production configuration with scram-sha-256

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     scram-sha-256
# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256
# IPv6 local connections:
host    all             all             ::1/128                 scram-sha-256
# Allow replication connections from localhost, by a user with the
# replication privilege.
local   replication     all                                     scram-sha-256
host    replication     all             127.0.0.1/32            scram-sha-256
host    replication     all             ::1/128                 scram-sha-256
"@

$pgHbaSecure | Out-File -FilePath $pgHbaPath -Encoding UTF8 -Force

# Step 6: Restart PostgreSQL to apply secure settings
Write-Host "Step 6: Restarting PostgreSQL with secure settings..." -ForegroundColor Yellow
Restart-Service -Name "postgresql-x64-17" -Force
Start-Sleep -Seconds 3

# Step 7: Test connection
Write-Host "`nStep 7: Testing database connection..." -ForegroundColor Yellow
$testQuery = "SELECT 'Connection successful!' as status;"
$result = $testQuery | & "$pgBin\psql.exe" -U urlshortener -d wedding_photos -h localhost -p 5432 -t 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database connection successful!" -ForegroundColor Green
    Write-Host "  Database: wedding_photos" -ForegroundColor Gray
    Write-Host "  User: urlshortener" -ForegroundColor Gray
    Write-Host "  Password: password" -ForegroundColor Gray
} else {
    Write-Host "✗ Connection test failed:" -ForegroundColor Red
    Write-Host $result
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Return to your terminal and run: npm run prisma:migrate" -ForegroundColor White
Write-Host "2. Then restart your application: npm run dev" -ForegroundColor White
