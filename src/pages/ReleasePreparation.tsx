import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Component, Ticket, Release, JiraTicket } from '../types';
import { componentService } from '../services/componentService';
import { ticketService } from '../services/ticketService';
import { releaseService } from '../services/releaseService';
import JiraSidebar from '../components/JiraSidebar';
import 'bootstrap/dist/css/bootstrap.min.css';

type RouteParams = {
  id?: string;
};

const ReleasePreparation: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const navigate = useNavigate();
  const [component, setComponent] = useState<Component | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [version, setVersion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;

        console.log('Fetching component with ID or slug:', id);

        // Try to fetch the component
        try {
          const componentData = await componentService.getComponentById(id);
          setComponent(componentData);

          // Now fetch tickets using the component's ID or slug
          try {
            const ticketData = await ticketService.getTicketsByServiceId(
              componentData._id || id
            );
            setTickets(ticketData);
          } catch (ticketError) {
            console.error('Error fetching tickets:', ticketError);
            // Continue even if tickets can't be fetched
          }
        } catch (componentError) {
          console.error('Error fetching component:', componentError);
          setError('Component not found. Please check the URL and try again.');
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleTicketSelect = (ticketId: string) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleCreateRelease = async () => {
    if (!component || !version.trim()) return;

    try {
      // Convert selected ticket IDs to a format compatible with our API
      // The backend will map these to JiraTicket references
      const ticketsForApi = selectedTickets.map((id) => ({
        ticketId: id,
        // Include minimal required JiraTicket properties
        summary: tickets.find((t) => t._id === id)?.summary || '',
        status: tickets.find((t) => t._id === id)?.status || '',
        assignee: tickets.find((t) => t._id === id)?.assignee || '',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        components: [],
        fixVersions: [],
      }));

      const release = {
        serviceId: component._id,
        version,
        createdAt: new Date().toISOString(),
        releasedBy: 'current-user@example.com', // Replace with actual user
        commitRange: {
          from: 'start-commit', // Replace with actual commit range
          to: 'end-commit',
        },
        tickets: ticketsForApi, // Now properly typed as JiraTicket[]
        commits: [], // To be implemented
        jenkinsBuildUrl: `${component.jenkinsJob}/latest`,
        status: 'pending',
        changelog: {
          features: [],
          fixes: [],
        },
      };

      await releaseService.createRelease(release);
      // Redirect or show success message
    } catch (err) {
      setError('Failed to create release');
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="alert alert-danger m-3">{error}</div>;
  if (!component)
    return <div className="alert alert-warning m-3">Component not found</div>;

  return (
    <div className="release-preparation">
      <div className="main-content" style={{ marginRight: '350px' }}>
        <div className="container mt-4">
          <div className="row mb-4">
            <div className="col">
              <h1>Release Preparation: {component.name}</h1>
              <p className="text-muted">
                Prepare a new release for {component.name} by selecting JIRA
                tickets and commits.
              </p>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-md-8">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Release Details</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Version</label>
                    <input
                      type="text"
                      className="form-control"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="e.g., v1.0.0"
                    />
                  </div>

                  <h6 className="mb-3">Ready for Release Tickets</h6>
                  <div className="list-group">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket._id}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <input
                            type="checkbox"
                            className="form-check-input me-2"
                            checked={selectedTickets.includes(ticket._id)}
                            onChange={() => handleTicketSelect(ticket._id)}
                          />
                          <span className="ms-2">
                            {ticket._id}: {ticket.summary}
                          </span>
                        </div>
                        <span className="badge bg-primary rounded-pill">
                          {ticket.type}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn btn-primary mt-4"
                    onClick={handleCreateRelease}
                    disabled={!version.trim() || selectedTickets.length === 0}
                  >
                    Create Release
                  </button>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Component Info</h5>
                </div>
                <div className="card-body">
                  <p>
                    <strong>Repository:</strong> {component.bitbucketRepo}
                  </p>
                  <p>
                    <strong>JIRA Project:</strong> {component.jiraProjectKey}
                  </p>
                  <p>
                    <strong>Jenkins Job:</strong> {component.jenkinsJob}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <JiraSidebar
        componentId={component._id}
        jiraProjectKey={component.jiraProjectKey}
      />
    </div>
  );
};

export default ReleasePreparation;
