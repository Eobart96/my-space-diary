#!/bin/bash

# My Space Ubuntu Deployment Script
# This script automates the deployment of My Space app on Ubuntu server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git unzip htop

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_status "Docker installed successfully"
else
    print_warning "Docker is already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully"
else
    print_warning "Docker Compose is already installed"
fi

# Install UFW firewall
print_status "Configuring firewall..."
sudo apt install -y ufw
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /opt/myspace
sudo chown $USER:$USER /opt/myspace

# Navigate to application directory
cd /opt/myspace

# Clone repository (if not already cloned)
if [ ! -d ".git" ]; then
    print_status "Cloning repository..."
    # Replace with your actual repository URL
    read -p "Enter your Git repository URL: " REPO_URL
    git clone "$REPO_URL" .
else
    print_status "Repository already exists, pulling latest changes..."
    git pull origin main
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p nginx/sites-available nginx/sites-enabled nginx/ssl nginx/logs backups

# Generate environment file
print_status "Setting up environment variables..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
# Database Configuration
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# JWT Secret
JWT_SECRET=$(openssl rand -base64 64)

# Domain Configuration
DOMAIN_NAME=localhost

# SSL Email (for Let's Encrypt)
SSL_EMAIL=admin@localhost
EOF
    print_status "Environment file created with secure random values"
else
    print_warning "Environment file already exists"
fi

# Load environment variables
source .env

# Create production Dockerfiles
print_status "Creating production Dockerfiles..."

# Backend production Dockerfile
cat > backend/Dockerfile.prod << EOF
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

USER nodejs

EXPOSE 5000

CMD ["npm", "start"]
EOF

# Frontend production Dockerfile
cat > frontend/Dockerfile.prod << EOF
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

# Create Nginx configuration
print_status "Creating Nginx configuration..."

# Main nginx.conf
cat > nginx/nginx.conf << EOF
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

# Site configuration
cat > nginx/sites-available/myspace << EOF
server {
    listen 80;
    server_name \$DOMAIN_NAME;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable site
ln -sf /opt/myspace/nginx/sites-available/myspace /opt/myspace/nginx/sites-enabled/

# Frontend nginx.conf
cat > frontend/nginx.conf << EOF
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Create backup script
print_status "Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash

# Backup script for My Space application
BACKUP_DIR="/opt/myspace/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Database backup
echo "Creating database backup..."
docker-compose -f /opt/myspace/docker-compose.prod.yml exec -T postgres pg_dump -U myspace myspace > $BACKUP_DIR/database_$DATE.sql

# Compress backup
echo "Compressing backup..."
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR database_$DATE.sql

# Remove uncompressed SQL file
rm $BACKUP_DIR/database_$DATE.sql

# Keep only last 7 backups
echo "Cleaning old backups..."
find $BACKUP_DIR -name "backup_*.tar.gz" -type f -mtime +7 -delete

echo "Backup completed: backup_$DATE.tar.gz"
EOF

chmod +x backup.sh

# Create update script
print_status "Creating update script..."
cat > update.sh << 'EOF'
#!/bin/bash

# Update script for My Space application
cd /opt/myspace

echo "Pulling latest changes..."
git pull origin main

echo "Rebuilding and restarting services..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

echo "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

echo "Update completed successfully!"
EOF

chmod +x update.sh

# Build and start services
print_status "Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Check service health
print_status "Checking service health..."
docker-compose -f docker-compose.prod.yml ps

# Display deployment information
print_status "Deployment completed successfully!"
echo ""
echo "============================================"
echo "My Space Application Deployment Summary"
echo "============================================"
echo "Application URL: http://$(hostname -I | awk '{print $1}')"
echo "Backend API: http://$(hostname -I | awk '{print $1}')/api/"
echo "Health Check: http://$(hostname -I | awk '{print $1}')/health"
echo ""
echo "Useful Commands:"
echo "- View logs: docker-compose -f docker-compose.prod.yml logs"
echo "- Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "- Create backup: ./backup.sh"
echo "- Update application: ./update.sh"
echo ""
echo "Configuration files:"
echo "- Environment: /opt/myspace/.env"
echo "- Nginx config: /opt/myspace/nginx/"
echo "- Docker Compose: /opt/myspace/docker-compose.prod.yml"
echo ""
echo "Next steps:"
echo "1. Configure your domain name in .env file"
echo "2. Set up SSL certificate with Let's Encrypt"
echo "3. Configure regular backups"
echo "============================================"

print_warning "Please log out and log back in to apply Docker group changes"
