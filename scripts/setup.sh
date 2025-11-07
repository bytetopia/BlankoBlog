#!/bin/bash

# Development setup script for Blanko Blog

echo "🚀 Setting up Blanko Blog development environment..."

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.21 or later."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data

# Setup backend
echo "🔧 Setting up backend..."
cd backend
go mod tidy
cd ..

# Setup frontend
echo "🎨 Setting up frontend..."
cd frontend
npm install
cd ..

echo "✨ Setup complete!"
echo ""
echo "🛠️  Development commands:"
echo "  make dev          - Start both backend and frontend"
echo "  make dev-backend  - Start only backend"
echo "  make dev-frontend - Start only frontend"
echo "  make docker-up    - Start with Docker Compose"
echo ""
echo "🌐 URLs:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8080"
echo ""
echo "👤 Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"