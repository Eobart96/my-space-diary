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
# Clone and run
docker-compose up -d
```

Access at http://localhost:3000

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
