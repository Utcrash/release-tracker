import axios from 'axios';
import { ApiResponse } from '../types/api';

// Get environment variables with fallbacks
const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: false
});

// Add request interceptor
api.interceptors.request.use(
    (config) => {
        // You can add any request preprocessing here
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