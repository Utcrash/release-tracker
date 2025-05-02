import api, { handleResponse } from './api';
import { Component } from '../types';
import { ApiResponse } from '../types/api';

export const componentService = {
    getAllComponents: async (): Promise<Component[]> => {
        try {
            console.log('Fetching all components');
            const response = await api.get<Component[]>('/components');
            const data = handleResponse(response);
            console.log('Fetched components:', data);
            return data;
        } catch (error) {
            console.error('Error fetching components:', error);
            return [];
        }
    },

    getComponentById: async (idOrSlug: string): Promise<Component> => {
        try {
            console.log(`Fetching component with ID/slug: ${idOrSlug}`);
            const response = await api.get<Component>(`/components/${idOrSlug}`);
            const data = handleResponse(response);
            console.log('Fetched component:', data);
            return data;
        } catch (error) {
            console.error(`Error fetching component ${idOrSlug}:`, error);
            throw error;
        }
    },

    createComponent: async (component: Omit<Component, '_id'>): Promise<Component> => {
        try {
            const response = await api.post<Component>('/components', component);
            return handleResponse(response);
        } catch (error) {
            console.error('Error creating component:', error);
            throw error;
        }
    },

    updateComponent: async (id: string, component: Partial<Component>): Promise<Component> => {
        try {
            const response = await api.put<Component>(`/components/${id}`, component);
            return handleResponse(response);
        } catch (error) {
            console.error(`Error updating component ${id}:`, error);
            throw error;
        }
    }
}; 