# Docker Deployment Guide

This guide explains how to deploy the Release Tracker application using Docker and Nginx.

## Prerequisites

- Docker and Docker Compose installed on your server
- A DockerHub account for pushing and pulling images
- A server with SSH access

## Building and Pushing to DockerHub

1. Build the Docker image locally:

   ```bash
   docker build -t your-dockerhub-username/release-tracker:latest .
   ```

2. Log in to DockerHub:

   ```bash
   docker login
   ```

3. Push the image to DockerHub:
   ```bash
   docker push your-dockerhub-username/release-tracker:latest
   ```

## Deploying on Your Server

1. SSH into your server:

   ```bash
   ssh user@your-server-ip
   ```

2. Create a `docker-compose.yml` file:

   ```bash
   mkdir -p /opt/release-tracker
   cd /opt/release-tracker
   ```

3. Create a `.env` file with your environment variables:

   ```bash
   cat > .env << EOF
   PORT=3001
   NODE_ENV=production
   BASE_PATH=/release-tracker
   MONGODB_URI=mongodb://mongo:27017/release-tracker
   JIRA_BASE_URL=https://your-domain.atlassian.net
   JIRA_EMAIL=your-jira-email@example.com
   JIRA_API_TOKEN=your-jira-api-token
   EOF
   ```

4. Create a `docker-compose.yml` file:

   ```bash
   cat > docker-compose.yml << EOF
   version: '3'

   services:
     app:
       image: your-dockerhub-username/release-tracker:latest
       ports:
         - "3001:3001"
       env_file:
         - .env
       depends_on:
         - mongo
       restart: unless-stopped

     mongo:
       image: mongo:latest
       volumes:
         - mongo-data:/data/db
       restart: unless-stopped

     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/conf.d/default.conf
         - ./certbot/conf:/etc/letsencrypt
         - ./certbot/www:/var/www/certbot
       depends_on:
         - app
       restart: unless-stopped

   volumes:
     mongo-data:
   EOF
   ```

5. Create the Nginx configuration:

   ```bash
   cat > nginx.conf << EOF
   server {
       listen 80;
       server_name your-domain.com;

       location /release-tracker {
           proxy_pass http://app:3001/release-tracker;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \$http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host \$host;
           proxy_set_header X-Real-IP \$remote_addr;
           proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto \$scheme;
           proxy_cache_bypass \$http_upgrade;
       }

       # For root path, redirect to /release-tracker
       location = / {
           return 301 /release-tracker;
       }
   }
   EOF
   ```

6. Start the containers:
   ```bash
   docker-compose up -d
   ```

## Environment Variables

The application requires the following environment variables:

- `PORT`: The port the backend server will run on (default: 3001)
- `NODE_ENV`: The environment mode (development/production)
- `BASE_PATH`: The base path for the application (default: /release-tracker)
- `MONGODB_URI`: The MongoDB connection URI
- `JIRA_BASE_URL`: Your JIRA instance URL
- `JIRA_EMAIL`: Your JIRA account email
- `JIRA_API_TOKEN`: Your JIRA API token

## SSL with Let's Encrypt (Optional)

To configure SSL with Let's Encrypt:

1. Create directories for Certbot:

   ```bash
   mkdir -p certbot/conf certbot/www
   ```

2. Update your `nginx.conf` to include SSL:

   ```bash
   cat > nginx.conf << EOF
   server {
       listen 80;
       server_name your-domain.com;
       location /.well-known/acme-challenge/ {
           root /var/www/certbot;
       }
       location / {
           return 301 https://\$host\$request_uri;
       }
   }

   server {
       listen 443 ssl;
       server_name your-domain.com;

       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

       location /release-tracker {
           proxy_pass http://app:3001/release-tracker;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \$http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host \$host;
           proxy_set_header X-Real-IP \$remote_addr;
           proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto \$scheme;
           proxy_cache_bypass \$http_upgrade;
       }

       location = / {
           return 301 /release-tracker;
       }
   }
   EOF
   ```

3. Initialize SSL certificates:

   ```bash
   docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d your-domain.com
   ```

4. Set up auto-renewal:
   ```bash
   echo "0 12 * * * docker-compose run --rm certbot renew" | sudo tee -a /etc/crontab
   ```

## Updating the Application

To update the application with a new version:

1. Pull the latest image:

   ```bash
   docker-compose pull
   ```

2. Restart the containers:
   ```bash
   docker-compose up -d
   ```
