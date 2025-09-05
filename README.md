# 💒 Wedding Photo Collection System

A production-ready, toddler-friendly wedding photo collection platform that allows wedding guests to easily share their photos through QR codes. Features super-fast progressive uploads, Google Cloud Storage integration, and a delightful user experience.

![Wedding Photo App](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Key Features

### 🚀 Super-Fast Upload System
- **20% Background Upload**: Photos start uploading instantly when selected (like Gmail attachments)
- **Progressive Upload**: Compressed thumbnails upload first, full resolution follows
- **Resumable Uploads**: Interrupted uploads can be resumed automatically
- **Direct to Cloud**: Files upload directly to Google Cloud Storage using signed URLs

### 👶 Toddler-Friendly Interface
- **Huge Buttons**: Large, colorful touch targets perfect for any age
- **3-Step Process**: Scan → Upload → Done
- **Visual Feedback**: Fun animations, confetti, and clear success indicators
- **Mobile-First**: Optimized for phones with intuitive drag-and-drop

### 📱 Guest Experience
- **QR Code Access**: Each table has a unique QR code for instant access
- **Simple Auth**: Just enter your name - no complex registration
- **Instant Preview**: See your photos immediately after selection
- **Multiple Uploads**: Upload as many photos as you want

### 🏗️ Production-Ready Architecture
- **Scalable**: Handles thousands of concurrent users
- **Organized Storage**: Photos stored by year/month/day/uploader
- **Database**: PostgreSQL with Prisma ORM for reliability
- **Caching**: Redis for session management
- **Security**: Signed URLs, input validation, rate limiting

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express API routes
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: Google Cloud Storage
- **Caching**: Redis (optional)
- **UI Components**: Radix UI, Framer Motion
- **Deployment**: Docker, Docker Compose

## 📦 Installation

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL database
- Google Cloud Storage account
- Redis (optional)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/wedding-photo-app.git
cd wedding-photo-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/wedding_photos"

# Google Cloud Storage
GCS_PROJECT_ID="your-project-id"
GCS_BUCKET_NAME="wedding-photos-bucket"
GCS_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

4. **Set up the database**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Run the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app!

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Build and start all services**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- Next.js application
- Nginx proxy (optional)

2. **Run database migrations**
```bash
docker-compose exec app npx prisma migrate deploy
```

### Manual Docker Build

```bash
# Build the image
docker build -t wedding-photos .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e GCS_PROJECT_ID="your-project-id" \
  wedding-photos
```

## 📱 QR Code Setup

### Generating QR Codes for Tables

Each table should have a unique QR code that links to:
```
https://yourdomain.com?event=wedding2025&table=1
```

Parameters:
- `event`: Event identifier
- `table`: Table number (optional)

### Creating QR Codes

Use any QR code generator with the URL format above. Print and place on tables.

## 🔧 Configuration

### Google Cloud Storage Setup

1. **Create a GCS bucket**
```bash
gsutil mb gs://your-wedding-photos
```

2. **Create a service account**
```bash
gcloud iam service-accounts create wedding-photos-uploader
```

3. **Grant permissions**
```bash
gsutil iam ch serviceAccount:wedding-photos-uploader@project.iam.gserviceaccount.com:objectAdmin gs://your-wedding-photos
```

4. **Download service account key**
```bash
gcloud iam service-accounts keys create key.json --iam-account=wedding-photos-uploader@project.iam.gserviceaccount.com
```

### Database Schema

The system uses these main tables:
- `Event`: Wedding events
- `Guest`: Authenticated guests
- `Photo`: Uploaded photos with metadata
- `Session`: Guest sessions
- `Table`: Event tables with QR codes

## 📈 Production Considerations

### Performance Optimization
- Use CDN for static assets
- Enable image optimization
- Implement lazy loading
- Use connection pooling for database

### Security
- Enable CORS properly
- Use HTTPS in production
- Implement rate limiting
- Validate file types and sizes
- Sanitize user inputs

### Monitoring
- Set up error tracking (Sentry)
- Implement analytics
- Monitor storage usage
- Track upload success rates

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Run type checking
npm run type-check
```

## 📊 Storage Structure

Photos are organized in Google Cloud Storage:
```
wedding-photos/
  └── year=2025/
      └── month=09/
          └── day=05/
              └── uploader=John_Doe/
                  ├── IMG_001.jpg
                  ├── IMG_002.jpg
                  └── IMG_003.jpg
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with love for capturing wedding memories
- Inspired by the need for simple, effective photo collection
- Thanks to all contributors and testers

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@yourweddingphotos.com

---

Made with ❤️ for couples who want to capture every moment of their special day!
