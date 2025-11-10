#!/bin/bash

# Quick build script for BlankoBlog
# Usage: ./scripts/build.sh [tag]

set -e

TAG="${1:-latest}"
IMAGE_NAME="blankoblog:$TAG"

echo "Building BlankoBlog Docker image: $IMAGE_NAME"

# Change to project root
cd "$(dirname "$0")/.."

# Build the image
docker build -t "$IMAGE_NAME" .

echo "Build completed successfully!"
echo "To run: docker run -p 8080:8080 -v \$(pwd)/data:/app/data $IMAGE_NAME"