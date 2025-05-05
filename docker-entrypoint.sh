#!/bin/sh
set -e

# Create a unified .env file in the root directory with both React and backend variables
cat >/app/.env <<EOF
# React Environment Variables
REACT_APP_JIRA_BASE_URL=${JIRA_BASE_URL:-https://appveen.atlassian.net}
REACT_APP_JIRA_API_VERSION=${JIRA_API_VERSION:-3}
REACT_APP_JIRA_EMAIL=${JIRA_EMAIL:-}
REACT_APP_JIRA_API_TOKEN=${JIRA_API_TOKEN:-}
FAST_REFRESH=false

# Backend Configuration is loaded from these variables in server.js
# Application Configuration
PORT=${PORT:-3001}
BASE_PATH=${BASE_PATH:-/release-tracker}
MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/dnio-release-tracker}
EOF

echo "=== Environment Configuration ==="
echo "BASE_PATH: $BASE_PATH"
echo "MONGODB_URI: $MONGODB_URI"
echo "JIRA_BASE_URL: $JIRA_BASE_URL"
echo "Application will be available at: $BASE_PATH"
echo "==============================="

# Start the Node.js application
exec node backend/server.js
