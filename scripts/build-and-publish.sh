#!/bin/bash

# BlankoBlog Docker Build and Publish Script
# Usage: ./scripts/build-and-publish.sh [OPTIONS]
# Options:
#   -t, --tag TAG         Set custom tag (default: latest)
#   -p, --push            Push to Docker Hub after building
#   -r, --registry REPO   Docker Hub repository (default: blankoblog)
#   -h, --help           Show this help message

set -e

# Default values
TAG="latest"
PUSH=false
REGISTRY="blankoblog"
DOCKERFILE="Dockerfile"
BUILD_CONTEXT="."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show help
show_help() {
    cat << EOF
BlankoBlog Docker Build and Publish Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -t, --tag TAG         Set custom tag (default: latest)
    -p, --push            Push to Docker Hub after building
    -r, --registry REPO   Docker Hub repository (default: blankoblog)
    -h, --help           Show this help message

EXAMPLES:
    # Build with default settings
    $0

    # Build and push to Docker Hub
    $0 --push

    # Build with custom tag and push
    $0 --tag v1.0.0 --push

    # Build with custom repository and push
    $0 --registry myuser/blankoblog --push

PREREQUISITES:
    - Docker must be installed and running
    - For pushing: You must be logged in to Docker Hub (docker login)

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -p|--push)
            PUSH=true
            shift
            ;;
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root
cd "$PROJECT_ROOT"

# Validate we're in the right directory
if [[ ! -f "Dockerfile" ]] || [[ ! -f "docker-compose.yml" ]]; then
    print_error "Please run this script from the project root or ensure Dockerfile exists"
    exit 1
fi

# Generate image name
IMAGE_NAME="${REGISTRY}:${TAG}"

print_info "Starting Docker build process..."
print_info "Image name: $IMAGE_NAME"
print_info "Build context: $BUILD_CONTEXT"
print_info "Dockerfile: $DOCKERFILE"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build the Docker image
print_info "Building Docker image..."
if docker build -t "$IMAGE_NAME" -f "$DOCKERFILE" "$BUILD_CONTEXT"; then
    print_success "Docker image built successfully: $IMAGE_NAME"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Show image size
IMAGE_SIZE=$(docker images "$IMAGE_NAME" --format "{{.Size}}")
print_info "Image size: $IMAGE_SIZE"

# Push to registry if requested
if [[ "$PUSH" == true ]]; then
    print_info "Pushing image to Docker Hub..."
    
    # Check if user is logged in to Docker Hub
    if ! docker info 2>/dev/null | grep -q "Username:"; then
        print_warning "You may not be logged in to Docker Hub."
        read -p "Do you want to login now? (y/N): " -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker login
        else
            print_error "Please login to Docker Hub first: docker login"
            exit 1
        fi
    fi
    
    if docker push "$IMAGE_NAME"; then
        print_success "Image pushed successfully to Docker Hub: $IMAGE_NAME"
        print_info "You can now pull the image with: docker pull $IMAGE_NAME"
    else
        print_error "Failed to push image to Docker Hub"
        exit 1
    fi
fi

print_success "Build process completed!"

# Show usage instructions
echo ""
print_info "To run the container locally:"
echo "  docker run -p 8080:8080 -v \$(pwd)/data:/app/data $IMAGE_NAME"
echo ""
print_info "To run with docker-compose:"
echo "  docker-compose up"
echo ""

if [[ "$PUSH" == true ]]; then
    print_info "To pull and run from Docker Hub:"
    echo "  docker pull $IMAGE_NAME"
    echo "  docker run -p 8080:8080 -v \$(pwd)/data:/app/data $IMAGE_NAME"
fi