# 🚀 Wedding Photo App - Oracle Server Deployment Guide

This guide will help you deploy the Wedding Photo App to your Oracle Cloud server using GitHub Actions CI/CD.

## 📋 Prerequisites

- Oracle Cloud server (Ubuntu/OracleLinux)
- GitHub repository with push access
- Domain name or public IP address
- Google Cloud Storage bucket for photo storage
- Twilio account for SMS OTP

## 🔧 Server Setup

### 1. Connect to Your Oracle Server

```bash
ssh opc@your-server-ip
```

### 2. Run the Server Setup Script

```bash
# Download and run the setup script
curl -o server-setup.sh https://raw.githubusercontent.com/malinanu/wedding-photo-app/main/server-setup.sh
chmod +x server-setup.sh
./server-setup.sh
```

This script will:
- Install Docker and Docker Compose
- Install Git
- Create application directory
- Configure firewall rules
- Clone the repository

## 🔑 GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add these secrets:

### Server Access
```
ORACLE_SERVER_HOST=your-server-ip-or-domain
ORACLE_SERVER_USER=opc
ORACLE_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
[Your private SSH key content]
-----END OPENSSH PRIVATE KEY-----
```

### Database & Redis
```
DATABASE_URL=postgresql://username:password@localhost:5433/wedding_photos
REDIS_URL=redis://localhost:6380
```

### Application Secrets
```
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
NEXT_PUBLIC_APP_URL=http://your-server-ip:3002
```

### Google Cloud Storage
```
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
GOOGLE_CLOUD_CREDENTIALS={
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"
}
```

### Twilio SMS
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🔐 SSH Key Setup

### 1. Generate SSH Key Pair on Your Server

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions"
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 2. Copy Private Key to GitHub Secrets

```bash
cat ~/.ssh/id_rsa
```

Copy the entire output (including BEGIN/END lines) to the `ORACLE_SSH_KEY` GitHub secret.

## 🚀 Deployment Process

### Automatic Deployment
1. Push changes to the `main` branch
2. GitHub Actions will automatically:
   - Build the application
   - Run tests
   - Deploy to your Oracle server
   - Perform health checks

### Manual Deployment
If you need to deploy manually:

```bash
# On your Oracle server
cd /opt/wedding-photo-app
git pull origin main
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d
```

## 🔍 Monitoring & Troubleshooting

### Check Application Status
```bash
# View running containers
sudo docker-compose ps

# View application logs
sudo docker-compose logs app

# View database logs
sudo docker-compose logs postgres

# View Redis logs
sudo docker-compose logs redis
```

### Application URLs
- **Main App**: `http://your-server-ip:3002`
- **Admin Dashboard**: `http://your-server-ip:3002/admin`
- **Health Check**: `http://your-server-ip:3002/api/health`

### Common Issues

**1. Port Access Issues**
```bash
# Check if ports are open
sudo ufw status
sudo netstat -tlnp | grep :3002
```

**2. Docker Permission Issues**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

**3. Database Connection Issues**
```bash
# Check database container
sudo docker-compose logs postgres
# Reset database
sudo docker-compose exec postgres psql -U postgres -d wedding_photos -c "SELECT version();"
```

## 📊 Performance Optimization

### Database Optimization
- Enable connection pooling
- Set up regular backups
- Monitor query performance

### Application Optimization
- Enable Next.js caching
- Optimize image uploads
- Set up CDN for static assets

## 🔒 Security Best Practices

1. **Firewall Configuration**
   - Only expose necessary ports
   - Use fail2ban for SSH protection

2. **SSL/TLS Setup**
   - Use Let's Encrypt for free SSL
   - Configure HTTPS redirect

3. **Database Security**
   - Use strong passwords
   - Limit database access
   - Regular security updates

## 📝 Maintenance

### Regular Tasks
- Update system packages monthly
- Monitor disk usage
- Review application logs
- Backup database weekly

### Scaling Considerations
- Use load balancer for multiple instances
- Implement Redis clustering
- Database read replicas

## 🆘 Support

For issues with deployment:
1. Check GitHub Actions logs
2. Review server logs
3. Contact 3logiq support

---

**Developed by 3logiq**  
**Developer: Malin**