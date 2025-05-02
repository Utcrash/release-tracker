# Release Tracker Application

A React and Node.js application for tracking releases and JIRA tickets.

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (if running locally)

### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the React app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

#### `npm run start-backend`

Starts the backend server in development mode on port 3001.

#### `npm run build`

Builds the app for production to the `build` folder.

## Docker Deployment

This application can be deployed using Docker to run at a specific URL path (`/release`).

### Setting up Environment Variables

1. Run the setup script to create your `.env` file:

   ```bash
   ./setup-env.sh
   ```

2. This will prompt you for the necessary environment variables:
   - `PORT`: Port for the server (default: 3001)
   - `MONGODB_URI`: MongoDB connection string
   - `REACT_APP_API_URL`: API URL path (default: /release/api)
   - `REACT_APP_BASE_PATH`: Base path for the application (default: /release)
   - JIRA credentials (if needed)

### Building and Running with Docker

#### Using Docker Compose (Recommended)

1. Build the containers:

   ```bash
   docker-compose build
   ```

2. Start the application:

   ```bash
   docker-compose up -d
   ```

3. The application will be available at `http://your-server:3001/release`

#### Manual Docker Setup

1. Build the Docker image:

   ```bash
   docker build -t release-tracker \
     --build-arg REACT_APP_API_URL=/release/api \
     --build-arg REACT_APP_BASE_PATH=/release .
   ```

2. Run the container:
   ```bash
   docker run -d -p 3001:3001 \
     -e NODE_ENV=production \
     -e PORT=3001 \
     -e MONGODB_URI=mongodb://your-mongodb-host:27017/dnio-release-tracker \
     -e REACT_APP_API_URL=/release/api \
     -e REACT_APP_BASE_PATH=/release \
     --name release-app release-tracker
   ```

## Environment Variables

The application uses the following environment variables:

| Variable            | Description                   | Default                                        |
| ------------------- | ----------------------------- | ---------------------------------------------- |
| PORT                | Server port                   | 3001                                           |
| MONGODB_URI         | MongoDB connection string     | mongodb://localhost:27017/dnio-release-tracker |
| REACT_APP_API_URL   | API URL path                  | /release/api                                   |
| REACT_APP_BASE_PATH | Base path for the application | /release                                       |
| JIRA_API_KEY        | JIRA API key                  | (required for JIRA integration)                |
| JIRA_EMAIL          | JIRA email                    | (required for JIRA integration)                |
| JIRA_URL            | JIRA instance URL             | (required for JIRA integration)                |
