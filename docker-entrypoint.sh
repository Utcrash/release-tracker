#!/bin/sh
set -e

# Create a .env file in the container
echo "Creating .env file..."
cat >/app/.env <<EOF
PORT=${PORT:-3001}
NODE_ENV=${NODE_ENV:-production}
BASE_PATH=${BASE_PATH:-/release-tracker}
MONGODB_URI=${MONGODB_URI:-mongodb://mongo:27017/release-tracker}
JIRA_BASE_URL=${JIRA_BASE_URL}
JIRA_EMAIL=${JIRA_EMAIL}
JIRA_API_TOKEN=${JIRA_API_TOKEN}
EOF

echo "Starting server..."
exec node backend/server.js
