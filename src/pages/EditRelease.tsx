import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Select, { MultiValue } from 'react-select';
import { Release, ComponentDelivery, JiraTicket } from '../types';
import { releaseService, UpdateReleaseDto } from '../services/releaseService';
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
  customer: string;
}

interface JiraStatus {
  id: string;
  name: string;
  category: string;
}

interface Option {
  value: string;
  label: string;
}

interface JiraTicketOption {
  value: string;
  label: string;
  ticket: JiraTicket;
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
  const [statusFilter, setStatusFilter] = useState<string[]>([
    'Ready For Release',
  ]);
  const [fixVersionFilter, setFixVersionFilter] = useState<string[]>(['all']);
  const [availableFixVersions, setAvailableFixVersions] = useState<string[]>(
    []
  );
  const [availableStatuses, setAvailableStatuses] = useState<JiraStatus[]>([]);
  const [formData, setFormData] = useState<EditReleaseFormData>({
    version: '',
    releaseDate: '',
    status: '',
    notes: '',
    additionalPoints: [''],
    componentDeliveries: [],
    jiraTickets: [],
    customer: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !release) return;

    try {
      setSubmitting(true);

      // Create the update data object with proper typing
      const updateData: UpdateReleaseDto = {
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
        customer: formData.customer,
      };

      // For backend compatibility, use 'tickets' instead of 'jiraTickets'
      const ticketsForUpdate = formData.jiraTickets.map((ticket) => ({
        ticketId: ticket.ticketId,
        summary: ticket.summary || '',
        status: ticket.status || '',
        priority: ticket.priority || '',
        assignee: ticket.assignee || '',
        created: ticket.created || new Date().toISOString(),
        updated: ticket.updated || new Date().toISOString(),
        components: ticket.components || [],
        fixVersions: ticket.fixVersions || [],
      }));

      updateData.tickets = ticketsForUpdate;

      await releaseService.updateRelease(id, updateData);

      if (formData.version !== initialVersion) {
        navigate(`/releases/${formData.version}`);
      } else {
        navigate(`/releases/${id}`);
      }
    } catch (error) {
      console.error('Failed to update release:', error);
      setError('Failed to update release. Please try again.');
      setSubmitting(false);
    }
  };

  const handleJiraTicketSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
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
    if (!statusFilter.includes('all')) {
      filtered = filtered.filter((ticket) =>
        statusFilter.includes(ticket.status)
      );
    }

    // Apply fix version filter
    if (!fixVersionFilter.includes('all')) {
      filtered = filtered.filter((ticket) =>
        ticket.fixVersions.some((version) => fixVersionFilter.includes(version))
      );
    }

    setAvailableJiraTickets(filtered);
  };

  // Custom styles for react-select
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      background: '#212529',
      borderColor: '#6c757d',
      '&:hover': {
        borderColor: '#6c757d',
      },
    }),
    menu: (base: any) => ({
      ...base,
      background: '#212529',
      border: '1px solid #6c757d',
    }),
    option: (base: any, state: any) => ({
      ...base,
      background: state.isFocused ? '#2c3034' : '#212529',
      color: '#fff',
      '&:hover': {
        background: '#2c3034',
      },
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#fff',
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: '#2c3034',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: '#fff',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: '#fff',
      '&:hover': {
        background: '#dc3545',
        color: '#fff',
      },
    }),
    input: (base: any) => ({
      ...base,
      color: '#fff',
    }),
  };

  // Convert status array to options format
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...availableStatuses.map((status) => ({
      value: status.name,
      label: status.name,
    })),
  ];

  // Convert fix versions array to options format
  const fixVersionOptions = [
    { value: 'all', label: 'All Fix Versions' },
    ...availableFixVersions.map((version) => ({
      value: version,
      label: version,
    })),
  ];

  const handleStatusChange = (selectedOptions: MultiValue<Option>) => {
    if (!selectedOptions || selectedOptions.length === 0) {
      setStatusFilter(['all']);
      return;
    }
    const values = selectedOptions.map((option) => option.value);
    if (values.includes('all')) {
      setStatusFilter(['all']);
    } else {
      setStatusFilter(values);
    }
  };

  const handleFixVersionChange = (selectedOptions: MultiValue<Option>) => {
    if (!selectedOptions || selectedOptions.length === 0) {
      setFixVersionFilter(['all']);
      return;
    }
    const values = selectedOptions.map((option) => option.value);
    if (values.includes('all')) {
      setFixVersionFilter(['all']);
    } else {
      setFixVersionFilter(values);
    }
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
            customer: releaseData.customer || '',
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
    fetchStatuses();
  }, [id]);

  const fetchJiraTickets = async () => {
    try {
      setIsLoadingJiraTickets(true);
      // If 'all' is selected or no statuses selected, fetch all tickets
      const data = await jiraService.getTicketsByStatuses(
        'DNIO',
        !statusFilter.length || statusFilter.includes('all') ? [] : statusFilter
      );

      // Extract all fix versions
      const fixVersions = new Set<string>();
      data.forEach((ticket) => {
        ticket.fixVersions.forEach((version) => {
          if (version) fixVersions.add(version);
        });
      });

      setAvailableFixVersions(Array.from(fixVersions).sort());
      setAvailableJiraTickets(data);
    } catch (error) {
      console.error('Error fetching JIRA tickets:', error);
    } finally {
      setIsLoadingJiraTickets(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const statuses = await jiraService.getJiraStatuses();
      setAvailableStatuses(statuses);
    } catch (error) {
      console.error('Error fetching JIRA statuses:', error);
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

  // Convert JIRA tickets to options format
  const jiraTicketOptions = availableJiraTickets.map((ticket) => ({
    value: ticket.ticketId,
    label: `${ticket.ticketId} - ${ticket.summary}`,
    ticket: ticket,
  }));

  const handleJiraTicketChange = (
    selectedOptions: MultiValue<JiraTicketOption>
  ) => {
    if (!selectedOptions) {
      setFormData((prev) => ({ ...prev, jiraTickets: [] }));
      return;
    }
    const selectedTickets = selectedOptions.map((option) => option.ticket);
    setFormData((prev) => ({ ...prev, jiraTickets: selectedTickets }));
  };

  // Custom styles for react-select with status badges
  const customOption = ({ innerProps, label, data }: any) => (
    <div
      {...innerProps}
      className="d-flex align-items-center p-2 cursor-pointer hover:bg-dark"
    >
      <div className="flex-grow-1">
        <div className="d-flex align-items-center">
          <a
            href={`https://appveen.atlassian.net/browse/${data.ticket.ticketId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-decoration-none me-2"
          >
            {data.ticket.ticketId}
          </a>
          <span
            className={`badge me-2 ${
              data.ticket.status === 'Done'
                ? 'bg-success'
                : data.ticket.status === 'Ready For Release'
                ? 'bg-info'
                : data.ticket.status === 'In Progress'
                ? 'bg-warning'
                : 'bg-secondary'
            }`}
          >
            {data.ticket.status}
          </span>
        </div>
        <div className="small text-muted">{data.ticket.summary}</div>
      </div>
    </div>
  );

  return (
    <div className="dark-theme min-vh-100 py-4">
      <div className="container">
        <div className="row mb-4">
          <div className="col">
            <h1 className="text-light mb-2">
              Edit Release: {release?.version}
            </h1>
            <p className="text-light-muted mb-4">
              Update the details of this release
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-12">
              <div className="card bg-dark border-secondary mb-4">
                <div className="card-header border-secondary">
                  <h5 className="mb-0 text-light">Release Details</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label
                        htmlFor="version"
                        className="form-label text-light"
                      >
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

                    <div className="col-md-6 mb-3">
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

                    <div className="col-md-6 mb-3">
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

                    <div className="col-md-6 mb-3">
                      <label
                        htmlFor="customer"
                        className="form-label text-light"
                      >
                        Customer
                      </label>
                      <input
                        type="text"
                        className="form-control bg-dark text-light border-secondary"
                        id="customer"
                        name="customer"
                        value={formData.customer}
                        onChange={handleInputChange}
                        placeholder="Customer name (optional)"
                      />
                    </div>

                    <div className="col-12 mb-3">
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
                  </div>
                </div>
              </div>

              <div className="card bg-dark border-secondary mb-4">
                <div className="card-header border-secondary d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 text-light">JIRA Tickets</h5>
                  <span className="badge bg-primary">
                    {formData.jiraTickets.length} selected
                  </span>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label text-light">
                        Status Filter
                      </label>
                      <Select<Option, true>
                        isMulti
                        options={statusOptions}
                        styles={selectStyles}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        value={statusOptions.filter((option) =>
                          statusFilter.includes(option.value)
                        )}
                        onChange={handleStatusChange}
                        placeholder="Select statuses..."
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-light">
                        Fix Version Filter
                      </label>
                      <Select<Option, true>
                        isMulti
                        options={fixVersionOptions}
                        styles={selectStyles}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        value={fixVersionOptions.filter((option) =>
                          fixVersionFilter.includes(option.value)
                        )}
                        onChange={handleFixVersionChange}
                        placeholder="Select versions..."
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-12">
                      <label className="form-label text-light">
                        Select JIRA Tickets
                      </label>
                      {isLoadingJiraTickets ? (
                        <div className="text-center py-3">
                          <span
                            className="spinner-border spinner-border-sm text-light me-2"
                            role="status"
                          ></span>
                          <span className="text-light">Loading tickets...</span>
                        </div>
                      ) : (
                        <Select<JiraTicketOption, true>
                          isMulti
                          options={jiraTicketOptions}
                          styles={{
                            ...selectStyles,
                            option: () => ({}), // Remove default option styling
                            multiValue: (base) => ({
                              ...base,
                              backgroundColor: '#2c3034',
                              borderRadius: '4px',
                              padding: '2px',
                            }),
                            multiValueLabel: (base) => ({
                              ...base,
                              color: '#fff',
                              fontSize: '0.875rem',
                            }),
                            multiValueRemove: (base) => ({
                              ...base,
                              color: '#fff',
                              ':hover': {
                                backgroundColor: '#dc3545',
                                color: '#fff',
                              },
                            }),
                          }}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          value={jiraTicketOptions.filter((option) =>
                            formData.jiraTickets.some(
                              (t) => t.ticketId === option.value
                            )
                          )}
                          onChange={handleJiraTicketChange}
                          placeholder="Search and select JIRA tickets..."
                          components={{
                            Option: customOption,
                          }}
                          filterOption={(option, input) => {
                            const searchStr = input.toLowerCase();
                            return (
                              option.data.ticket.ticketId
                                .toLowerCase()
                                .includes(searchStr) ||
                              option.data.ticket.summary
                                .toLowerCase()
                                .includes(searchStr)
                            );
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {formData.jiraTickets.length > 0 && (
                    <div className="mt-3">
                      <h6 className="text-light mb-2">Selected Tickets</h6>
                      <div className="list-group">
                        {formData.jiraTickets.map((ticket) => (
                          <div
                            key={ticket.ticketId}
                            className="list-group-item bg-dark text-light border-secondary d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <div className="d-flex align-items-center">
                                <a
                                  href={`https://appveen.atlassian.net/browse/${ticket.ticketId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-decoration-none me-2"
                                >
                                  {ticket.ticketId}
                                </a>
                                <span
                                  className={`badge me-2 ${
                                    ticket.status === 'Done'
                                      ? 'bg-success'
                                      : ticket.status === 'Ready For Release'
                                      ? 'bg-info'
                                      : ticket.status === 'In Progress'
                                      ? 'bg-warning'
                                      : 'bg-secondary'
                                  }`}
                                >
                                  {ticket.status}
                                </span>
                              </div>
                              <div className="small text-muted">
                                {ticket.summary}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  jiraTickets: prev.jiraTickets.filter(
                                    (t) => t.ticketId !== ticket.ticketId
                                  ),
                                }));
                              }}
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
