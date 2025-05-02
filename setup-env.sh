#!/bin/bash

# Default values
DEFAULT_PORT=3001
DEFAULT_MONGODB_URI="mongodb://localhost:27017/dnio-release-tracker"
DEFAULT_API_URL="/release/api"
DEFAULT_BASE_PATH="/release"

# Check if .env file exists
if [ -f .env ]; then
    echo "Found existing .env file. Do you want to overwrite it? (y/n)"
    read overwrite
    if [ "$overwrite" != "y" ]; then
        echo "Exiting without changes."
        exit 0
    fi
fi

# Prompt for environment variables
echo "Setting up environment variables for release application"
echo "Press Enter to use default values"

echo -n "PORT [$DEFAULT_PORT]: "
read PORT
PORT=${PORT:-$DEFAULT_PORT}

echo -n "MONGODB_URI [$DEFAULT_MONGODB_URI]: "
read MONGODB_URI
MONGODB_URI=${MONGODB_URI:-$DEFAULT_MONGODB_URI}

echo -n "REACT_APP_API_URL [$DEFAULT_API_URL]: "
read API_URL
API_URL=${API_URL:-$DEFAULT_API_URL}

echo -n "REACT_APP_BASE_PATH [$DEFAULT_BASE_PATH]: "
read BASE_PATH
BASE_PATH=${BASE_PATH:-$DEFAULT_BASE_PATH}

echo -n "JIRA_API_KEY: "
read JIRA_API_KEY

echo -n "JIRA_EMAIL: "
read JIRA_EMAIL

echo -n "JIRA_URL: "
read JIRA_URL

# Create .env file
cat >.env <<EOL
PORT=$PORT
MONGODB_URI=$MONGODB_URI
REACT_APP_API_URL=$API_URL
REACT_APP_BASE_PATH=$BASE_PATH
JIRA_API_KEY=$JIRA_API_KEY
JIRA_EMAIL=$JIRA_EMAIL
JIRA_URL=$JIRA_URL
EOL

echo ".env file created successfully!"
echo "To deploy with Docker:"
echo "1. Run 'docker-compose build' to build the containers"
echo "2. Run 'docker-compose up -d' to start the application"
echo "The application will be available at $BASE_PATH"
