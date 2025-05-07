#!/bin/sh
set -e

# Debug environment variables
echo "==== Input Environment Variables ===="
echo "JIRA_BASE_URL: $JIRA_BASE_URL"
echo "JIRA_API_VERSION: $JIRA_API_VERSION"
echo "JIRA_EMAIL: $JIRA_EMAIL"
echo "JIRA_API_TOKEN: [hidden]"
echo "MONGODB_URI: $MONGODB_URI"
echo "BASE_PATH: $BASE_PATH"
echo "=================================="

# Create a .env file in the container
echo "Creating .env file..."
cat >/app/.env <<EOF
PORT=${PORT:-3001}
NODE_ENV=${NODE_ENV:-production}
BASE_PATH=${BASE_PATH:-/release-tracker}
MONGODB_URI=${MONGODB_URI:-mongodb://mongodb:27017/dnio-release-tracker}

# JIRA Configuration
JIRA_BASE_URL=${JIRA_BASE_URL:-https://appveen.atlassian.net}
JIRA_API_VERSION=${JIRA_API_VERSION:-3}
JIRA_EMAIL=${JIRA_EMAIL}
JIRA_API_TOKEN=${JIRA_API_TOKEN}

# React App Configuration (for frontend)
REACT_APP_JIRA_BASE_URL=${JIRA_BASE_URL:-https://appveen.atlassian.net}
REACT_APP_JIRA_API_VERSION=${JIRA_API_VERSION:-3}
REACT_APP_JIRA_EMAIL=${JIRA_EMAIL}
REACT_APP_JIRA_API_TOKEN=${JIRA_API_TOKEN}
REACT_APP_BASE_PATH=${BASE_PATH:-/release-tracker}
EOF

echo "Created .env file with contents:"
cat /app/.env | grep -v "TOKEN"

# Set non-sensitive environment variables for the Node process
# Backend variables
export JIRA_BASE_URL=${JIRA_BASE_URL:-https://appveen.atlassian.net}
export JIRA_API_VERSION=${JIRA_API_VERSION:-3}
export JIRA_EMAIL=${JIRA_EMAIL}

# Frontend variables
export REACT_APP_JIRA_BASE_URL=${JIRA_BASE_URL:-https://appveen.atlassian.net}
export REACT_APP_JIRA_API_VERSION=${JIRA_API_VERSION:-3}
export REACT_APP_JIRA_EMAIL=${JIRA_EMAIL}
export REACT_APP_BASE_PATH=${BASE_PATH:-/release-tracker}

echo "Starting server..."
exec node backend/server.js
