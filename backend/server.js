// Load environment variables from root .env file
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Map REACT_APP_ prefixed variables to backend variables
process.env.JIRA_BASE_URL = process.env.REACT_APP_JIRA_BASE_URL;
process.env.JIRA_API_VERSION = process.env.REACT_APP_JIRA_API_VERSION;
process.env.JIRA_EMAIL = process.env.REACT_APP_JIRA_EMAIL;
process.env.JIRA_API_TOKEN = process.env.REACT_APP_JIRA_API_TOKEN;

// Debug environment variables
console.log('==== Backend Environment Variables ====');
console.log('JIRA_BASE_URL:', process.env.JIRA_BASE_URL);
console.log('JIRA_EMAIL:', process.env.JIRA_EMAIL);
console.log('JIRA_API_TOKEN exists:', !!process.env.JIRA_API_TOKEN);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('BASE_PATH:', process.env.BASE_PATH);
console.log('====================================');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
// Always use /release-tracker consistently
const BASE_PATH = process.env.BASE_PATH || '/release-tracker';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dnio-release-tracker';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration - before routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Connect to MongoDB - autoCreate: true will create the database if it doesn't exist
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoCreate: true
})
    .then(() => {
        console.log('Successfully connected to MongoDB.');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Log MongoDB queries in development
if (process.env.NODE_ENV !== 'production') {
    mongoose.set('debug', true);
}

// API Routes - Include BASE_PATH for API endpoints
const apiBasePath = `${BASE_PATH}/api`;
app.use(`${apiBasePath}/jira`, require('./routes/jiraRoutes'));
app.use(`${apiBasePath}/releases`, require('./routes/releases'));

// Serve static files from the React app when in production
if (process.env.NODE_ENV === 'production') {
    app.use(BASE_PATH, express.static(path.join(__dirname, '../build')));

    // Serve the index.html for any route not matched by API routes
    app.get(`${BASE_PATH}/*`, (req, res) => {
        res.sendFile(path.join(__dirname, '../build/index.html'));
    });
}

// Basic route
app.get(`${BASE_PATH}/`, (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        res.sendFile(path.join(__dirname, '../build/index.html'));
    } else {
        res.send('Release Tracker API');
    }
});

// Add a redirect from root to BASE_PATH
app.get('/', (req, res) => {
    res.redirect(BASE_PATH);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Application available at ${BASE_PATH}`);
    console.log(`API available at ${apiBasePath}`);
}); 