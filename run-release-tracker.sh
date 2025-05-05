#!/bin/bash
set -e

# Default values
NGINX_DIR="/var/www/html"
DOCKER_NETWORK="docker-services_dniomp"
IMAGE_NAME="utcrash/release-tracker"
CONTAINER_NAME="release-tracker"
MONGODB_URI="mongodb://mongodb:27017/dnio-release-tracker"
JIRA_EMAIL="utkarsh@datanimbus.com"
JIRA_API_TOKEN="YOUR_JIRA_API_TOKEN_HERE"

# Help message
function show_help {
    echo "Usage: $0 [OPTIONS]"
    echo "Run the Release Tracker container with appropriate settings"
    echo ""
    echo "Options:"
    echo "  -h, --help                 Show this help message"
    echo "  -n, --network NAME         Docker network name (default: $DOCKER_NETWORK)"
    echo "  --nginx-dir DIR            Nginx HTML directory (default: $NGINX_DIR)"
    echo "  --mongodb-uri URI          MongoDB URI (default: $MONGODB_URI)"
    echo "  --jira-email EMAIL         JIRA email (default: $JIRA_EMAIL)"
    echo "  --jira-token TOKEN         JIRA API token"
    echo "  --image-name NAME          Docker image name (default: $IMAGE_NAME)"
    echo "  --container-name NAME      Container name (default: $CONTAINER_NAME)"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
    -h | --help)
        show_help
        exit 0
        ;;
    -n | --network)
        DOCKER_NETWORK="$2"
        shift 2
        ;;
    --nginx-dir)
        NGINX_DIR="$2"
        shift 2
        ;;
    --mongodb-uri)
        MONGODB_URI="$2"
        shift 2
        ;;
    --jira-email)
        JIRA_EMAIL="$2"
        shift 2
        ;;
    --jira-token)
        JIRA_API_TOKEN="$2"
        shift 2
        ;;
    --image-name)
        IMAGE_NAME="$2"
        shift 2
        ;;
    --container-name)
        CONTAINER_NAME="$2"
        shift 2
        ;;
    *)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
    esac
done

# Check if JIRA token is set
if [ "$JIRA_API_TOKEN" = "YOUR_JIRA_API_TOKEN_HERE" ]; then
    echo "Warning: JIRA API token not provided. JIRA integration may not work."
    echo "Use --jira-token to provide your JIRA API token."
    echo ""
fi

# Remove existing container if it exists
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo "Stopping and removing existing container: $CONTAINER_NAME"
    docker stop "$CONTAINER_NAME" || true
    docker rm "$CONTAINER_NAME" || true
fi

# Run the container
echo "Starting Release Tracker container..."
docker run -d -p 3001:3001 \
    -e MONGODB_URI="$MONGODB_URI" \
    -e NODE_ENV=production \
    -e REACT_APP_JIRA_BASE_URL=https://appveen.atlassian.net \
    -e REACT_APP_JIRA_API_VERSION=3 \
    -e REACT_APP_JIRA_EMAIL="$JIRA_EMAIL" \
    -e REACT_APP_JIRA_API_TOKEN="$JIRA_API_TOKEN" \
    -e NGINX_DIR="$NGINX_DIR" \
    --network="$DOCKER_NETWORK" \
    --name "$CONTAINER_NAME" \
    "$IMAGE_NAME"

echo "Container started successfully!"
echo ""
echo "To view logs:"
echo "  docker logs $CONTAINER_NAME"
echo ""
echo "The Nginx configuration file is available inside the container at:"
echo "  /app/release-tracker-nginx.conf"
echo ""
echo "To copy this file to the host:"
echo "  docker cp $CONTAINER_NAME:/app/release-tracker-nginx.conf ./release-tracker-nginx.conf"
echo ""
echo "After reviewing and adding the Nginx configuration, don't forget to reload Nginx:"
echo "  sudo systemctl reload nginx"
