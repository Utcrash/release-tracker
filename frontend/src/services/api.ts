const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API_URL = process.env.REACT_APP_API_URL || '/release-tracker/api';
const FULL_API_URL = BACKEND_URL ? `${BACKEND_URL}${API_URL}` : API_URL;

// We're using nginx as a proxy when we're in production and have a BASE_PATH
const isUsingProxy = isProduction && process.env.REACT_APP_BASE_PATH;
const baseURL = isUsingProxy ? API_URL : FULL_API_URL;

console.log('API Configuration:', {
    NODE_ENV,
    isProduction,
    BACKEND_URL,
    API_URL,
    FULL_API_URL,
    isUsingProxy,
    baseURL
}); 