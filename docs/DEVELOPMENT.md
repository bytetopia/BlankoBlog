# Development Guide

## Getting Started

### Prerequisites
- Go 1.21 or later
- Node.js 18 or later
- Docker (for containerized development)
- Git

### Quick Setup

#### With Docker (Recommended)
```bash
# Clone the repository
git clone <your-repo-url>
cd BlankoBlog

# Build and run with docker-compose
docker-compose up --build

# Or build manually
./scripts/build.sh
docker run -p 8080:8080 -v $(pwd)/data:/app/data blankoblog:latest
```

#### Manual Development
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
│   └── pkg/                # Public packages (if needed)
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── contexts/       # React contexts (auth, etc.)
│   │   └── utils/          # Utility functions
│   └── Dockerfile         # Frontend-only Docker configuration (legacy)
├── docs/                   # Documentation
├── scripts/                # Build and deployment scripts
├── data/                   # SQLite database storage
├── Dockerfile             # Unified production Docker configuration
└── .dockerignore          # Docker ignore file
```

## Docker Architecture

The project now uses a **unified Docker image** that combines both frontend and backend:

### Multi-stage Build Process
1. **Frontend Stage**: Builds the React application using Node.js
2. **Backend Stage**: Builds the Go application and copies frontend assets
3. **Final Stage**: Creates minimal Alpine-based image with the complete application

### Benefits
- Single container deployment
- Simplified orchestration
- Reduced resource usage
- Faster startup times
- Self-contained application

## Build Scripts

The project includes several scripts to streamline the build and deployment process:

### `scripts/build.sh`
Quick local build script:
```bash
# Build with default tag
./scripts/build.sh

# Build with custom tag
./scripts/build.sh v1.0.0
```

### `scripts/build-and-publish.sh`
Comprehensive build and publish script with multiple options:
```bash
# Show help
./scripts/build-and-publish.sh --help

# Build only
./scripts/build-and-publish.sh

# Build and push to Docker Hub
./scripts/build-and-publish.sh --push

# Build with custom tag and push
./scripts/build-and-publish.sh --tag v1.0.0 --push

# Use custom Docker Hub repository
./scripts/build-and-publish.sh --registry myuser/blankoblog --push
```

#### Script Features
- ✅ Docker availability check
- ✅ Docker Hub authentication verification  
- ✅ Colored output for better visibility
- ✅ Comprehensive error handling
- ✅ Image size reporting
- ✅ Usage instructions after build
- ✅ Flexible tagging options

### Manual Docker Commands
```bash
# Build the image
docker build -t blankoblog:latest .

# Run locally
docker run -p 8080:8080 -v $(pwd)/data:/app/data blankoblog:latest

# Use docker-compose
docker-compose up --build
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