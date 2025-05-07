import api, { handleResponse } from './api';
import { JiraTicket } from '../types';

// JIRA Configuration from environment variables
const JIRA_API_VERSION = process.env.REACT_APP_JIRA_API_VERSION || '3';
const JIRA_EMAIL = process.env.REACT_APP_JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.REACT_APP_JIRA_API_TOKEN;
const JIRA_BASE_URL = process.env.REACT_APP_JIRA_BASE_URL || 'https://appveen.atlassian.net';
const DEFAULT_PROJECT_KEY = process.env.REACT_APP_JIRA_PROJECT_KEY || 'DNIO';

// Debug log for environment variables and auth
// console.log('==== JIRA Service Configuration ====');
// console.log('Base URL:', JIRA_BASE_URL);
// console.log('API Version:', JIRA_API_VERSION);
// console.log('Email:', JIRA_EMAIL);
// console.log('Token Present:', !!JIRA_API_TOKEN);
// console.log('Token Length:', JIRA_API_TOKEN?.length);
// console.log('Auth String:', `${JIRA_EMAIL}:${JIRA_API_TOKEN?.substring(0, 5)}...`);
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

interface JiraStatusResponse {
    id: string;
    name: string;
    subtask: boolean;
    statuses: Array<{
        id: string;
        name: string;
        statusCategory: {
            id: number;
            key: string;
            colorName: string;
            name: string;
        };
    }>;
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

    getTicketsByStatuses: async (projectKey: string = DEFAULT_PROJECT_KEY, statuses: string[]): Promise<JiraTicket[]> => {
        try {
            // If no statuses provided, empty array, or contains 'all', fetch all tickets
            const jql = !statuses.length || statuses.includes('all')
                ? `project=${projectKey}`
                : `project=${projectKey} AND (${statuses.map(status => `status="${status}"`).join(' OR ')})`;

            const response = await jiraApi.get<JiraApiResponse>('/jira/proxy/search', {
                params: {
                    jql,
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

    // Update fetchJiraTickets to use the new method
    fetchJiraTickets: async (statuses: string[] = ['Ready For Release', 'Done', 'In Progress']): Promise<JiraTicket[]> => {
        try {
            const tickets = await jiraService.getTicketsByStatuses(DEFAULT_PROJECT_KEY, statuses);
            return tickets;
        } catch (error) {
            console.error('Error fetching JIRA tickets:', error);
            throw error;
        }
    },

    // Get Ready for Release tickets
    getReadyForReleaseTickets: async (projectKey: string = DEFAULT_PROJECT_KEY): Promise<JiraTicket[]> => {
        return jiraService.getTicketsByStatuses(projectKey, ['Ready For Release']);
    },

    // Get In Progress tickets
    getInProgressTickets: async (projectKey: string = DEFAULT_PROJECT_KEY): Promise<JiraTicket[]> => {
        return jiraService.getTicketsByStatuses(projectKey, ['In Progress']);
    },

    // Get Done tickets
    getDoneTickets: async (projectKey: string = DEFAULT_PROJECT_KEY): Promise<JiraTicket[]> => {
        return jiraService.getTicketsByStatuses(projectKey, ['Done']);
    },

    // Get To Do tickets
    getToDoTickets: async (projectKey: string = DEFAULT_PROJECT_KEY): Promise<JiraTicket[]> => {
        return jiraService.getTicketsByStatuses(projectKey, ['To Do']);
    },

    // Get all tickets regardless of status
    getAllTickets: async (projectKey: string = DEFAULT_PROJECT_KEY): Promise<JiraTicket[]> => {
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

    // Get all tickets from our backend
    getTicketsFromBackend: async (): Promise<JiraTicket[]> => {
        try {
            const response = await api.get<JiraTicket[]>('/jira/tickets');
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching tickets from backend:', error);
            throw error;
        }
    },

    // Get all JIRA statuses
    getAllStatuses: async (projectKey: string = DEFAULT_PROJECT_KEY): Promise<string[]> => {
        try {
            const response = await jiraApi.get<JiraStatusResponse[]>(`/jira/proxy/project/${projectKey}/statuses`);
            const statuses = response.data
                .flatMap(issueType => issueType.statuses.map(status => status.name))
                .filter((value, index, self) => self.indexOf(value) === index)
                .sort();
            return statuses;
        } catch (error) {
            console.error('Error fetching JIRA statuses:', error);
            throw error;
        }
    },

    // Get all available JIRA statuses
    getJiraStatuses: async (projectKey: string = DEFAULT_PROJECT_KEY): Promise<Array<{ id: string; name: string; category: string }>> => {
        try {
            console.log('Fetching JIRA statuses for project:', projectKey);
            const response = await jiraApi.get<JiraStatusResponse[]>(`/jira/proxy/project/${projectKey}/statuses`);
            console.log('JIRA statuses response:', response.data);

            // Extract all unique statuses from all issue types
            const uniqueStatuses = new Map<string, { id: string; name: string; category: string }>();

            response.data.forEach(issueType => {
                issueType.statuses.forEach(status => {
                    // Use status name as key to avoid duplicates
                    uniqueStatuses.set(status.name, {
                        id: status.id,
                        name: status.name,
                        category: status.statusCategory.name
                    });
                });
            });

            // Convert Map to array and sort by name
            const result = Array.from(uniqueStatuses.values()).sort((a, b) => a.name.localeCompare(b.name));
            console.log('Processed JIRA statuses:', result);
            return result;
        } catch (error: any) {
            console.error('Error fetching JIRA statuses:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            // Return default statuses if API fails
            const defaultStatuses = [
                { id: '1', name: 'OPEN', category: 'To Do' },
                { id: '10018', name: 'Dev in progress', category: 'In Progress' },
                { id: '10019', name: 'QA in progress', category: 'In Progress' },
                { id: '10095', name: 'QA Ready', category: 'To Do' },
                { id: '10054', name: 'Need Info-QA', category: 'To Do' },
                { id: '10118', name: 'Need Info-Customer', category: 'To Do' },
                { id: '10123', name: 'Ready for Release', category: 'Done' },
                { id: '6', name: 'Closed', category: 'Done' }
            ];
            console.log('Using default statuses:', defaultStatuses);
            return defaultStatuses;
        }
    }
}; 