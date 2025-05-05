import api, { handleResponse } from './api';
import { JiraTicket } from '../types';

// JIRA Configuration from environment variables
const JIRA_API_VERSION = process.env.REACT_APP_JIRA_API_VERSION || '3';
const JIRA_EMAIL = process.env.REACT_APP_JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.REACT_APP_JIRA_API_TOKEN;
const JIRA_BASE_URL = process.env.REACT_APP_JIRA_BASE_URL || 'https://appveen.atlassian.net';

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

// Create JIRA API client that uses our backend proxy
const jiraApi = api;
// The path will be prefixed with /jira/proxy/ to use our backend proxy

export const jiraService = {
    // Get all accessible projects
    getProjects: async (): Promise<JiraProject[]> => {
        try {
            const response = await jiraApi.get<JiraProject[]>('/jira/proxy/project');
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
            const response = await jiraApi.get<JiraApiResponse>('/jira/proxy/search', {
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
            const jql = `project = ${projectKey} ORDER BY priority DESC, created DESC`;
            const response = await jiraApi.get<JiraApiResponse>('/jira/proxy/search', {
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
    getComponentTickets: async (componentId?: string): Promise<JiraTicket[]> => {
        try {
            if (componentId) {
                // If componentId is provided, get tickets for that component
                const response = await api.get<JiraTicket[]>(`/jira/component/${componentId}`);
                return handleResponse(response);
            } else {
                // Otherwise, get all tickets
                return jiraService.getTicketsFromBackend();
            }
        } catch (error) {
            console.error('Error fetching component tickets:', error);
            throw error;
        }
    },

    // This will update our backend with the fetched tickets
    syncReadyForReleaseTickets: async (componentId?: string, projectKey: string = 'DNIO'): Promise<void> => {
        try {
            const tickets = await jiraService.getReadyForReleaseTickets(projectKey);

            if (componentId) {
                // If componentId is provided, sync tickets for that component
                await api.post(`/jira/sync/${componentId}`, { tickets });
            } else {
                // Otherwise, sync tickets globally
                await api.post('/jira/sync', { tickets });
            }
        } catch (error) {
            console.error('Error syncing JIRA tickets:', error);
            throw error;
        }
    },

    // Get all tickets from our backend
    getTicketsFromBackend: async (): Promise<JiraTicket[]> => {
        try {
            const response = await api.get<JiraTicket[]>('/jira/tickets');
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching tickets from backend:', error);
            throw error;
        }
    }
}; 