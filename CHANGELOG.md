# Changelog

All notable changes to My Space App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Production Docker deployment configuration
- Ubuntu deployment script with automation
- Nginx reverse proxy configuration
- SSL/HTTPS setup documentation
- System requirements and resource usage documentation
- GitHub repository files (LICENSE, CONTRIBUTING.md, CHANGELOG.md)
- Environment variable templates
- Automated backup and update scripts

### Changed
- Updated docker-compose.yml to support environment variables
- Enhanced frontend nginx configuration for production
- Improved deployment documentation

### Security
- Added security headers configuration
- Environment-based secret management
- Firewall configuration recommendations

## [1.0.0] - 2026-01-26

### Added
- Diary module with CRUD operations
- Nutrition module with meal tracking
- Mood tracking (1-5 scale)
- JWT authentication system
- PostgreSQL database with proper indexing
- React frontend with TypeScript
- TailwindCSS styling
- Vite build system
- Docker containerization
- Responsive UI design
- Health check endpoints
- Database migration system
- API documentation
- Basic deployment guide

### Features
- **Diary Module**
  - Create, read, update, delete diary entries
  - Mood tracking with visual indicators
  - Date-based organization
  - Text entry with validation

- **Nutrition Module**
  - Meal tracking with calories
  - Macronutrient tracking (proteins, fats, carbs)
  - Daily nutrition summaries
  - Time-based meal organization

- **Authentication**
  - User registration and login
  - JWT token-based authentication
  - Secure password hashing
  - Token expiration handling

- **Database**
  - PostgreSQL with optimized queries
  - Proper foreign key relationships
  - Database migrations
  - Indexing for performance

- **Frontend**
  - Modern React with hooks
  - TypeScript for type safety
  - TailwindCSS for responsive design
  - Client-side state management
  - Form validation
  - Error handling

### Technical Stack
- Backend: Node.js 18 + Express + TypeScript
- Frontend: React 18 + TypeScript + Vite
- Database: PostgreSQL 15
- Authentication: JWT tokens
- Styling: TailwindCSS
- Deployment: Docker + docker-compose

### Security
- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS configuration
- Environment variable management

## [0.9.0] - 2026-01-20

### Added
- Initial project structure
- Basic database schema
- Core API endpoints
- Frontend components
- Docker configuration

### Changed
- Project initialization

---

## Version Format

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Release Process

1. Update version numbers in package.json files
2. Update CHANGELOG.md
3. Create Git tag
4. Create GitHub release
5. Deploy to production
