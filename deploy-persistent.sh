#!/bin/bash

# Production deployment script with persistent database storage
echo "🚀 Starting production deployment with persistent storage..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found!"
    echo "Please create .env.production with your production settings."
    exit 1
fi

# Copy production environment variables
cp .env.production .env

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove orphaned containers
docker-compose down --remove-orphans

# Create backup of existing database if it exists
if docker volume ls | grep -q myspace_postgres_data; then
    echo "💾 Creating backup of existing database..."
    docker run --rm -v myspace_postgres_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/postgres_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose build --no-cache
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Show logs
echo "📋 Showing recent logs..."
docker-compose logs --tail=50

echo "✅ Deployment complete!"
echo "🌐 Application should be available at http://your-server-ip:3000"
echo "💾 Database data is now persisted in Docker volume 'myspace_postgres_data'"
echo ""
echo "To backup database manually:"
echo "  docker run --rm -v myspace_postgres_data:/data -v \$(pwd)/backups:/backup alpine tar czf /backup/postgres_backup_\$(date +%Y%m%d_%H%M%S).tar.gz -C /data ."
echo ""
echo "To restore database:"
echo "  docker run --rm -v myspace_postgres_data:/data -v \$(pwd)/backups:/backup alpine tar xzf /backup/postgres_backup_YYYYMMDD_HHMMSS.tar.gz -C /data"
