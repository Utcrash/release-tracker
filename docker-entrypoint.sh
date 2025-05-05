#!/bin/sh
set -e

# Create backend/.env file with environment variables
cat >/app/backend/.env <<EOF
# JIRA Configuration
JIRA_BASE_URL=${JIRA_BASE_URL:-https://appveen.atlassian.net}
JIRA_API_VERSION=${JIRA_API_VERSION:-3}
JIRA_EMAIL=${JIRA_EMAIL:-}
JIRA_API_TOKEN=${JIRA_API_TOKEN:-}

# MongoDB Connection
MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/dnio-release-tracker}

# Application Configuration
PORT=${PORT:-3001}
BASE_PATH=${BASE_PATH:-/release-tracker}
EOF

echo "=== Environment Configuration ==="
echo "BASE_PATH: $BASE_PATH"
echo "MONGODB_URI: $MONGODB_URI"
echo "JIRA_BASE_URL: $JIRA_BASE_URL"
echo "Application will be available at: $BASE_PATH"
echo "==============================="

# Start the Node.js application
exec node backend/server.js
