# Deployment Guide - My Space App

## Prerequisites

- Linux VPS (Ubuntu 20.04+ recommended)
- Docker and Docker Compose installed
- Domain name (optional, for SSL)

## Installation

### 1. Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

### 2. Clone and Configure

```bash
# Clone repository (replace with your actual repo)
git clone <your-repo-url> myspace
cd myspace

# Copy environment files
cp backend/.env.example backend/.env
```

### 3. Configure Environment Variables

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://myspace:your_secure_password@postgres:5432/myspace
JWT_SECRET=your_very_secure_jwt_secret_key_change_this
PORT=5000
```

Update `docker-compose.yml` with your secure password:

```yaml
postgres:
  environment:
    POSTGRES_PASSWORD: your_secure_password
```

### 4. Deploy

```bash
# Build and start services
docker-compose up -d --build

# Run database migrations
docker-compose exec backend npm run migrate

# Check services
docker-compose ps
```

### 5. Access the Application

- Frontend: http://your-server-ip:3000
- Backend API: http://your-server-ip:5000
- Health check: http://your-server-ip:5000/api/health

## SSL/HTTPS Setup (Optional)

### Using Nginx as Reverse Proxy

1. Install Nginx:
```bash
sudo apt install nginx -y
```

2. Create Nginx config:
```nginx
# /etc/nginx/sites-available/myspace
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/myspace /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. Install SSL with Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## Maintenance

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run migrations if needed
docker-compose exec backend npm run migrate
```

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U myspace myspace > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U myspace myspace < backup_20231201.sql
```

### View Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 5000, and 5432 are available
2. **Permission issues**: Make sure user is in docker group
3. **Database connection**: Check DATABASE_URL in .env file
4. **Build failures**: Check logs with `docker-compose logs`

### Health Checks

```bash
# Check if services are running
docker-compose ps

# Test backend health
curl http://localhost:5000/api/health

# Test frontend
curl http://localhost:3000
```

## Security Recommendations

1. Change default passwords and secrets
2. Use HTTPS in production
3. Regularly update Docker images
4. Implement firewall rules
5. Monitor logs for suspicious activity
6. Regular database backups

## Scaling

For higher loads, consider:

1. Using managed database service
2. Load balancing with multiple containers
3. CDN for static assets
4. Redis for session storage
5. Monitoring and alerting

## Support

For issues:
1. Check logs: `docker-compose logs`
2. Verify configuration files
3. Ensure all services are running
4. Check network connectivity
