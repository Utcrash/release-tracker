#!/bin/bash
set -e

# This script copies built React files to Nginx directory and creates a suggested Nginx config

# Check if the target directory is provided
if [ $# -lt 1 ]; then
    echo "Usage: $0 <nginx_html_dir>"
    exit 1
fi

NGINX_HTML_DIR="$1"
RELEASE_TRACKER_DIR="${NGINX_HTML_DIR}/release-tracker"

# Create the directory if it doesn't exist
mkdir -p "$RELEASE_TRACKER_DIR"

# Copy the built React app files
echo "Copying React app files to $RELEASE_TRACKER_DIR"
cp -r /app/build/* "$RELEASE_TRACKER_DIR"

# Set appropriate permissions
echo "Setting permissions on $RELEASE_TRACKER_DIR"
find "$RELEASE_TRACKER_DIR" -type d -exec chmod 755 {} \;
find "$RELEASE_TRACKER_DIR" -type f -exec chmod 644 {} \;

# Create a suggested Nginx configuration file
NGINX_CONF_TEMPLATE="/app/release-tracker-nginx.conf"

echo "Creating suggested Nginx configuration template at $NGINX_CONF_TEMPLATE"
cat >"$NGINX_CONF_TEMPLATE" <<'EOF'
# Release Tracker frontend
location /release-tracker {
    root NGINX_HTML_DIR_PLACEHOLDER;
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

# Replace placeholder with actual Nginx HTML dir
sed -i "s|NGINX_HTML_DIR_PLACEHOLDER|$(dirname "$NGINX_HTML_DIR")|g" "$NGINX_CONF_TEMPLATE"

echo "=========================================================="
echo "Setup complete!"
echo "React app files copied to $RELEASE_TRACKER_DIR"
echo ""
echo "Suggested Nginx configuration created at $NGINX_CONF_TEMPLATE"
echo "You can add this configuration to your Nginx server block."
echo "=========================================================="
