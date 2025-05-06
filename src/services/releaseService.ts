import api, { handleResponse, handleVoidResponse } from './api';
import { Release, JiraTicket } from '../types';
import { ApiResponse } from '../types/api';

// Type for creating a new release
export type CreateReleaseDto = Omit<Release, '_id'> & {
    tickets?: JiraTicket[];
};

// Type for updating a release
export type UpdateReleaseDto = Partial<CreateReleaseDto>;

// Type for paginated response
export interface PaginatedResponse<T> {
    releases: T[];
    pagination: {
        total: number;
        page: number;
        totalPages: number;
        hasMore: boolean;
    };
}

export const releaseService = {
    getAllReleases: async (page: number = 1): Promise<PaginatedResponse<Release>> => {
        const response = await api.get<PaginatedResponse<Release>>(`/releases?page=${page}`);
        return handleResponse(response);
    },

    getReleaseById: async (id: string): Promise<Release> => {
        const response = await api.get<Release>(`/releases/${id}`);
        return handleResponse(response);
    },

    getReleasesByServiceId: async (serviceId: string): Promise<Release[]> => {
        const response = await api.get<Release[]>(`/releases?serviceId=${serviceId}`);
        return handleResponse(response);
    },

    createRelease: async (release: CreateReleaseDto): Promise<Release> => {
        // Ensure the version is set
        if (!release.version) {
            throw new Error('Release version is required');
        }

        const response = await api.post<Release>('/releases', release);
        return handleResponse(response);
    },

    updateRelease: async (id: string, release: UpdateReleaseDto): Promise<Release> => {
        const response = await api.put<Release>(`/releases/${id}`, release);
        return handleResponse(response);
    },

    deleteRelease: async (id: string): Promise<void> => {
        const response = await api.delete(`/releases/${id}`);
        handleVoidResponse(response);
    }
}; 