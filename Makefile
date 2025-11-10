# Development Environment

## Local Development Commands

.PHONY: help dev build clean test docker-up docker-down

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

dev: ## Start development servers (backend and frontend)
	@echo "Starting development environment..."
	@$(MAKE) -j2 dev-backend dev-frontend

dev-backend: ## Start backend development server
	@echo "Starting backend server..."
	cd backend && go run cmd/server/main.go

dev-frontend: ## Start frontend development server
	@echo "Starting frontend server..."
	cd frontend && npm run dev

build: ## Build both backend and frontend for production
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "Copying frontend artifacts to backend..."
	rm -rf backend/static
	cp -r frontend/dist backend/static
	@echo "Building backend..."
	cd backend && go build -o bin/server cmd/server/main.go

build-prod: build ## Alias for build (for production)

build-frontend: ## Build only frontend
	@echo "Building frontend..."
	cd frontend && npm run build

build-backend: ## Build only backend
	@echo "Building backend..."
	cd backend && go build -o bin/server cmd/server/main.go

test: ## Run tests
	@echo "Running backend tests..."
	cd backend && go test ./...
	@echo "Running frontend tests..."
	cd frontend && npm test

clean: ## Clean build artifacts
	@echo "Cleaning up..."
	rm -rf backend/bin
	rm -rf backend/static
	rm -rf frontend/build
	rm -rf frontend/dist

docker-up: ## Start services with Docker Compose
	docker-compose up --build

docker-down: ## Stop Docker Compose services
	docker-compose down

install-deps: ## Install dependencies for both backend and frontend
	@echo "Installing backend dependencies..."
	cd backend && go mod tidy
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

setup: install-deps ## Initial project setup
	@echo "Creating data directory..."
	mkdir -p data
	@echo "Setup complete! Run 'make dev' to start development."