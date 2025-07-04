import axios from 'axios';
import { ApiResponse } from '../types/api';

// Get environment variables with fallbacks
// Use relative URLs by default when deployed to production
const isProduction = process.env.NODE_ENV === 'production';
const BACKEND_URL = isProduction ? '' : (process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001');
const API_URL = process.env.REACT_APP_API_URL || '/release-tracker/api';

// Create the full API URL - for production, use relative URLs
const FULL_API_URL = isProduction ? API_URL : `${BACKEND_URL}${API_URL}`;

// When using the proxy we'll use the relative path, otherwise use the full URL
const isUsingProxy = BACKEND_URL === 'https://appveen.atlassian.net';
const baseURL = isProduction || isUsingProxy ? API_URL : FULL_API_URL;

// Log the configuration to help with debugging
console.log('API Configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    isProduction,
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

export async function login(username: string, password: string): Promise<{ role: string }> {
    try {
        const response = await api.post<{ message: string; role: string }>(
            '/auth/login',
            { username, password },
            { withCredentials: true }
        );
        return { role: response.data.role };
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('Login failed');
    }
}

export async function logout(): Promise<void> {
    try {
        await api.post('/auth/logout', {}, { withCredentials: true });
    } catch (error: any) {
        throw new Error('Logout failed');
    }
}

export default api; 