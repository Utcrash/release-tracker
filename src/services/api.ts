import axios from 'axios';
import { ApiResponse } from '../types/api';

// Get environment variables with fallbacks
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const API_URL = process.env.REACT_APP_API_URL || '/release-tracker/api';

// Create the full API URL
const FULL_API_URL = `${BACKEND_URL}${API_URL}`;

// When using the proxy we'll use the relative path, otherwise use the full URL
const isUsingProxy = BACKEND_URL === 'https://appveen.atlassian.net';
const baseURL = isUsingProxy ? API_URL : FULL_API_URL;

// Log the configuration to help with debugging
console.log('API Configuration:', {
    BACKEND_URL,
    API_URL,
    FULL_API_URL,
    isUsingProxy,
    baseURL
});

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: false
});

// Add request interceptor
api.interceptors.request.use(
    (config) => {
        // For URLs that need to go directly to the backend (not through proxy)
        if (config.url?.startsWith('/releases')) {
            config.baseURL = FULL_API_URL;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Response error:', error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Request error:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export const handleResponse = <T>(response: { data: T }): T => {
    return response.data;
};

export const handleVoidResponse = (response: any): void => {
    // For operations that don't return data, like DELETE
    return;
};

export default api; 