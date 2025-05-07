#!/bin/bash

# Copy frontend files to nginx directory
mkdir -p /var/www/html/release-tracker
cp -r /app/build/* /var/www/html/release-tracker/
chmod -R 755 /var/www/html/release-tracker

# Create nginx config file
cat >/app/release-tracker-nginx.conf <<"EOF"
# Release Tracker frontend
location /release-tracker {
    root /var/www/html;
    try_files $uri $uri/ /release-tracker/index.html;
}

# Release Tracker API proxy
location /release-tracker/api/ {
    proxy_pass http://localhost:3001/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 600s;
}

# Handle direct localhost:3001 requests from browser
location ~ /localhost:3001/release-tracker/api/(.*) {
    proxy_pass http://localhost:3001/$1$is_args$args;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
EOF

echo "========================================================"
echo "Setup complete:"
echo "1. React app is at /var/www/html/release-tracker"
echo "2. Nginx config is at /app/release-tracker-nginx.conf"
echo "3. Run: docker cp release-tracker:/app/release-tracker-nginx.conf ./"
echo "4. Add this config to your Nginx server block"
echo "5. Reload Nginx with: sudo systemctl reload nginx"
echo "========================================================"

# Start the backend server
exec node backend/server.js
