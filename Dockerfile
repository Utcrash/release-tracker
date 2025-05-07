# Use Node.js as the base image
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Build the React app
RUN npm run build

# Backend stage
FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY backend ./backend
COPY --from=build /app/build ./build
COPY package*.json ./
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Make entrypoint script executable
RUN chmod +x /docker-entrypoint.sh

# Install production dependencies only
RUN npm install --only=production

# Set environment variables with defaults
ENV PORT=3001 \
    NODE_ENV=production \
    BASE_PATH=/release-tracker \
    MONGODB_URI=mongodb://mongo:27017/release-tracker \
    JIRA_BASE_URL=https://appveen.atlassian.net \
    JIRA_API_VERSION=3

# Expose the backend port
EXPOSE 3001

# Use entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"] 