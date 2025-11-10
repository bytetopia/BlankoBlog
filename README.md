# Blanko Blog System

Blanko is a simple, lightweight blog system powered by React and Go.

> [!NOTE]
> Dev work in progress! Not ready for production yet.

## Project Structure

```
BlankoBlog/
├── backend/                 # Go backend API
│   ├── cmd/                # Application entrypoints
│   ├── internal/           # Private application code
│   │   ├── handlers/       # HTTP handlers
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── database/       # Database layer
│   ├── pkg/                # Public packages
│   └── migrations/         # Database migrations
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── docs/                   # Documentation
├── scripts/                # Build and deployment scripts
└── data/                   # SQLite database storage
```

## Tech Stack

### Backend
- **Language**: Go 1.21+
- **Framework**: Gin (HTTP router)
- **Database**: SQLite with GORM
- **Authentication**: JWT

### Frontend
- **Framework**: React 18+
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router
- **HTTP Client**: Axios
- **Build Tool**: Vite

## Features

### For All Users
- ✅ Browse blog posts
- ✅ Read individual blog posts
- ✅ Responsive design

### For Admin
- ✅ Admin login
- ✅ Create new blog posts
- ✅ Edit existing blog posts
- ✅ Delete blog posts

## Development Setup

### Prerequisites
- Go 1.21+
- Node.js 18+
- Docker & Docker Compose (optional)

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/bytetopia/BlankoBlog.git
   cd BlankoBlog
   ```

2. **Build and run with Docker**
   ```bash
   # Quick build
   ./scripts/build.sh

   # Or use docker-compose
   docker-compose up --build
   ```

   The application will be available at `http://localhost:8080`

3. **Build and publish to Docker Hub**
   ```bash
   # Build only
   ./scripts/build-and-publish.sh

   # Build and push to Docker Hub
   ./scripts/build-and-publish.sh --push

   # Custom tag and push
   ./scripts/build-and-publish.sh --tag v1.0.0 --push

   # Custom repository
   ./scripts/build-and-publish.sh --registry myuser/blankoblog --push
   ```

### Manual Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bytetopia/BlankoBlog.git
   cd BlankoBlog
   ```

2. **Backend Setup**
   ```bash
   cd backend
   go mod tidy
   go run cmd/server/main.go
   ```

3. **Frontend Setup (in a separate terminal)**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   For development, the frontend runs on `http://localhost:5173` and the backend on `http://localhost:8080`

### Docker Architecture

The project uses a single Docker image that:
1. Builds the React frontend using Node.js
2. Copies the frontend build artifacts to the Go backend's static directory
3. Builds the Go backend application
4. Serves both frontend and API from a single container on port 8080

This unified approach simplifies deployment and reduces the number of containers needed.

### API Endpoints

- `GET /api/posts` - Get all blog posts
- `GET /api/posts/:id` - Get specific blog post
- `POST /api/auth/login` - Admin login
- `POST /api/posts` - Create new post (admin)
- `PUT /api/posts/:id` - Update post (admin)
- `DELETE /api/posts/:id` - Delete post (admin)

## Development Guidelines

- Follow Go best practices and project layout standards
- Use React functional components with hooks
- Keep components small and focused
- Write clean, readable code with proper error handling
- Use TypeScript for better type safety (frontend)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## License

See LICENSE file for details.

