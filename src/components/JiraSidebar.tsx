import React, { useEffect, useState } from 'react';
import { JiraTicket } from '../types';
import { jiraService } from '../services/jiraService';
import './JiraSidebar.css';

interface JiraSidebarProps {
  componentId: string;
  jiraProjectKey: string;
}

const JiraSidebar: React.FC<JiraSidebarProps> = ({
  componentId,
  jiraProjectKey,
}) => {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`/api/jira/component/${componentId}`);
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to fetch tickets');
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [componentId]);

  return (
    <div className="jira-sidebar">
      <div className="jira-sidebar-header">
        <h3>JIRA Tickets</h3>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="jira-tickets-list">
        {tickets.length === 0 ? (
          <div className="no-tickets">No tickets ready for release</div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.ticketId} className="ticket-card">
              <div className="ticket-header">
                <a
                  href={`${process.env.REACT_APP_JIRA_BASE_URL}/browse/${ticket.ticketId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ticket-id"
                >
                  {ticket.ticketId}
                </a>
                <span className="ticket-status">{ticket.status}</span>
              </div>
              <div className="ticket-summary">{ticket.summary}</div>
              <div className="ticket-footer">
                <span className="ticket-assignee">{ticket.assignee}</span>
                <span className="ticket-updated">
                  {new Date(ticket.updated).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JiraSidebar;
