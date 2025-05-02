# Stage 1: Build React application
FROM node:20-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set environment variables for build
ARG REACT_APP_API_URL
ARG REACT_APP_BASE_PATH=/release
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_BASE_PATH=$REACT_APP_BASE_PATH
ENV PUBLIC_URL=/release

# Build the application
RUN npm run build

# Stage 2: Set up the production environment
FROM node:20-alpine

WORKDIR /app

# Copy build artifacts from the build stage
COPY --from=build /app/build ./build
COPY --from=build /app/backend ./backend

# Install production dependencies for backend
COPY package*.json ./
RUN npm ci --only=production

# Copy .env file if it exists
COPY .env* ./

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "backend/server.js"] 