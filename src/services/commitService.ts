import api, { handleResponse } from './api';
import { Commit } from '../types';
import { ApiResponse } from '../types/api';

export const commitService = {
    getAllCommits: async (): Promise<Commit[]> => {
        const response = await api.get<Commit[]>('/commits');
        return handleResponse(response);
    },

    getCommitById: async (id: string): Promise<Commit> => {
        const response = await api.get<Commit>(`/commits/${id}`);
        return handleResponse(response);
    },

    getCommitsByServiceId: async (serviceId: string): Promise<Commit[]> => {
        const response = await api.get<Commit[]>(`/commits?serviceId=${serviceId}`);
        return handleResponse(response);
    },

    createCommit: async (commit: Omit<Commit, '_id'>): Promise<Commit> => {
        const response = await api.post<Commit>('/commits', commit);
        return handleResponse(response);
    },

    updateCommit: async (id: string, commit: Partial<Commit>): Promise<Commit> => {
        const response = await api.put<Commit>(`/commits/${id}`, commit);
        return handleResponse(response);
    }
}; 