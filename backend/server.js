// Load environment variables from root .env file
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Map REACT_APP_ prefixed variables to backend variables
process.env.JIRA_BASE_URL = process.env.REACT_APP_JIRA_BASE_URL;
process.env.JIRA_API_VERSION = process.env.REACT_APP_JIRA_API_VERSION;
process.env.JIRA_EMAIL = process.env.REACT_APP_JIRA_EMAIL;
process.env.JIRA_API_TOKEN = process.env.REACT_APP_JIRA_API_TOKEN;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
// const cookieParser = require('cookie-parser');
// const session = require('express-session');
// const RedisStore = require('connect-redis').default;
// const { redisClient } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;
// Always use /release-tracker consistently
const BASE_PATH = process.env.BASE_PATH || '/release-tracker';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dnio-release-tracker';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

// Trust proxy for secure cookies if behind a proxy (e.g., Heroku, Nginx)
// app.set('trust proxy', 1);

// const COOKIE_SECRET = process.env.COOKIE_SECRET;

// app.use(session({
//   store: new RedisStore({ client: redisClient }),
//   name: 'dniomp.sid',
//   secret: COOKIE_SECRET,
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     path: '/',
//     secure: process.env.NODE_ENV === 'production',
//     maxAge: 7200 * 1000, // 2 hours
//     httpOnly: true,
//     sameSite: 'strict',
//   },
// }));

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
const { router: jiraRouter } = require('./routes/jiraRoutes');
const { router: releasesRouter } = require('./routes/releases');
// const { router: authRouter } = require('./routes/auth');
app.use(`${apiBasePath}/jira`, jiraRouter);
app.use(`${apiBasePath}/releases`, releasesRouter);
// app.use(`${apiBasePath}/auth`, authRouter);

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