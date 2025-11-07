# Development Guide

## Getting Started

### Prerequisites
- Go 1.21 or later
- Node.js 18 or later
- Git

### Quick Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd BlankoBlog

# Run the setup script
./scripts/setup.sh

# Start development servers
make dev
```

## Project Structure

```
BlankoBlog/
├── backend/                 # Go backend API
│   ├── cmd/server/         # Main application entry point
│   ├── internal/           # Private application code
│   │   ├── handlers/       # HTTP request handlers
│   │   ├── models/         # Data models and DTOs
│   │   ├── services/       # Business logic layer
│   │   └── database/       # Database connection and migrations
│   ├── pkg/                # Public packages (if needed)
│   └── Dockerfile         # Docker configuration
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── contexts/       # React contexts (auth, etc.)
│   │   └── utils/          # Utility functions
│   └── Dockerfile         # Docker configuration
├── docs/                   # Documentation
├── scripts/                # Build and deployment scripts
└── data/                   # SQLite database storage
```

## Development Workflow

### Backend Development

1. **Make changes to Go code**
2. **The server will auto-restart** (if using a file watcher like `air`)
3. **Test your changes** using the frontend or API client

Key files:
- `cmd/server/main.go` - Application entry point
- `internal/handlers/` - HTTP route handlers
- `internal/services/` - Business logic
- `internal/models/` - Data structures

### Frontend Development

1. **Make changes to React components**
2. **Vite will hot-reload** the browser automatically
3. **Test in the browser** at http://localhost:5173

Key files:
- `src/App.tsx` - Main app component with routing
- `src/pages/` - Page components
- `src/components/` - Reusable UI components
- `src/services/api.ts` - API communication layer

## Common Development Tasks

### Adding a New API Endpoint

1. **Define the model** in `backend/internal/models/`
2. **Add business logic** in `backend/internal/services/`
3. **Create handler** in `backend/internal/handlers/`
4. **Register route** in `cmd/server/main.go`
5. **Update frontend API service** in `frontend/src/services/api.ts`

### Adding a New Page

1. **Create page component** in `frontend/src/pages/`
2. **Add route** in `frontend/src/App.tsx`
3. **Update navigation** in `frontend/src/components/Navbar.tsx` if needed

### Database Changes

1. **Update models** in `backend/internal/models/`
2. **GORM will auto-migrate** on next startup
3. **For complex migrations**, add custom migration logic in `database/database.go`

## Environment Variables

Copy `.env.example` to `.env` and adjust values:

```env
# Backend
ENV=development
PORT=8080
DB_PATH=./data/blog.db
JWT_SECRET=your-secret-key-change-this-in-production

# Frontend
VITE_API_URL=http://localhost:8080
```

## Available Commands

```bash
# Development
make dev                # Start both frontend and backend
make dev-backend        # Start only backend server
make dev-frontend       # Start only frontend server

# Building
make build              # Build both applications
make clean              # Clean build artifacts

# Testing
make test               # Run all tests

# Docker
make docker-up          # Start with Docker Compose
make docker-down        # Stop Docker services

# Setup
make install-deps       # Install all dependencies
make setup              # Initial project setup
```

## Debugging Tips

### Backend Debugging
- Use `log.Printf()` for debugging
- Check backend logs for errors
- Use a REST client (like Insomnia/Postman) to test API endpoints

### Frontend Debugging
- Open browser DevTools (F12)
- Check Console tab for JavaScript errors
- Check Network tab for API request/response issues
- Use React Developer Tools browser extension

### Database Debugging
- SQLite database is stored in `data/blog.db`
- Use a SQLite viewer like DB Browser for SQLite
- Check database migrations in startup logs

## Code Style Guidelines

### Go (Backend)
- Follow standard Go formatting (use `go fmt`)
- Use meaningful variable and function names
- Add comments for public functions
- Handle errors properly
- Use dependency injection pattern

### TypeScript/React (Frontend)
- Use functional components with hooks
- Use TypeScript interfaces for type safety
- Keep components small and focused
- Use Material-UI components and theme
- Handle loading and error states

## Contributing

1. Create a new feature branch
2. Make your changes
3. Test thoroughly
4. Create a pull request
5. Ensure all checks pass

## Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 8080 and 5173
lsof -ti:8080 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Database Issues
```bash
# Reset database
rm data/blog.db
make dev-backend  # Will recreate with sample data
```

### Dependencies Issues
```bash
# Clean and reinstall
cd backend && go clean -modcache && go mod tidy
cd ../frontend && rm -rf node_modules && npm install
```