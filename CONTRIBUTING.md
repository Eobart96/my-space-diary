# Contributing to My Space App

Thank you for your interest in contributing to My Space App! This document provides guidelines for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/my-space.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Make your changes
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/my-space.git
cd my-space

# Copy environment file
cp .env.example .env

# Start development environment
docker-compose up -d --build

# Run database migrations
docker-compose exec backend npm run migrate
```

## Code Style

### Backend (Node.js/TypeScript)
- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Keep functions small and focused

### Frontend (React/TypeScript)
- Use functional components with hooks
- Follow the existing component structure
- Use TailwindCSS for styling
- Add proper TypeScript types
- Keep components small and reusable

## Commit Messages

Use the following format for commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

Examples:
- `feat(auth): add JWT token refresh`
- `fix(diary): resolve mood validation issue`
- `docs(readme): update deployment instructions`

## Pull Request Process

1. **Update Documentation**: If your changes affect functionality, update the README and other documentation
2. **Test Your Changes**: Ensure all tests pass and the application works as expected
3. **Single PR**: Keep changes focused on a single feature or fix
4. **No Merge Conflicts**: Resolve any merge conflicts before submitting

## Testing

### Backend Testing
```bash
# Run backend tests
docker-compose exec backend npm test

# Run tests with coverage
docker-compose exec backend npm run test:coverage
```

### Frontend Testing
```bash
# Run frontend tests
docker-compose exec frontend npm test

# Run E2E tests
docker-compose exec frontend npm run test:e2e
```

## Reporting Issues

When reporting bugs, please include:

1. **Environment**: OS, Docker version, Node.js version
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Screenshots**: If applicable, include screenshots
6. **Logs**: Any relevant error logs

## Feature Requests

For feature requests:

1. Check existing issues to avoid duplicates
2. Provide a clear description of the feature
3. Explain the use case and why it's valuable
4. Consider if it fits the project's scope

## Code Review Process

All submissions require review. Maintainers will:

1. Review code quality and style
2. Test functionality
3. Check for security implications
4. Verify documentation updates
5. Ensure tests are adequate

## Release Process

Maintainers will:

1. Update version numbers
2. Update CHANGELOG.md
3. Create Git tags
4. Publish releases

## Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow the code of conduct

## Questions?

If you have questions about contributing, feel free to:

1. Open an issue with the "question" label
2. Start a discussion in the repository
3. Contact maintainers directly

Thank you for contributing to My Space App!
