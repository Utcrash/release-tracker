export interface Component {
    _id: string;
    name: string;
    slug: string;
    bitbucketRepo: string;
    jiraProjectKey: string;
    jenkinsJob: string;
    latestReleaseVersion?: string;
    readyForReleaseTickets?: number;
}

// JIRA API Response Types
export interface JiraApiResponse {
    issues: JiraIssue[];
    maxResults: number;
    startAt: number;
    total: number;
}

export interface JiraIssue {
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
        components?: {
            name: string;
        }[];
        fixVersions?: {
            name: string;
        }[];
    };
}

export interface Ticket {
    _id: string;
    type: string;
    summary: string;
    status: string;
    assignee: string;
    url: string;
    serviceId: string;
}

export interface Commit {
    _id: string;
    message: string;
    author: string;
    date: string;
    ticketIds: string[];
    serviceId: string;
}

export interface ComponentDelivery {
    name: string;
    dockerHubLink?: string | null;
    eDeliveryLink?: string | null;
}

export interface Release {
    _id: string;
    serviceId?: string;
    version: string;
    createdAt: string;
    releasedBy?: string;
    commitRange?: {
        from: string;
        to: string;
    };
    tickets?: JiraTicket[];
    jiraTickets?: string[] | JiraTicket[];
    commits?: string[];
    jenkinsBuildUrl?: string;
    status: string;
    changelog?: {
        features: string[];
        fixes: string[];
    };
    notes?: string;
    additionalPoints?: string[];
    componentDeliveries?: ComponentDelivery[];
    customer?: string;
}

export interface JiraTicket {
    ticketId: string;
    summary: string;
    status: string;
    priority?: string;
    assignee: string;
    created: string;
    updated: string;
    components: string[];
    fixVersions: string[];
} 