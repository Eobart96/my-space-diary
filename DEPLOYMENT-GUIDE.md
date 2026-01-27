# Backend Database Configuration Guide

## 📋 Current Status Analysis

✅ **Good news**: Your backend is already properly configured to use PostgreSQL only!
- No SQLite or local database references found
- Uses `pg` library for PostgreSQL connection
- Proper environment variable configuration
- Docker containers already configured correctly

## 🔧 Configuration Files

### 1. Backend Environment Variables

**File: `backend/.env.example`**
```env
# Database Configuration (for local development)
DATABASE_URL=postgresql://myspace:myspace_password@localhost:5432/myspace

# JWT Secret (generate with: openssl rand -base64 64)
JWT_SECRET=your_jwt_secret_key_change_in_production

# Server Configuration
PORT=5000
NODE_ENV=development

# For Docker/Production - these will be set by docker-compose
# DATABASE_URL=postgresql://myspace:${POSTGRES_PASSWORD}@postgres:5432/myspace
# JWT_SECRET=${JWT_SECRET}
# PORT=${PORT:-5000}
# NODE_ENV=${NODE_ENV:-production}
```

### 2. Docker Compose Configuration

**File: `docker-compose.yml` (already correct)**
```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile.prod
  environment:
    DATABASE_URL: postgresql://myspace:${POSTGRES_PASSWORD:-myspace_password}@postgres:5432/myspace
    JWT_SECRET: ${JWT_SECRET:-your_jwt_secret_key_change_in_production}
    PORT: 5000
    NODE_ENV: ${NODE_ENV:-production}
  depends_on:
    postgres:
      condition: service_healthy
  restart: unless-stopped
  networks:
    - app-network
```

### 3. Enhanced Dockerfile

**File: `backend/Dockerfile.prod`**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node dist/healthcheck.js || exit 1

# Start the application
CMD ["npm", "start"]
```

## 🚀 Rebuild and Migration Steps

### Step 1: Stop Current Services
```bash
docker-compose down
```

### Step 2: Clean Up (Optional - for fresh start)
```bash
# Remove old images and volumes
docker system prune -f
docker volume prune -f
```

### Step 3: Rebuild Backend
```bash
# Build new backend image
docker-compose build --no-cache backend
```

### Step 4: Start Services
```bash
# Start all services
docker-compose up -d
```

### Step 5: Run Migrations
```bash
# Run database migrations
docker-compose exec backend npm run migrate
```

### Step 6: Verify Setup
```bash
# Check container status
docker-compose ps

# Check backend logs
docker-compose logs backend

# Test health endpoint
curl http://localhost:3000/api/health
```

## 🧪 Testing Database Connection

### 1. Test Direct Database Connection
```bash
# Connect to PostgreSQL container
docker-compose exec postgres psql -U myspace -d myspace

# Inside psql, check tables
\dt
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM diary_entries;
SELECT COUNT(*) FROM nutrition_entries;
```

### 2. Test Backend API
```bash
# Test health check
curl http://localhost:3000/api/health

# Test database connection through API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## 📱 Frontend Configuration Note

**Important**: Frontend should call backend API via relative paths:

```typescript
// frontend/src/lib/api.ts
const API_BASE_URL = '/api';  // ✅ Correct - uses Nginx proxy
// NOT: const API_BASE_URL = 'http://localhost:5000/api';
```

This ensures frontend works correctly through Nginx proxy at `http://SERVER_IP:3000/api`.

## 🔍 Environment Variables Validation

The backend now includes validation for required environment variables:

```typescript
// backend/src/index.ts
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}
```

## 🛠️ Production Deployment Checklist

- [ ] Set strong `POSTGRES_PASSWORD` in `.env`
- [ ] Generate secure `JWT_SECRET` with `openssl rand -base64 64`
- [ ] Set `NODE_ENV=production`
- [ ] Configure SSL certificates for HTTPS
- [ ] Set up database backups
- [ ] Configure monitoring and logging

## 🐛 Troubleshooting

### Issue: "DATABASE_URL environment variable is required"
**Solution**: Ensure environment variables are properly set in docker-compose.yml

### Issue: Database connection failed
**Solution**: 
1. Check PostgreSQL container is running: `docker-compose ps postgres`
2. Verify database credentials
3. Check network connectivity between containers

### Issue: Migration failed
**Solution**:
1. Ensure PostgreSQL is healthy: `docker-compose exec postgres pg_isready -U myspace`
2. Run migrations manually: `docker-compose exec backend npm run migrate`

## ✅ Verification Commands

```bash
# Verify all services are running
docker-compose ps

# Verify database connectivity
docker-compose exec backend npm run migrate

# Verify API is working
curl http://localhost:3000/api/health

# Verify data persistence across restarts
docker-compose restart backend
curl http://localhost:3000/api/health
```

Your backend is now fully configured to use only PostgreSQL with proper Docker integration!
