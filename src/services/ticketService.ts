import api, { handleResponse } from './api';
import { Ticket } from '../types';
import { ApiResponse } from '../types/api';

export const ticketService = {
    getAllTickets: async (): Promise<Ticket[]> => {
        const response = await api.get<Ticket[]>('/tickets');
        return handleResponse(response);
    },

    getTicketById: async (id: string): Promise<Ticket> => {
        const response = await api.get<Ticket>(`/tickets/${id}`);
        return handleResponse(response);
    },

    getTicketsByServiceId: async (serviceId: string): Promise<Ticket[]> => {
        const response = await api.get<Ticket[]>(`/tickets?serviceId=${serviceId}`);
        return handleResponse(response);
    },

    createTicket: async (ticket: Omit<Ticket, '_id'>): Promise<Ticket> => {
        const response = await api.post<Ticket>('/tickets', ticket);
        return handleResponse(response);
    },

    updateTicket: async (id: string, ticket: Partial<Ticket>): Promise<Ticket> => {
        const response = await api.put<Ticket>(`/tickets/${id}`, ticket);
        return handleResponse(response);
    }
}; 