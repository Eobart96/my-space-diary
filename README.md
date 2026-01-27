# My Space - Diary & Nutrition App

Production-ready web application with diary and nutrition tracking modules, now with product management system.

## Technology Stack

- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Frontend**: React + TypeScript + TailwindCSS + Vite
- **Authentication**: JWT tokens
- **Database**: PostgreSQL with proper indexing
- **Storage**: localStorage for client-side data persistence
- **Deployment**: Docker + docker-compose

## Quick Start

```bash
# Clone
git clone <your-repo-url>
cd myspace

# Configure env
cp .env.example .env

# Run (production-like, works anywhere)
docker-compose up -d --build
```

Access at http://localhost:3000

## Development (Hot Reload)

```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

Development access:
- Frontend: http://localhost:3001
- Backend API: http://localhost:5000

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 10 GB free space
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 20 GB free space
- **OS**: Ubuntu 20.04+ (for production)

### Resource Usage (Runtime)
- **PostgreSQL**: ~200-500 MB RAM
- **Backend**: ~100-300 MB RAM
- **Frontend**: ~50-150 MB RAM
- **Total**: ~350-950 MB RAM (typical usage)

## Deployment Options

### Development (Local)
```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

### Production (Ubuntu Server)
```bash
# One-click deployment
chmod +x deploy.sh
./deploy.sh

# Or manual deployment
docker-compose -f docker-compose.prod.yml up -d --build
```

See [DEPLOYMENT_UBUNTU.md](DEPLOYMENT_UBUNTU.md) for detailed deployment guide.

## Project Structure

```
├── backend/          # Node.js API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── models/
│   └── package.json
├── frontend/         # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   └── types/
│   └── package.json
├── docker-compose.yml
├── DATABASE_SCHEMA.md
├── DEPLOYMENT.md
└── README.md
```

## Features

### 📔 **Diary Module**
- CRUD diary entries with mood tracking (1-5 scale)
- Time-based entries with search and filtering
- Responsive diary interface with mood visualization
- LocalStorage persistence for offline functionality

### 🥗 **Nutrition Module**
- Track meals with calories and macronutrients (proteins, fats, carbs)
- Daily nutrition summary with visual indicators
- Time-based meal tracking with search functionality
- **NEW**: Product management system

### 🏷️ **Product Management System**
- Add and manage food products
- Product assessment: Positive, Neutral, or Negative
- Add detailed notes for each product
- Visual indicators with color-coded assessment badges
- Persistent storage in localStorage

### 🌐 **Internationalization**
- Multi-language support (English/Russian)
- Dynamic language switching
- Localized UI elements and content

### 🎨 **User Interface**
- Modern glassmorphism design with gradient backgrounds
- Responsive layout for desktop and mobile devices
- Smooth animations and transitions
- Intuitive navigation with App Launcher

### 🔐 **Authentication**
- Simple email/password login with JWT tokens
- Secure session management
- User-specific data isolation

## Database Schema

- **users**: id, email, password_hash, created_at
- **diary_entries**: id, user_id, date, time, text, mood, timestamps
- **nutrition_entries**: id, user_id, date, time, title, calories, proteins, fats, carbs, timestamps

See `DATABASE_SCHEMA.md` for detailed schema information.

## API Endpoints

- **Auth**: POST /api/auth/register, POST /api/auth/login
- **Diary**: GET/POST/PUT/DELETE /api/diary
- **Nutrition**: GET/POST/PUT/DELETE /api/nutrition, GET /api/nutrition/summary

## Development

```bash
# Frontend development
cd frontend && npm run dev

# Backend development  
cd backend && npm run dev

# Full stack with Docker
docker-compose up -d
```

## Deployment

See `DEPLOYMENT.md` for Linux VPS deployment instructions.

## Recent Updates

### v1.0 - Product Management System
- ✅ Added comprehensive product management to Nutrition module
- ✅ Implemented localStorage persistence for products
- ✅ Added product assessment system (Positive/Neutral/Negative)
- ✅ Enhanced UI with color-coded product indicators
- ✅ Improved internationalization support
- ✅ Fixed responsive design issues
- ✅ Optimized performance and user experience
