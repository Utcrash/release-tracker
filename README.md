# Release Tracker

A web application for tracking software releases and integrating with JIRA.

## Features

- Track software releases and their components
- Integrate with JIRA to fetch and display ticket information
- Display ticket status and fix versions
- Manage component deliveries with links to artifacts

## Deployment Options

### Using Docker Compose (Recommended)

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/release-tracker.git
   cd release-tracker
   ```

2. Configure environment variables by creating a `.env` file in the root directory:

   ```
   JIRA_BASE_URL=https://your-jira-instance.atlassian.net
   JIRA_EMAIL=your.email@example.com
   JIRA_API_TOKEN=your_jira_api_token
   ```

3. Build and start the application:

   ```
   docker-compose up -d
   ```

4. Access the application at `http://your-server:3001/release-tracker`

### Using Docker

1. Build the Docker image:

   ```
   docker build -t release-tracker .
   ```

2. Run the container with environment variables:

   ```
   docker run -d -p 3001:3001 \
     -e MONGODB_URI=mongodb://your-mongodb-server:27017/release-tracker \
     -e JIRA_BASE_URL=https://your-jira-instance.atlassian.net \
     -e JIRA_EMAIL=your.email@example.com \
     -e JIRA_API_TOKEN=your_jira_api_token \
     release-tracker
   ```

3. Access the application at `http://your-server:3001/release-tracker`

### Manual Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/release-tracker.git
   cd release-tracker
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a backend/.env file:

   ```
   # JIRA Configuration
   JIRA_BASE_URL=https://your-jira-instance.atlassian.net
   JIRA_API_VERSION=3
   JIRA_EMAIL=your.email@example.com
   JIRA_API_TOKEN=your_jira_api_token

   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017/dnio-release-tracker

   # Application Configuration
   BASE_PATH=/release-tracker
   ```

4. Build the React application:

   ```
   npm run build
   ```

5. Start the server:

   ```
   npm run start-backend
   ```

6. Access the application at `http://your-server:3001/release-tracker`

## Environment Variables

| Variable           | Description                                    | Default Value                                    |
| ------------------ | ---------------------------------------------- | ------------------------------------------------ |
| `PORT`             | The port on which the server runs              | `3001`                                           |
| `BASE_PATH`        | Base path where the application will be hosted | `/release-tracker`                               |
| `MONGODB_URI`      | MongoDB connection string                      | `mongodb://localhost:27017/dnio-release-tracker` |
| `JIRA_BASE_URL`    | URL of your JIRA instance                      | `https://appveen.atlassian.net`                  |
| `JIRA_API_VERSION` | JIRA API version                               | `3`                                              |
| `JIRA_EMAIL`       | Email used for JIRA authentication             |                                                  |
| `JIRA_API_TOKEN`   | JIRA API token for authentication              |                                                  |

## Development

1. Clone the repository and install dependencies:

   ```
   git clone https://github.com/yourusername/release-tracker.git
   cd release-tracker
   npm install
   ```

2. Start the backend:

   ```
   npm run start-backend
   ```

3. In another terminal, start the frontend development server:

   ```
   npm start
   ```

4. The frontend will be available at `http://localhost:3000`

## License

This project is licensed under the MIT License.
