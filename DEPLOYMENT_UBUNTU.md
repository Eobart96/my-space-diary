# Ubuntu Deployment Guide - My Space App

## Quick Start

### 1. Clone Repository
```bash
git clone <your-repo-url> myspace
cd myspace
```

### 2. One-Click Deployment
```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Manual Deployment (Alternative)

#### Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configure firewall
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

#### Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

#### Deploy Application
```bash
# Development deployment
docker-compose up -d --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker-compose exec backend npm run migrate
```

## Environment Variables

Create `.env` file with:

```env
# Database Configuration
POSTGRES_PASSWORD=your_secure_password_here

# JWT Secret (generate with: openssl rand -base64 64)
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# Domain Configuration
DOMAIN_NAME=your-domain.com

# SSL Email (for Let's Encrypt)
SSL_EMAIL=admin@your-domain.com

# Environment
NODE_ENV=production
```

## Deployment Options

### Development (docker-compose.yml)
- Hot reload enabled
- Development ports exposed
- Volume mounts for live coding

### Production (docker-compose.prod.yml)
- Optimized builds
- Nginx reverse proxy
- Security headers
- No volume mounts
- Health checks

## Access URLs

- **Development**: 
  - Frontend: http://localhost:3000
  - Backend: http://localhost:5000

- **Production**:
  - Application: http://your-server-ip
  - API: http://your-server-ip/api/
  - Health: http://your-server-ip/health

## Management Commands

### View Logs
```bash
# Development
docker-compose logs

# Production
docker-compose -f docker-compose.prod.yml logs
```

### Restart Services
```bash
# Development
docker-compose restart

# Production
docker-compose -f docker-compose.prod.yml restart
```

### Update Application
```bash
# Using update script
./update.sh

# Manual update
git pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend npm run migrate
```

### Backup Database
```bash
# Using backup script
./backup.sh

# Manual backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U myspace myspace > backup_$(date +%Y%m%d).sql
```

## SSL/HTTPS Setup

### Option 1: Let's Encrypt (Recommended)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Option 2: Self-Signed Certificate
```bash
# Create SSL directory
mkdir -p nginx/ssl

# Generate certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/nginx.key \
  -out nginx/ssl/nginx.crt
```

## Security Recommendations

1. **Change Default Passwords**: Always change default passwords
2. **Use HTTPS**: Enable SSL in production
3. **Firewall**: Keep UFW enabled and configured
4. **Regular Updates**: Keep Docker and system packages updated
5. **Backups**: Set up regular database backups
6. **Monitoring**: Monitor logs and service health

## Troubleshooting

### Common Issues

1. **Permission Denied**: 
   ```bash
   sudo usermod -aG docker $USER
   # Log out and log back in
   ```

2. **Port Conflicts**:
   ```bash
   sudo netstat -tulpn | grep :80
   sudo systemctl stop nginx  # If conflicting
   ```

3. **Database Connection**:
   ```bash
   # Check environment variables
   cat .env
   
   # Test database connection
   docker-compose exec postgres psql -U myspace -d myspace
   ```

4. **Build Failures**:
   ```bash
   # Clean build
   docker-compose down
   docker system prune -f
   docker-compose up -d --build
   ```

### Health Checks

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Test backend health
curl http://localhost/api/health

# Test frontend
curl http://localhost

# Check database
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U myspace
```

## Performance Optimization

### Production Optimizations
1. **Database**: Use managed PostgreSQL for high loads
2. **CDN**: Implement CDN for static assets
3. **Caching**: Add Redis for session storage
4. **Load Balancing**: Multiple containers with load balancer
5. **Monitoring**: Add Prometheus/Grafana

### Resource Limits
Add to `docker-compose.prod.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Scaling

### Horizontal Scaling
```bash
# Scale backend
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale frontend
docker-compose -f docker-compose.prod.yml up -d --scale frontend=2
```

### Database Scaling
- Read replicas for read-heavy workloads
- Connection pooling
- Database sharding for large datasets

## Support

For issues:
1. Check logs: `docker-compose logs`
2. Verify configuration: Check `.env` file
3. Test connectivity: `curl http://localhost/health`
4. Check resources: `docker stats`
