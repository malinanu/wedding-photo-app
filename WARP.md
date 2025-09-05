# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Mobile Testing Setup

To test the app on your phone (same WiFi network):

```powershell
# Run the mobile testing setup script
.\scripts\setup-mobile-testing.ps1

# This will:
# 1. Find your local IP address (e.g., 192.168.1.23)
# 2. Show URLs for testing
# 3. Optionally open Windows Firewall port 3000
# 4. Generate QR code URLs for each table
```

### Manual Setup:
1. Find your IP: `ipconfig` (look for IPv4 like 192.168.x.x)
2. Update `.env`: `NEXT_PUBLIC_APP_URL="http://YOUR_IP:3000"`
3. Open firewall port: 
   ```powershell
   New-NetFirewallRule -DisplayName "Wedding Photo App" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
   ```
4. Access from phone: `http://YOUR_IP:3000`

## Quick Start (Using Existing PostgreSQL & Redis)

```bash
# 1. Install dependencies
npm install

# 2. Setup database (Windows PowerShell)
.\scripts\setup-db.ps1

# 3. Configure environment
cp .env.example .env
# Edit .env - only need to add GCS credentials

# 4. Run migrations
npx prisma migrate deploy

# 5. Start development server
npm run dev
```

The app will use your existing PostgreSQL (urlshortener:password) and Redis containers.

## Commands

### Development
```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your actual values

# Create wedding_photos database in existing PostgreSQL
psql -U urlshortener -h localhost -c "CREATE DATABASE wedding_photos;"

# Generate Prisma client (required after schema changes)
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Database Management
```bash
# Apply pending migrations
npx prisma migrate deploy

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Docker Deployment (Using Existing Database)
```bash
# Using simplified docker-compose for just the app (recommended)
docker-compose -f docker-compose.app.yml up -d

# View logs
docker-compose -f docker-compose.app.yml logs -f

# Run migrations in Docker
docker-compose -f docker-compose.app.yml exec app npx prisma migrate deploy

# Stop app
docker-compose -f docker-compose.app.yml down

# Rebuild after code changes
docker-compose -f docker-compose.app.yml up -d --build
```

#### With Nginx (Optional)
If you need nginx reverse proxy:
1. Ensure `nginx.conf` exists as a file (not directory)
2. Uncomment nginx service in `docker-compose.yml`
3. Run: `docker-compose up -d app nginx`

### Type Checking
```bash
# TypeScript type check (no emit)
npx tsc --noEmit
```

> Note: No test runner scripts are defined in package.json. If you plan to add tests (e.g., Vitest or Jest), add the appropriate devDependencies and scripts, then document single-test invocation here.

## Architecture

### Progressive Upload System
The app implements a sophisticated 20% background upload system inspired by Gmail's attachment handling:

1. **ProgressiveUploadManager** (`src/lib/upload-manager.ts`): Core upload orchestration
   - Immediately compresses images to 20% quality when selected
   - Uploads thumbnail in background while user continues
   - Full upload triggered on final confirmation
   - Supports resumable uploads with progress tracking

2. **Direct-to-Cloud Architecture**: Files upload directly to Google Cloud Storage using signed URLs
   - Server generates pre-signed URLs (`src/lib/gcs.ts`)
   - Client uploads directly to GCS, bypassing server
   - Reduces server load and improves scalability

### Authentication Flow
Two authentication modes for wedding guests:

1. **Simple Auth** (`src/components/guest-auth.tsx`): Name-only authentication
2. **OTP Auth** (`src/components/guest-auth-otp.tsx`): SMS verification for Sri Lankan numbers
   - Integration with Text.lk SMS service (`src/lib/sms.ts`)
   - Rate-limited OTP generation (`src/lib/otp.ts`)
   - Stored in PostgreSQL with expiry and attempt tracking

### Data Organization
Photos are stored in a hierarchical structure in GCS:
```
wedding-photos/
  └── year=2025/
      └── month=09/
          └── day=05/
              └── uploader=John_Doe/
                  └── IMG_001.jpg
```

### Database Schema
Key models in `prisma/schema.prisma`:
- **Event**: Wedding events with storage quotas
- **Guest**: Authenticated uploaders with session management
- **Photo**: Upload records with status tracking (PENDING → UPLOADING → COMPLETED)
- **Table**: QR code mapping for table-specific uploads
- **OTPVerification**: Phone verification tracking

### API Routes Structure
```
src/app/api/
├── auth/
│   ├── guest/route.ts        # Simple guest authentication
│   ├── send-otp/route.ts     # SMS OTP generation
│   └── verify-otp/route.ts   # OTP verification
└── upload/
    └── thumbnail/route.ts     # Initial thumbnail upload & signed URL generation
```

- Authenticated routes expect a Bearer token in the `Authorization` header (session token created in auth flows). The token is stored in `localStorage` under `guestSession.session.token` by the client auth components.

### Component Architecture
- **Main flow**: `src/app/page.tsx` orchestrates the multi-step process
- **State management**: React hooks with local state, persisted via localStorage
- **UI Components**: Custom button component with size variants (including "jumbo" for toddler-friendly UI)
- **Animation**: Framer Motion for smooth transitions and confetti celebrations
- **Path alias**: `@/*` maps to `./src/*` (see `tsconfig.json`)

### Environment Configuration
QR code URL pattern used to route guests to the correct event/table:
```
${NEXT_PUBLIC_APP_URL}?event=<eventId>&table=<tableNumber>
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string (uses existing DB with urlshortener:password)
- `GCS_PROJECT_ID`, `GCS_BUCKET_NAME`: Google Cloud Storage config
- `GCS_CLIENT_EMAIL`, `GCS_PRIVATE_KEY`: Service account credentials
- `TEXTLK_API_TOKEN`, `TEXTLK_SENDER_ID`: SMS service credentials (optional)
- `NEXT_PUBLIC_APP_URL`: Public URL for QR codes (used in QR code generation, see `src/app/admin/page.tsx`)
- `NEXTAUTH_SECRET`: Session encryption key

### Key Technical Decisions
1. **Next.js 15 with Turbopack**: Fast development builds
2. **Prisma with PostgreSQL**: Type-safe database access
3. **Tailwind CSS v4**: Modern styling with @theme inline
4. **Standalone output**: Optimized Docker deployments; images hosted on `storage.googleapis.com` (see `next.config.ts`)
5. **Progressive enhancement**: Core features work without SMS/Redis

## Production Considerations

### Database Setup
The app uses your existing PostgreSQL instance (user: urlshortener, password: password). You need to:
1. Create the `wedding_photos` database: `CREATE DATABASE wedding_photos;`
2. Run migrations: `npx prisma migrate deploy`

The app also uses your existing Redis instance on port 6379 for caching (optional).

### Google Cloud Storage Setup
The app requires a GCS bucket with proper CORS configuration for direct uploads. Service account needs `Storage Object Admin` role on the bucket.

### Session Management
Sessions stored in PostgreSQL with 24-hour expiry. Redis integration available but optional for caching.

### File Size Limits
- Default max upload: 10MB per file (configurable per event)
- Server action body limit: 10MB (configured in `next.config.ts`)
- Supported formats: JPEG, PNG, WebP, HEIC

### Scaling Considerations
- Direct GCS uploads prevent server bottlenecks
- Database connection pooling via Prisma
- Docker Compose includes health checks for dependencies
- Nginx proxy configuration available for SSL termination
