// Load environment variables from .env file
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const BASE_PATH = process.env.REACT_APP_BASE_PATH || '';
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

// API Routes - Adjust paths to include BASE_PATH for API endpoints
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Application available at ${BASE_PATH || '/'}`);
}); 