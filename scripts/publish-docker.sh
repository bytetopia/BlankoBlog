#!/bin/bash
set -e

VERSION=""
USERNAME="bytetopia"
REPO="blankoblog"

while [[ $# -gt 0 ]]; do
    case $1 in
        -v)
            VERSION="$2"
            shift 2
            ;;
        *)
            echo "Usage: $0 -v VERSION"
            exit 1
            ;;
    esac
done

if [[ -z "$VERSION" ]]; then
    echo "Usage: $0 -v VERSION"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")"

echo "Docker login required..."
docker login -u "bytetopia"

echo "Building Docker image..."
docker build -t "$USERNAME/$REPO:$VERSION" .
docker tag "$USERNAME/$REPO:$VERSION" "$USERNAME/$REPO:latest"

echo "Pushing to Docker Hub..."
docker push "$USERNAME/$REPO:$VERSION"
docker push "$USERNAME/$REPO:latest"

echo "Successfully published $USERNAME/$REPO:$VERSION and $USERNAME/$REPO:latest"