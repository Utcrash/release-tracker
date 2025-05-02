import React, { useEffect, useState, useRef } from 'react';
import { JiraTicket } from '../types';
import { jiraService } from '../services/jiraService';
import 'bootstrap/dist/css/bootstrap.min.css';
import './JiraTickets.css';

const JiraTickets: React.FC = () => {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const initialFetchDone = useRef(false);

  const getPriorityColor = (priority: string | undefined): string => {
    if (!priority) return 'secondary';

    const priorityLower = priority.toLowerCase();
    switch (priorityLower) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const fetchTickets = async (isUserInitiated = false) => {
    // Skip if we're already fetching or if it's the initial load and we've already done it
    if (syncing || (!isUserInitiated && initialFetchDone.current)) return;

    try {
      setSyncing(true);
      const data = await jiraService.getReadyForReleaseTickets('DNIO');
      setTickets(data);
      setError(null);
      initialFetchDone.current = true;
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(
        'Failed to fetch tickets. Please check your JIRA configuration.'
      );
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  // User-initiated refresh
  const handleRefresh = () => {
    fetchTickets(true);
  };

  useEffect(() => {
    fetchTickets();
    // We use the cleanup function as a guarantee this won't run twice
    return () => {
      initialFetchDone.current = true;
    };
  }, []);

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.assignee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <div className="dark-theme min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  return (
    <div className="dark-theme min-vh-100 py-4">
      <div className="container">
        <div className="row mb-4">
          <div className="col">
            <h1 className="text-light mb-2">Ready for Release - DNIO</h1>
            <p className="text-light-muted mb-4">
              View tickets that are ready for release in project DNIO
            </p>
            {error && <div className="alert alert-danger">{error}</div>}
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-10">
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary">
                <i className="bi bi-search text-light"></i>
              </span>
              <input
                type="text"
                className="form-control bg-dark text-light border-secondary"
                placeholder="Search tickets by ID, summary, or assignee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-outline-light w-100"
              onClick={handleRefresh}
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Refreshing...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        <div className="card bg-dark border-secondary mb-4">
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0">
              <thead>
                <tr className="border-secondary">
                  <th className="border-secondary">Ticket ID</th>
                  <th className="border-secondary">Summary</th>
                  <th className="border-secondary">Assignee</th>
                  <th className="border-secondary">Priority</th>
                  <th className="border-secondary">Components</th>
                  <th className="border-secondary">Fix Versions</th>
                  <th className="border-secondary">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center p-4 text-light-muted border-secondary"
                    >
                      {searchTerm
                        ? 'No tickets found matching your search'
                        : 'No tickets found in Ready for Release status'}
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.ticketId} className="border-secondary">
                      <td className="border-secondary">
                        <a
                          href={`${process.env.REACT_APP_JIRA_BASE_URL}/browse/${ticket.ticketId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-info text-decoration-none"
                        >
                          {ticket.ticketId}
                        </a>
                      </td>
                      <td className="border-secondary text-light">
                        {ticket.summary}
                      </td>
                      <td className="border-secondary text-light">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-person-circle me-2"></i>
                          {ticket.assignee}
                        </div>
                      </td>
                      <td className="border-secondary">
                        {ticket.priority && (
                          <span
                            className={`badge bg-${getPriorityColor(
                              ticket.priority
                            )}`}
                          >
                            {ticket.priority}
                          </span>
                        )}
                      </td>
                      <td className="border-secondary">
                        {ticket.components.map((component, index) => (
                          <span
                            key={index}
                            className="badge bg-dark border border-secondary me-1"
                          >
                            {component}
                          </span>
                        ))}
                      </td>
                      <td className="border-secondary">
                        {ticket.fixVersions.map((version, index) => (
                          <span
                            key={index}
                            className="badge bg-dark border border-success text-success me-1"
                          >
                            {version}
                          </span>
                        ))}
                      </td>
                      <td className="border-secondary text-light-muted">
                        {new Date(ticket.updated).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card bg-dark border-secondary">
          <div className="card-header border-secondary">
            <h6 className="mb-0 text-light">Priority Legend</h6>
          </div>
          <div className="card-body">
            <span className="badge bg-danger me-3">Critical</span>
            <span className="badge bg-warning me-3">High</span>
            <span className="badge bg-info me-3">Medium</span>
            <span className="badge bg-success me-3">Low</span>
            <span className="badge bg-secondary">Unknown</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JiraTickets;
