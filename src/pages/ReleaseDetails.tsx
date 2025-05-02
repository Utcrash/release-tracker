import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Release, JiraTicket } from '../types';
import { releaseService } from '../services/releaseService';
import { jiraService } from '../services/jiraService';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/darkTheme.css';

type RouteParams = {
  id?: string;
};

const ReleaseDetails: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const [release, setRelease] = useState<Release | null>(null);
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;

        console.log('Fetching release with ID:', id);

        try {
          const releaseData = await releaseService.getReleaseById(id);
          setRelease(releaseData);

          // Process tickets
          let ticketsToShow: JiraTicket[] = [];

          // If release has populated tickets directly
          if (releaseData.tickets && releaseData.tickets.length > 0) {
            // These are already JiraTicket objects
            ticketsToShow = [...releaseData.tickets];
          }
          // If release has jiraTickets that are populated
          else if (
            releaseData.jiraTickets &&
            releaseData.jiraTickets.length > 0
          ) {
            if (typeof releaseData.jiraTickets[0] === 'string') {
              // These are just IDs, need to fetch the actual tickets
              console.log(
                'Fetching ticket details for IDs:',
                releaseData.jiraTickets
              );
              // This would require another API call to fetch details for these IDs
            } else {
              // These are already populated JiraTicket objects
              ticketsToShow = [...(releaseData.jiraTickets as JiraTicket[])];
            }
          }

          setTickets(ticketsToShow);
        } catch (releaseError) {
          console.error('Error fetching release:', releaseError);
          setError('Release not found. Please check the URL and try again.');
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

  if (loading) {
    return (
      <div className="dark-theme min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dark-theme min-vh-100 py-4">
        <div className="container">
          <div className="alert alert-danger m-3">{error}</div>
          <Link to="/releases" className="btn btn-primary">
            Back to Releases
          </Link>
        </div>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="dark-theme min-vh-100 py-4">
        <div className="container">
          <div className="alert alert-warning m-3">Release not found</div>
          <Link to="/releases" className="btn btn-primary">
            Back to Releases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dark-theme min-vh-100 py-4">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="text-light">Release: {release.version}</h1>
          <div>
            <Link
              to={`/edit-release/${release._id}`}
              className="btn btn-primary me-2"
            >
              Edit Release
            </Link>
            <Link to="/releases" className="btn btn-outline-secondary">
              Back to Releases
            </Link>
          </div>
        </div>

        <div className="row">
          <div className="col-md-8">
            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header border-secondary">
                <h5 className="mb-0 text-light">Release Details</h5>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-4 text-light-muted">Version:</div>
                  <div className="col-md-8 text-light">{release.version}</div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4 text-light-muted">Release Date:</div>
                  <div className="col-md-8 text-light">
                    {new Date(release.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4 text-light-muted">Status:</div>
                  <div className="col-md-8">
                    <span
                      className={`badge bg-${
                        release.status.toLowerCase() === 'released'
                          ? 'success'
                          : release.status.toLowerCase() === 'planned'
                          ? 'info'
                          : 'warning'
                      }`}
                    >
                      {release.status}
                    </span>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4 text-light-muted">Released By:</div>
                  <div className="col-md-8 text-light">
                    {release.releasedBy || 'N/A'}
                  </div>
                </div>
                {release.notes && (
                  <div className="row mb-3">
                    <div className="col-md-4 text-light-muted">Notes:</div>
                    <div className="col-md-8 text-light">{release.notes}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header border-secondary">
                <h5 className="mb-0 text-light">Tickets ({tickets.length})</h5>
              </div>
              <div className="card-body">
                {tickets.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-dark table-hover">
                      <thead>
                        <tr className="border-secondary">
                          <th className="border-secondary">Ticket ID</th>
                          <th className="border-secondary">Summary</th>
                          <th className="border-secondary">Status</th>
                          <th className="border-secondary">Assignee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((ticket) => (
                          <tr
                            key={ticket.ticketId}
                            className="border-secondary"
                          >
                            <td className="border-secondary">
                              <a
                                href={`${
                                  process.env.REACT_APP_JIRA_BASE_URL ||
                                  'https://jira.example.com'
                                }/browse/${ticket.ticketId}`}
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
                              {ticket.status}
                            </td>
                            <td className="border-secondary text-light">
                              {ticket.assignee}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-light-muted">
                    No tickets found for this release.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            {release.componentDeliveries &&
              release.componentDeliveries.length > 0 && (
                <div className="card bg-dark border-secondary mb-4">
                  <div className="card-header border-secondary">
                    <h5 className="mb-0 text-light">Components</h5>
                  </div>
                  <div className="card-body">
                    <div className="list-group bg-dark">
                      {release.componentDeliveries.map((component, index) => (
                        <div
                          key={index}
                          className="list-group-item bg-dark border-secondary text-light"
                        >
                          <h6>{component.name}</h6>
                          {component.dockerHubLink && (
                            <div className="mb-2">
                              <small className="text-light-muted">
                                DockerHub:
                              </small>{' '}
                              <a
                                href={component.dockerHubLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-info text-decoration-none"
                              >
                                {component.dockerHubLink}
                              </a>
                            </div>
                          )}
                          {component.eDeliveryLink && (
                            <div>
                              <small className="text-light-muted">
                                E-Delivery:
                              </small>{' '}
                              <a
                                href={component.eDeliveryLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-info text-decoration-none"
                              >
                                {component.eDeliveryLink}
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            {release.additionalPoints &&
              release.additionalPoints.length > 0 && (
                <div className="card bg-dark border-secondary mb-4">
                  <div className="card-header border-secondary">
                    <h5 className="mb-0 text-light">Additional Points</h5>
                  </div>
                  <div className="card-body">
                    <ul className="list-group bg-dark">
                      {release.additionalPoints.map((point, index) => (
                        <li
                          key={index}
                          className="list-group-item bg-dark border-secondary text-light"
                        >
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleaseDetails;
