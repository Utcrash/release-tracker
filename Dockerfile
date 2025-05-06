FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build the frontend
RUN npm run build

# Expose the backend port
EXPOSE 3001

# Set default environment variables
ENV PORT=3001 \
    NODE_ENV=production \
    BASE_PATH=/release-tracker \
    MONGODB_URI=mongodb://mongodb:27017/dnio-release-tracker \
    REACT_APP_JIRA_BASE_URL=https://appveen.atlassian.net \
    REACT_APP_JIRA_API_VERSION=3 \
    REACT_APP_JIRA_PROJECT_KEY=DNIO

# Create setup script
RUN echo '#!/bin/bash\n\
    # Copy frontend files to nginx directory\n\
    mkdir -p /var/www/html/release-tracker\n\
    cp -r /app/build/* /var/www/html/release-tracker/\n\
    chmod -R 755 /var/www/html/release-tracker\n\
    \n\
    # Create nginx config file\n\
    cat > /app/release-tracker-nginx.conf << EOF\n\
    # Release Tracker frontend\n\
    location /release-tracker {\n\
    root /var/www/html;\n\
    try_files \\$uri \\$uri/ /release-tracker/index.html;\n\
    }\n\
    \n\
    # Release Tracker API proxy\n\
    location /release-tracker/api/ {\n\
    proxy_pass http://localhost:3001/;\n\
    proxy_http_version 1.1;\n\
    proxy_set_header Host \\$host;\n\
    proxy_set_header X-Real-IP \\$remote_addr;\n\
    proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;\n\
    proxy_set_header X-Forwarded-Proto \\$scheme;\n\
    proxy_read_timeout 600s;\n\
    }\n\
    \n\
    # Handle direct localhost:3001 requests from browser\n\
    location ~ /localhost:3001/release-tracker/api/(.*) {\n\
    proxy_pass http://localhost:3001/\\$1\\$is_args\\$args;\n\
    proxy_http_version 1.1;\n\
    proxy_set_header Host \\$host;\n\
    proxy_set_header X-Real-IP \\$remote_addr;\n\
    proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;\n\
    proxy_set_header X-Forwarded-Proto \\$scheme;\n\
    }\n\
    EOF\n\
    \n\
    echo "========================================================"\n\
    echo "Setup complete:"\n\
    echo "1. React app is at /var/www/html/release-tracker"\n\
    echo "2. Nginx config is at /app/release-tracker-nginx.conf"\n\
    echo "3. Run: docker cp release-tracker:/app/release-tracker-nginx.conf ./"\n\
    echo "4. Add this config to your Nginx server block"\n\
    echo "5. Reload Nginx with: sudo systemctl reload nginx"\n\
    echo "========================================================"\n\
    \n\
    # Start the backend server\n\
    exec node backend/server.js\n\
    ' > /app/start.sh && chmod +x /app/start.sh

# Use start script as entrypoint
CMD ["/app/start.sh"]
