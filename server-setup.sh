#!/bin/bash
# Oracle Server Setup Script for Wedding Photo App
# Run this script on your Oracle server to prepare for deployment

set -e

echo "🚀 Setting up Oracle server for Wedding Photo App..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "✅ Docker is already installed"
fi

# Install Docker Compose if not already installed
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose is already installed"
fi

# Install Git if not already installed
if ! command -v git &> /dev/null; then
    echo "📡 Installing Git..."
    sudo apt install -y git
else
    echo "✅ Git is already installed"
fi

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/wedding-photo-app
sudo chown -R $USER:$USER /opt/wedding-photo-app

# Clone the repository
echo "📥 Cloning repository..."
cd /opt
if [ -d "wedding-photo-app" ]; then
    cd wedding-photo-app
    git pull origin main
else
    git clone https://github.com/malinanu/wedding-photo-app.git
    cd wedding-photo-app
fi

# Create necessary directories
echo "📁 Creating required directories..."
mkdir -p uploads
mkdir -p logs

# Set up firewall rules (adjust ports as needed)
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 3002/tcp    # Application
sudo ufw allow 5432/tcp    # PostgreSQL (if external access needed)
sudo ufw allow 6379/tcp    # Redis (if external access needed)

# Enable firewall
sudo ufw --force enable

echo "✅ Oracle server setup completed!"
echo ""
echo "Next steps:"
echo "1. Configure GitHub Secrets in your repository:"
echo "   - ORACLE_SERVER_HOST: Your Oracle server IP/domain"
echo "   - ORACLE_SERVER_USER: SSH username (e.g., opc)"
echo "   - ORACLE_SSH_KEY: Private SSH key for server access"
echo "   - DATABASE_URL, REDIS_URL, JWT_SECRET, etc."
echo ""
echo "2. Generate SSH key pair if you haven't already:"
echo "   ssh-keygen -t rsa -b 4096 -C 'github-actions'"
echo "   cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys"
echo "   # Copy private key content to GitHub Secret ORACLE_SSH_KEY"
echo ""
echo "3. Push changes to GitHub to trigger deployment"
echo ""
echo "🎉 Server is ready for CI/CD deployment!"