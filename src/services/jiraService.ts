import axios from 'axios';
import api, { handleResponse } from './api';
import { JiraTicket } from '../types';

// JIRA Configuration from environment variables
const JIRA_API_VERSION = process.env.REACT_APP_JIRA_API_VERSION || '3';
const JIRA_EMAIL = process.env.REACT_APP_JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.REACT_APP_JIRA_API_TOKEN;
const JIRA_BASE_URL = process.env.REACT_APP_JIRA_BASE_URL;

// Debug log for environment variables and auth
console.log('==== JIRA Service Configuration ====');
console.log('Base URL:', JIRA_BASE_URL);
console.log('API Version:', JIRA_API_VERSION);
console.log('Email:', JIRA_EMAIL);
console.log('Token Present:', !!JIRA_API_TOKEN);
console.log('Token Length:', JIRA_API_TOKEN?.length);
console.log('Auth String:', `${JIRA_EMAIL}:${JIRA_API_TOKEN?.substring(0, 5)}...`);
console.log('================================');

if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
    console.error('JIRA configuration missing:', {
        hasEmail: !!JIRA_EMAIL,
        hasToken: !!JIRA_API_TOKEN,
        email: JIRA_EMAIL || 'not set',
        tokenLength: JIRA_API_TOKEN?.length || 0
    });
}

interface JiraApiResponse {
    issues: Array<{
        key: string;
        fields: {
            summary: string;
            status: {
                name: string;
            };
            assignee?: {
                displayName: string;
            };
            created: string;
            updated: string;
            components?: Array<{
                name: string;
            }>;
            fixVersions?: Array<{
                name: string;
            }>;
            priority?: {
                name: string;
            };
        };
    }>;
}

interface JiraProject {
    id: string;
    key: string;
    name: string;
}

// Helper function to verify auth header is present
const verifyAuthHeader = () => {
    if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
        throw new Error('Authentication not configured. Please check JIRA_EMAIL and JIRA_API_TOKEN environment variables.');
    }
};

// Browser-safe base64 encoding
const base64Encode = (str: string): string => {
    return btoa(str);
};

// Get API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create JIRA API client
const jiraApi = axios.create({
    baseURL: '/rest/api/3',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${base64Encode(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`)}`,
    }
});

export const jiraService = {
    // Get all accessible projects
    getProjects: async (): Promise<JiraProject[]> => {
        try {
            verifyAuthHeader();
            const response = await jiraApi.get<JiraProject[]>('/project');
            if (!response.data || !Array.isArray(response.data)) {
                throw new Error('Invalid response format from JIRA API');
            }
            return response.data;
        } catch (error: any) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    },

    getTicketsByStatus: async (projectKey: string = 'DNIO', status: string): Promise<JiraTicket[]> => {
        try {
            verifyAuthHeader();
            const response = await jiraApi.get<JiraApiResponse>('/search', {
                params: {
                    jql: `project=${projectKey} AND status="${status}"`,
                    maxResults: 50,
                    fields: [
                        'key',
                        'summary',
                        'status',
                        'priority',
                        'assignee',
                        'created',
                        'updated',
                        'components',
                        'fixVersions'
                    ].join(',')
                }
            });

            return response.data.issues.map(issue => ({
                ticketId: issue.key,
                summary: issue.fields.summary,
                status: issue.fields.status.name,
                priority: issue.fields.priority?.name,
                assignee: issue.fields.assignee?.displayName || 'Unassigned',
                created: issue.fields.created,
                updated: issue.fields.updated,
                components: issue.fields.components?.map(c => c.name) || [],
                fixVersions: issue.fields.fixVersions?.map(v => v.name) || []
            }));
        } catch (error) {
            console.error('Error fetching JIRA tickets:', error);
            throw error;
        }
    },

    // Get Ready for Release tickets
    getReadyForReleaseTickets: async (projectKey: string = 'DNIO'): Promise<JiraTicket[]> => {
        return jiraService.getTicketsByStatus(projectKey, 'Ready For Release');
    },

    // Get In Progress tickets
    getInProgressTickets: async (projectKey: string = 'DNIO'): Promise<JiraTicket[]> => {
        return jiraService.getTicketsByStatus(projectKey, 'In Progress');
    },

    // Get Done tickets
    getDoneTickets: async (projectKey: string = 'DNIO'): Promise<JiraTicket[]> => {
        return jiraService.getTicketsByStatus(projectKey, 'Done');
    },

    // Get To Do tickets
    getToDoTickets: async (projectKey: string = 'DNIO'): Promise<JiraTicket[]> => {
        return jiraService.getTicketsByStatus(projectKey, 'To Do');
    },

    // Get all tickets regardless of status
    getAllTickets: async (projectKey: string = 'DNIO'): Promise<JiraTicket[]> => {
        try {
            verifyAuthHeader();
            const jql = `project = ${projectKey} ORDER BY priority DESC, created DESC`;
            const response = await jiraApi.get<JiraApiResponse>('/search', {
                params: {
                    jql,
                    fields: [
                        'key',
                        'summary',
                        'status',
                        'priority',
                        'assignee',
                        'created',
                        'updated',
                        'components',
                        'fixVersions'
                    ].join(',')
                }
            });

            return response.data.issues.map(issue => ({
                ticketId: issue.key,
                summary: issue.fields.summary,
                status: issue.fields.status.name,
                priority: issue.fields.priority?.name,
                assignee: issue.fields.assignee?.displayName || 'Unassigned',
                created: issue.fields.created,
                updated: issue.fields.updated,
                components: issue.fields.components?.map(c => c.name) || [],
                fixVersions: issue.fields.fixVersions?.map(v => v.name) || []
            }));
        } catch (error) {
            console.error('Error fetching JIRA tickets:', error);
            throw error;
        }
    },

    // Get tickets for a specific component from our backend
    getComponentTickets: async (componentId: string, componentSlug?: string): Promise<JiraTicket[]> => {
        try {
            const identifier = componentSlug || componentId;
            const response = await api.get<JiraTicket[]>(`/jira/component/${identifier}`);
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching component tickets:', error);
            throw error;
        }
    },

    // This will update our backend with the fetched tickets
    syncReadyForReleaseTickets: async (componentId: string, projectKey: string, componentSlug?: string): Promise<void> => {
        try {
            const identifier = componentSlug || componentId;
            const tickets = await jiraService.getReadyForReleaseTickets(projectKey);
            await api.post(`/jira/sync/${identifier}`, { tickets });
        } catch (error) {
            console.error('Error syncing JIRA tickets:', error);
            throw error;
        }
    }
}; 