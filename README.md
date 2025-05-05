# Release Tracker

A React/Node.js application for tracking releases with JIRA integration.

## Deployment with Docker

This application is designed to be deployed using Docker with Nginx for serving the frontend.

### Quick Deployment Using Pre-built Image

The easiest way to deploy is using the pre-built Docker image from Docker Hub:

```bash
# Pull the image from Docker Hub
docker pull utcrash/release-tracker

# Run the container (replace with your JIRA token)
docker run -d -p 3001:3001 \
  -e REACT_APP_JIRA_API_TOKEN="YOUR_JIRA_TOKEN" \
  -e REACT_APP_JIRA_EMAIL="your-email@example.com" \
  --network="docker-services_dniomp" \
  --name release-tracker \
  utcrash/release-tracker

# Copy the Nginx configuration file from the container
docker cp release-tracker:/app/release-tracker-nginx.conf ./

# Add the configuration to your Nginx server block and reload Nginx
sudo systemctl reload nginx
```

### Building Your Own Image

If you want to build your own image from source:

```bash
# 1. Build the Docker image
docker build -t release-tracker .

# 2. Run the container (replace with your JIRA token)
docker run -d -p 3001:3001 \
  -e REACT_APP_JIRA_API_TOKEN="YOUR_JIRA_TOKEN" \
  -e REACT_APP_JIRA_EMAIL="your-email@example.com" \
  --network="docker-services_dniomp" \
  --name release-tracker \
  release-tracker

# 3. Copy the Nginx configuration file from the container
docker cp release-tracker:/app/release-tracker-nginx.conf ./

# 4. Add the configuration to your Nginx server block
# 5. Reload Nginx
sudo systemctl reload nginx
```

### Environment Variables

The application uses the following environment variables:

| Variable                   | Description                          | Default                                      |
| -------------------------- | ------------------------------------ | -------------------------------------------- |
| PORT                       | Port the server runs on              | 3001                                         |
| NODE_ENV                   | Environment (development/production) | production                                   |
| BASE_PATH                  | Base path for the application        | /release-tracker                             |
| MONGODB_URI                | MongoDB connection string            | mongodb://mongodb:27017/dnio-release-tracker |
| REACT_APP_JIRA_BASE_URL    | JIRA instance URL                    | https://appveen.atlassian.net                |
| REACT_APP_JIRA_API_VERSION | JIRA API version                     | 3                                            |
| REACT_APP_JIRA_EMAIL       | JIRA account email                   | _Must be provided_                           |
| REACT_APP_JIRA_API_TOKEN   | JIRA API token                       | _Must be provided_                           |

### Nginx Configuration

The Docker container automatically generates an Nginx configuration file that includes:

1. Frontend serving from `/var/www/html/release-tracker`
2. API proxy to the Node.js backend
3. Special handling for browser requests that go directly to localhost:3001

### Security Notice

**IMPORTANT:** This application requires JIRA credentials to function properly. For security purposes:

1. **NEVER commit your actual JIRA credentials to the repository**
2. Always use environment variables when running the container
