# Frontend build stage
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend source code
COPY frontend/ ./

# Build the frontend
RUN npm run build

# Backend build stage
FROM golang:1.24-alpine AS backend-builder

WORKDIR /app

# Install build dependencies for CGO
RUN apk --no-cache add gcc musl-dev sqlite-dev

# Copy go mod and sum files
COPY backend/go.mod backend/go.sum ./

# Download dependencies
RUN go mod download

# Copy backend source code
COPY backend/ ./

# Copy built frontend files to static directory
COPY --from=frontend-builder /app/frontend/dist ./static

# Copy CSS templates to static directory
COPY backend/templates/css/post-style.css ./static/css/

# Build the Go application
RUN CGO_ENABLED=1 GOOS=linux go build -o main cmd/server/main.go

# Final stage
FROM alpine:latest

# Install sqlite for CGO support and other necessary packages
RUN apk --no-cache add ca-certificates sqlite tzdata

WORKDIR /app

# Copy the binary from backend builder stage
COPY --from=backend-builder /app/main ./

# Copy static files from backend builder stage
COPY --from=backend-builder /app/static ./static

# Copy templates directory for HTML rendering
COPY --from=backend-builder /app/templates ./templates

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 8080

CMD ["./main"]