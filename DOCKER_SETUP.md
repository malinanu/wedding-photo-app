# Wedding Photo App - Docker Setup 🐳

## ✅ Successfully Dockerized!

The Wedding Photo App is now running in Docker containers with the following services:

### 📦 Running Services

1. **PostgreSQL Database** (postgres:17-alpine)
   - Port: `5433` (host) → `5432` (container)
   - Database: `wedding_photos`
   - User: `urlshortener`
   - Password: `password`
   - Container: `wedding_postgres`

2. **Redis Cache** (redis:7-alpine)
   - Port: `6380` (host) → `6379` (container)
   - Container: `wedding_redis`

3. **Next.js Application**
   - Port: `3002` (host) → `3000` (container)
   - URL: http://localhost:3002
   - Container: `wedding_app`

## 🚀 Quick Start

### Start the application:
```bash
docker-compose up -d
```

### Stop the application:
```bash
docker-compose down
```

### View logs:
```bash
docker logs wedding_app
docker logs wedding_postgres
docker logs wedding_redis
```

### Rebuild after changes:
```bash
docker-compose build app
docker-compose up -d
```

## 📋 Default Seed Data

The database has been seeded with:

- **Event ID**: `default-event-id`
- **Event Name**: Sarah & John Wedding
- **Event Passcode**: `1234`
- **Tables**: 
  - Table 1: Family Table
  - Table 2: Friends Table

## 🔧 Configuration Files

### Created/Modified Files:
1. **Dockerfile** - Multi-stage build for optimized production image
2. **docker-compose.yml** - Service orchestration configuration
3. **.dockerignore** - Excludes unnecessary files from build
4. **init.sql** - PostgreSQL initialization script
5. **seed.sql** - Database seed data
6. **.env.docker** - Docker-specific environment variables

## 📊 Database Management

### Access PostgreSQL:
```bash
docker exec -it wedding_postgres psql -U urlshortener -d wedding_photos
```

### Run migrations manually:
```bash
# From host machine
Get-Content prisma\migrations\20250905212725_init\migration.sql | docker exec -i wedding_postgres psql -U urlshortener -d wedding_photos
```

### Seed database:
```bash
Get-Content seed.sql | docker exec -i wedding_postgres psql -U urlshortener -d wedding_photos
```

## 🌐 Application Access

- **Main App**: http://localhost:3002
- **Health Check**: `curl http://localhost:3002 -I`

## 📝 Environment Variables

The containerized app uses these key environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `NEXTAUTH_URL`: Application URL for authentication
- `GCS_*`: Google Cloud Storage credentials
- `TEXTLK_*`: SMS gateway configuration

## 🔍 Troubleshooting

### Check container status:
```bash
docker ps
```

### Reset everything (including data):
```bash
docker-compose down -v
docker-compose up -d
```

### Rebuild from scratch:
```bash
docker-compose build --no-cache app
docker-compose up -d
```

## 📈 Resource Usage

The Docker setup is optimized with:
- Multi-stage builds to minimize image size
- Alpine Linux base images for smaller footprint
- Health checks for all services
- Automatic restart policies

## 🎉 Status

✅ **FULLY OPERATIONAL** - The Wedding Photo App is running successfully in Docker!

Guests can now:
1. Visit http://localhost:3002
2. Enter their name and optional contact info
3. Upload photos to the wedding event
4. Photos are stored in Google Cloud Storage

## 🔒 Security Notes

- Database credentials are currently in plain text for development
- For production, use Docker secrets or environment file encryption
- The NEXTAUTH_SECRET has been simplified to avoid special character issues
- GCS service account key is mounted as a volume
