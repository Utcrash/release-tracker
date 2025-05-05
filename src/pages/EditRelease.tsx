import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Release, ComponentDelivery, JiraTicket } from '../types';
import { releaseService } from '../services/releaseService';
import { jiraService } from '../services/jiraService';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/darkTheme.css';

type RouteParams = {
  id?: string;
};

interface EditReleaseFormData {
  version: string;
  releaseDate: string;
  status: string;
  notes: string;
  additionalPoints: string[];
  componentDeliveries: ComponentDelivery[];
  jiraTickets: JiraTicket[];
}

const EditRelease: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const navigate = useNavigate();
  const [release, setRelease] = useState<Release | null>(null);
  const [initialVersion, setInitialVersion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableJiraTickets, setAvailableJiraTickets] = useState<
    JiraTicket[]
  >([]);
  const [isLoadingJiraTickets, setIsLoadingJiraTickets] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fixVersionFilter, setFixVersionFilter] = useState<string>('all');
  const [availableFixVersions, setAvailableFixVersions] = useState<string[]>(
    []
  );
  const [formData, setFormData] = useState<EditReleaseFormData>({
    version: '',
    releaseDate: '',
    status: '',
    notes: '',
    additionalPoints: [''],
    componentDeliveries: [],
    jiraTickets: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;

        console.log('Fetching release with ID:', id);

        try {
          const releaseData = await releaseService.getReleaseById(id);
          setRelease(releaseData);
          setInitialVersion(releaseData.version);

          // Initialize form data
          setFormData({
            version: releaseData.version || '',
            releaseDate: new Date(releaseData.createdAt)
              .toISOString()
              .split('T')[0],
            status: releaseData.status || 'Planned',
            notes: releaseData.notes || '',
            additionalPoints: releaseData.additionalPoints?.length
              ? releaseData.additionalPoints
              : [''],
            componentDeliveries: releaseData.componentDeliveries?.length
              ? releaseData.componentDeliveries
              : [],
            jiraTickets: Array.isArray(releaseData.jiraTickets)
              ? releaseData.jiraTickets.map((ticket) => {
                  // Handle if the ticket is just a string ID or a full JiraTicket object
                  if (typeof ticket === 'string') {
                    return {
                      ticketId: ticket,
                      summary: '',
                      status: '',
                      assignee: '',
                      created: '',
                      updated: '',
                      components: [],
                      fixVersions: [],
                    };
                  }
                  return ticket as JiraTicket;
                })
              : [],
          });
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
    fetchJiraTickets();
  }, [id]);

  const fetchJiraTickets = async () => {
    try {
      setIsLoadingJiraTickets(true);
      // Fetch tickets that are ready for release
      const readyTickets = await jiraService.getReadyForReleaseTickets();
      // Fetch tickets that are already in Done status
      const doneTickets = await jiraService.getDoneTickets();
      // Fetch in progress tickets
      const inProgressTickets = await jiraService.getInProgressTickets();

      // Combine and remove duplicates
      const allTickets = [
        ...readyTickets,
        ...doneTickets,
        ...inProgressTickets,
      ];
      const uniqueTickets = allTickets.filter(
        (ticket, index, self) =>
          index === self.findIndex((t) => t.ticketId === ticket.ticketId)
      );

      // Extract all fix versions
      const fixVersions = new Set<string>();
      uniqueTickets.forEach((ticket) => {
        ticket.fixVersions.forEach((version) => {
          if (version) fixVersions.add(version);
        });
      });

      setAvailableFixVersions(Array.from(fixVersions).sort());
      setAvailableJiraTickets(uniqueTickets);
    } catch (error) {
      console.error('Error fetching JIRA tickets:', error);
    } finally {
      setIsLoadingJiraTickets(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleJiraTicketToggle = (ticket: JiraTicket) => {
    setFormData((prev) => {
      const ticketExists = prev.jiraTickets.some(
        (t) => t.ticketId === ticket.ticketId
      );

      if (ticketExists) {
        // Remove the ticket if it's already selected
        return {
          ...prev,
          jiraTickets: prev.jiraTickets.filter(
            (t) => t.ticketId !== ticket.ticketId
          ),
        };
      } else {
        // Add the ticket if it's not already selected
        return {
          ...prev,
          jiraTickets: [...prev.jiraTickets, ticket],
        };
      }
    });
  };

  const handleJiraTicketSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      // If search is empty, just apply filters
      applyFilters(availableJiraTickets);
      return;
    }

    try {
      setIsLoadingJiraTickets(true);
      const response = await jiraService.getAllTickets();
      const filteredTickets = response.filter(
        (ticket) =>
          ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
      applyFilters(filteredTickets);
    } catch (error) {
      console.error('Error searching JIRA tickets:', error);
    } finally {
      setIsLoadingJiraTickets(false);
    }
  };

  const applyFilters = (tickets: JiraTicket[]) => {
    let filtered = [...tickets];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    // Apply fix version filter
    if (fixVersionFilter !== 'all') {
      filtered = filtered.filter((ticket) =>
        ticket.fixVersions.some((version) => version === fixVersionFilter)
      );
    }

    setAvailableJiraTickets(filtered);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    applyFilters(availableJiraTickets);
  };

  const handleFixVersionFilterChange = (version: string) => {
    setFixVersionFilter(version);
    applyFilters(availableJiraTickets);
  };

  const handleAddPoint = () => {
    setFormData((prev) => ({
      ...prev,
      additionalPoints: [...prev.additionalPoints, ''],
    }));
  };

  const handlePointChange = (index: number, value: string) => {
    const newPoints = [...formData.additionalPoints];
    newPoints[index] = value;
    setFormData((prev) => ({
      ...prev,
      additionalPoints: newPoints,
    }));
  };

  const handleRemovePoint = (index: number) => {
    const newPoints = formData.additionalPoints.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      additionalPoints: newPoints,
    }));
  };

  const handleComponentLinkChange = (
    index: number,
    field: 'dockerHubLink' | 'eDeliveryLink',
    value: string
  ) => {
    const newComponentDeliveries = [...formData.componentDeliveries];
    newComponentDeliveries[index] = {
      ...newComponentDeliveries[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      componentDeliveries: newComponentDeliveries,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !release) return;

    try {
      setSubmitting(true);

      const updateData = {
        version: formData.version,
        createdAt: formData.releaseDate,
        status: formData.status,
        notes: formData.notes,
        additionalPoints: formData.additionalPoints.filter(
          (point) => point.trim() !== ''
        ),
        componentDeliveries: formData.componentDeliveries.map((comp) => ({
          ...comp,
          dockerHubLink: comp.dockerHubLink?.trim() || null,
          eDeliveryLink: comp.eDeliveryLink?.trim() || null,
        })),
        jiraTickets: formData.jiraTickets.map((ticket) => ticket.ticketId),
      };

      await releaseService.updateRelease(id, updateData);

      // If the version changed, navigate to the new URL based on the new version
      if (formData.version !== initialVersion) {
        navigate(`/releases/${formData.version}`);
      } else {
        // Navigate to release details page
        navigate(`/releases/${id}`);
      }
    } catch (error) {
      console.error('Failed to update release:', error);
      setError('Failed to update release. Please try again.');
      setSubmitting(false);
    }
  };

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
        <div className="row mb-4">
          <div className="col">
            <h1 className="text-light mb-2">Edit Release: {release.version}</h1>
            <p className="text-light-muted mb-4">
              Update the details of this release
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-8">
              <div className="card bg-dark border-secondary mb-4">
                <div className="card-header border-secondary">
                  <h5 className="mb-0 text-light">Release Details</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label htmlFor="version" className="form-label text-light">
                      Version Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control bg-dark text-light border-secondary"
                      id="version"
                      name="version"
                      value={formData.version}
                      onChange={handleInputChange}
                      placeholder="e.g. 1.2.3"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="releaseDate"
                      className="form-label text-light"
                    >
                      Release Date
                    </label>
                    <input
                      type="date"
                      className="form-control bg-dark text-light border-secondary"
                      id="releaseDate"
                      name="releaseDate"
                      value={formData.releaseDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="status" className="form-label text-light">
                      Status
                    </label>
                    <select
                      className="form-select bg-dark text-light border-secondary"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Released">Released</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="notes" className="form-label text-light">
                      Release Notes
                    </label>
                    <textarea
                      className="form-control bg-dark text-light border-secondary"
                      id="notes"
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="General notes about this release"
                    ></textarea>
                  </div>

                  <div className="card bg-dark-secondary border-secondary mb-4">
                    <div className="card-header border-secondary d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 text-light">JIRA Tickets</h5>
                      <span className="badge bg-primary">
                        {formData.jiraTickets.length} selected
                      </span>
                    </div>
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-md-12">
                          <input
                            type="text"
                            className="form-control bg-dark text-light border-secondary"
                            placeholder="Search JIRA tickets..."
                            onChange={(e) =>
                              handleJiraTicketSearch(e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label className="form-label text-light">
                            Status Filter
                          </label>
                          <select
                            className="form-select bg-dark text-light border-secondary"
                            value={statusFilter}
                            onChange={(e) =>
                              handleStatusFilterChange(e.target.value)
                            }
                          >
                            <option value="all">All Statuses</option>
                            <option value="Open">Open</option>
                            <option value="Closed">Closed</option>
                            <option value="Ready For Release">
                              Ready For Release
                            </option>
                            <option value="Re-Open">Re-Open</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label text-light">
                            Fix Version
                          </label>
                          <select
                            className="form-select bg-dark text-light border-secondary"
                            value={fixVersionFilter}
                            onChange={(e) =>
                              handleFixVersionFilterChange(e.target.value)
                            }
                          >
                            <option value="all">All Versions</option>
                            {availableFixVersions.map((version) => (
                              <option key={version} value={version}>
                                {version}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {isLoadingJiraTickets ? (
                        <div className="text-center py-3">
                          <span
                            className="spinner-border spinner-border-sm text-light me-2"
                            role="status"
                          ></span>
                          <span className="text-light">Loading tickets...</span>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-dark table-hover table-bordered mb-0">
                            <thead>
                              <tr>
                                <th
                                  className="border-secondary"
                                  style={{ width: '1%' }}
                                ></th>
                                <th className="border-secondary">Key</th>
                                <th className="border-secondary">Summary</th>
                                <th className="border-secondary">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {availableJiraTickets.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="text-center border-secondary"
                                  >
                                    No tickets available. Try another search or
                                    fetch more tickets.
                                  </td>
                                </tr>
                              ) : (
                                availableJiraTickets.map((ticket) => {
                                  const isSelected = formData.jiraTickets.some(
                                    (t) => t.ticketId === ticket.ticketId
                                  );
                                  return (
                                    <tr
                                      key={ticket.ticketId}
                                      className={`border-secondary ${
                                        isSelected
                                          ? 'bg-primary bg-opacity-25'
                                          : ''
                                      }`}
                                      onClick={() =>
                                        handleJiraTicketToggle(ticket)
                                      }
                                      style={{ cursor: 'pointer' }}
                                    >
                                      <td className="border-secondary text-center">
                                        <input
                                          type="checkbox"
                                          className="form-check-input"
                                          checked={isSelected}
                                          onChange={() => {}} // Handle change is done in row click
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </td>
                                      <td className="border-secondary">
                                        <a
                                          href={`https://appveen.atlassian.net/browse/${ticket.ticketId}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-decoration-none"
                                        >
                                          {ticket.ticketId}
                                        </a>
                                      </td>
                                      <td className="border-secondary">
                                        {ticket.summary}
                                      </td>
                                      <td className="border-secondary">
                                        <span
                                          className={`badge ${
                                            ticket.status === 'Done'
                                              ? 'bg-success'
                                              : ticket.status ===
                                                'Ready For Release'
                                              ? 'bg-info'
                                              : ticket.status === 'In Progress'
                                              ? 'bg-warning'
                                              : 'bg-secondary'
                                          }`}
                                        >
                                          {ticket.status}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-light d-flex justify-content-between">
                      <span>Additional Points</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        onClick={handleAddPoint}
                      >
                        <i className="bi bi-plus"></i> Add
                      </button>
                    </label>

                    {formData.additionalPoints.map((point, index) => (
                      <div key={index} className="input-group mb-2">
                        <input
                          type="text"
                          className="form-control bg-dark text-light border-secondary"
                          value={point}
                          onChange={(e) =>
                            handlePointChange(index, e.target.value)
                          }
                          placeholder="Additional item not in JIRA"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => handleRemovePoint(index)}
                          disabled={
                            formData.additionalPoints.length === 1 &&
                            index === 0
                          }
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              {formData.jiraTickets.length > 0 && (
                <div className="card bg-dark border-secondary mb-4">
                  <div className="card-header border-secondary">
                    <h5 className="mb-0 text-light">Selected Tickets</h5>
                  </div>
                  <div className="card-body">
                    <ul className="list-group">
                      {formData.jiraTickets.map((ticket) => (
                        <li
                          key={ticket.ticketId}
                          className="list-group-item bg-dark text-light border-secondary d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <strong>{ticket.ticketId}</strong>
                            {ticket.summary && (
                              <div className="small text-muted">
                                {ticket.summary}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleJiraTicketToggle(ticket)}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {formData.componentDeliveries.length > 0 && (
                <div className="card bg-dark border-secondary mb-4">
                  <div className="card-header border-secondary">
                    <h5 className="mb-0 text-light">Components</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-dark table-bordered mb-0">
                        <thead>
                          <tr className="border-secondary">
                            <th className="border-secondary">Component</th>
                            <th className="border-secondary">DockerHub Link</th>
                            <th className="border-secondary">
                              E-Delivery Link
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.componentDeliveries.map(
                            (component, index) => (
                              <tr key={index} className="border-secondary">
                                <td className="border-secondary text-light">
                                  {component.name}
                                </td>
                                <td className="border-secondary">
                                  <input
                                    type="text"
                                    className="form-control bg-dark text-light border-secondary"
                                    value={component.dockerHubLink || ''}
                                    onChange={(e) =>
                                      handleComponentLinkChange(
                                        index,
                                        'dockerHubLink',
                                        e.target.value
                                      )
                                    }
                                    placeholder="DockerHub URL"
                                  />
                                </td>
                                <td className="border-secondary">
                                  <input
                                    type="text"
                                    className="form-control bg-dark text-light border-secondary"
                                    value={component.eDeliveryLink || ''}
                                    onChange={(e) =>
                                      handleComponentLinkChange(
                                        index,
                                        'eDeliveryLink',
                                        e.target.value
                                      )
                                    }
                                    placeholder="E-Delivery URL"
                                  />
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="card bg-dark border-secondary">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <Link
                      to={`/releases/${id}`}
                      className="btn btn-outline-secondary"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting || !formData.version}
                    >
                      {submitting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-1"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRelease;
