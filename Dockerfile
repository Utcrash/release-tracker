# Use Node.js as the base image
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy built React app and backend files
COPY --from=build /app/build ./build
COPY --from=build /app/backend ./backend
COPY --from=build /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 3001

# Set environment variables with defaults - these will be used by docker-entrypoint.sh
# to create the shared .env file
ENV PORT=3001 \
    NODE_ENV=production \
    BASE_PATH=/release-tracker \
    MONGODB_URI=mongodb://localhost:27017/dnio-release-tracker \
    JIRA_BASE_URL=https://appveen.atlassian.net \
    JIRA_API_VERSION=3

# Use the entrypoint script to start the application
ENTRYPOINT ["/docker-entrypoint.sh"] 