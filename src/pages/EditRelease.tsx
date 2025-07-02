import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Select, { MultiValue } from 'react-select';
import { Release, ComponentDelivery, JiraTicket } from '../types';
import { releaseService, UpdateReleaseDto } from '../services/releaseService';
import { jiraService } from '../services/jiraService';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/darkTheme.css';
import './JiraTickets.css';

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
  customers: string[];
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

interface SelectOption {
  value: string;
  label: string;
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
  const [allJiraTickets, setAllJiraTickets] = useState<JiraTicket[]>([]);
  const [isLoadingJiraTickets, setIsLoadingJiraTickets] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([
    'Ready for Release',
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
    customers: [],
  });
  const [showNewComponentModal, setShowNewComponentModal] = useState(false);
  const [newComponentName, setNewComponentName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [customerInput, setCustomerInput] = useState('');

  // Debounce search term
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Server-side filtering is now handled in fetchJiraTickets useEffect

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
        customers: formData.customers,
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

  // Remove old applyFilters function since we now use server-side filtering

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

  const handleStatusFilterChange = (
    selectedOptions: MultiValue<SelectOption> | null
  ) => {
    const newStatuses = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    setStatusFilter(newStatuses);
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
            customers: Array.isArray(releaseData.customers)
              ? releaseData.customers
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
    fetchStatuses();
  }, [id]);

  const fetchJiraTickets = async () => {
    try {
      setIsLoadingJiraTickets(true);

      const data = await jiraService.getTicketsByStatusesAndSearch(
        'DNIO',
        statusFilter,
        debouncedSearchTerm
      );

      // Extract all fix versions
      const fixVersions = new Set<string>();
      data.forEach((ticket) => {
        ticket.fixVersions.forEach((version) => {
          if (version) fixVersions.add(version);
        });
      });

      setAvailableFixVersions(Array.from(fixVersions).sort());
      setAllJiraTickets(data);
      setAvailableJiraTickets(data);
    } catch (error) {
      console.error('Error fetching JIRA tickets:', error);
    } finally {
      setIsLoadingJiraTickets(false);
    }
  };

  useEffect(() => {
    fetchJiraTickets();
  }, [statusFilter, debouncedSearchTerm]);

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
                : data.ticket.status === 'Ready for Release'
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

  // Add new component handler
  const handleAddNewComponent = () => {
    if (newComponentName.trim()) {
      setFormData((prev) => ({
        ...prev,
        componentDeliveries: [
          ...prev.componentDeliveries,
          {
            name: newComponentName.trim(),
            dockerHubLink: '',
            eDeliveryLink: '',
          },
        ],
      }));
      setNewComponentName('');
      setShowNewComponentModal(false);
    }
  };

  const handleSelectAll = () => {
    const newSelectedTickets = [...formData.jiraTickets];
    availableJiraTickets.forEach((ticket) => {
      if (!newSelectedTickets.some((t) => t.ticketId === ticket.ticketId)) {
        newSelectedTickets.push(ticket);
      }
    });
    setFormData((prev) => ({
      ...prev,
      jiraTickets: newSelectedTickets,
    }));
  };

  const handleDeselectAll = () => {
    setFormData((prev) => ({
      ...prev,
      jiraTickets: [],
    }));
  };

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerInput(e.target.value);
  };

  const handleCustomerInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === ' ' || e.key === 'Enter') && customerInput.trim()) {
      e.preventDefault();
      if (!formData.customers.includes(customerInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          customers: [...prev.customers, customerInput.trim()],
        }));
      }
      setCustomerInput('');
    } else if (e.key === 'Backspace' && !customerInput && formData.customers.length > 0) {
      setCustomerInput(formData.customers[formData.customers.length - 1]);
      setFormData((prev) => ({
        ...prev,
        customers: prev.customers.slice(0, -1),
      }));
    }
  };

  const handleRemoveCustomer = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      customers: prev.customers.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="container-fluid dark-theme p-4">
      <div className="row">
        <div className="col">
          <h1>Edit Release</h1>
          {/* Save/Cancel Button Panel at the Top */}
          <div className="card bg-dark border-secondary mb-4">
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
                  form="edit-release-form"
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
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit} id="edit-release-form">
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
                        <label
                          htmlFor="status"
                          className="form-label text-light"
                        >
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
                          htmlFor="customers"
                          className="form-label text-light"
                        >
                          Customers
                        </label>
                        <div className="d-flex flex-wrap align-items-center bg-dark border border-secondary rounded p-2" style={{ minHeight: '44px' }}>
                          {formData.customers.map((customer, idx) => (
                            <span key={idx} className="badge bg-info text-dark me-2 mb-1 d-flex align-items-center">
                              {customer}
                              <button
                                type="button"
                                className="btn-close btn-close-white ms-1"
                                style={{ fontSize: '0.7em', filter: 'invert(1)' }}
                                aria-label="Remove"
                                onClick={() => handleRemoveCustomer(idx)}
                              ></button>
                            </span>
                          ))}
                          <input
                            type="text"
                            className="form-control bg-dark text-light border-0 flex-grow-1 shadow-none"
                            style={{ minWidth: '120px', boxShadow: 'none' }}
                            id="customers"
                            value={customerInput}
                            onChange={handleCustomerInputChange}
                            onKeyDown={handleCustomerInputKeyDown}
                            placeholder={formData.customers.length === 0 ? 'Add customer and press space/enter' : ''}
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      <div className="col-12 mb-3">
                        <label
                          htmlFor="notes"
                          className="form-label text-light"
                        >
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

                {/* Selected Tickets Section before Components Affected */}
                <div className="mb-4">
                  <h4>Selected Tickets ({formData.jiraTickets.length})</h4>
                  <div className="table-responsive">
                    <table className="table table-dark table-hover">
                      <thead>
                        <tr>
                          <th>Ticket ID</th>
                          <th>Summary</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.jiraTickets.map((ticket) => (
                          <tr key={ticket.ticketId}>
                            <td>{ticket.ticketId}</td>
                            <td>{ticket.summary}</td>
                            <td>{ticket.status}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => handleJiraTicketToggle(ticket)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                    <div className="row g-3 mb-3">
                      <div
                        className="col-lg-4"
                        style={{ position: 'relative' }}
                      >
                        <div className="input-group">
                          <span className="input-group-text bg-dark border-secondary">
                            <i className="bi bi-search text-light"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control bg-dark text-light border-secondary"
                            placeholder="Search by ticket number, summary, or assignee (e.g., 1234 or DNIO-1234)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      <div
                        className="col-lg-4"
                        style={{ position: 'relative' }}
                      >
                        <Select
                          isMulti
                          options={statusOptions}
                          value={
                            statusFilter.length === 0
                              ? []
                              : statusOptions.filter((option) =>
                                  statusFilter.includes(option.value)
                                )
                          }
                          onChange={handleStatusFilterChange}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          styles={selectStyles}
                          placeholder="Select Statuses"
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                        />
                      </div>

                      {/* Keep existing fix version filter */}
                      <div
                        className="col-lg-4"
                        style={{ position: 'relative' }}
                      >
                        <Select
                          isMulti
                          options={fixVersionOptions}
                          value={
                            fixVersionFilter.includes('all')
                              ? []
                              : fixVersionOptions.filter((option) =>
                                  fixVersionFilter.includes(option.value)
                                )
                          }
                          onChange={handleFixVersionChange}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          styles={selectStyles}
                          placeholder="Select Fix Versions"
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-between mb-3">
                      <div>
                        <span className="text-light-muted me-2">
                          {formData.jiraTickets.length} tickets selected
                        </span>
                      </div>
                      <div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-light me-2"
                          onClick={handleSelectAll}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={handleDeselectAll}
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-dark table-hover mb-0">
                        <thead>
                          <tr className="border-secondary">
                            <th
                              className="border-secondary"
                              style={{ width: '40px' }}
                            ></th>
                            <th className="border-secondary">Ticket ID</th>
                            <th className="border-secondary">Summary</th>
                            <th className="border-secondary">Status</th>
                            <th className="border-secondary">Assignee</th>
                            <th className="border-secondary">Components</th>
                            <th className="border-secondary">Fix Versions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoadingJiraTickets ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="text-center p-4 text-light-muted border-secondary"
                              >
                                <span
                                  className="spinner-border spinner-border-sm text-light me-2"
                                  role="status"
                                ></span>
                                Loading tickets...
                              </td>
                            </tr>
                          ) : availableJiraTickets.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="text-center p-4 text-light-muted border-secondary"
                              >
                                No tickets found matching your criteria
                              </td>
                            </tr>
                          ) : (
                            availableJiraTickets.map((ticket) => (
                              <tr
                                key={ticket.ticketId}
                                className={`border-secondary ${
                                  formData.jiraTickets.some(
                                    (t) => t.ticketId === ticket.ticketId
                                  )
                                    ? 'table-active'
                                    : ''
                                }`}
                                onClick={() => handleJiraTicketToggle(ticket)}
                                style={{ cursor: 'pointer' }}
                              >
                                <td className="border-secondary">
                                  <div className="form-check">
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={formData.jiraTickets.some(
                                        (t) => t.ticketId === ticket.ticketId
                                      )}
                                      onChange={() =>
                                        handleJiraTicketToggle(ticket)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </td>
                                <td className="border-secondary">
                                  <a
                                    href={`${process.env.REACT_APP_JIRA_BASE_URL}/browse/${ticket.ticketId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-info text-decoration-none"
                                    onClick={(e) => e.stopPropagation()}
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
                                <td className="border-secondary">
                                  {ticket.components.map((component, index) => (
                                    <span
                                      key={index}
                                      className="badge bg-dark border border-success text-success me-1"
                                    >
                                      {component}
                                    </span>
                                  ))}
                                </td>
                                <td className="border-secondary">
                                  {ticket.fixVersions.map((version, index) => (
                                    <span
                                      key={index}
                                      className="badge bg-dark border border-info text-info me-1"
                                    >
                                      {version}
                                    </span>
                                  ))}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="card bg-dark border-secondary mb-4">
                  <div className="card-header border-secondary d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 text-light">Components Affected</h5>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={() => setShowNewComponentModal(true)}
                    >
                      <i className="bi bi-plus-lg me-1"></i>
                      Add Component
                    </button>
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
              </div>
            </div>
          </form>

          {/* Add Component Modal */}
          {showNewComponentModal && (
            <div
              className="modal fade show"
              style={{ display: 'block' }}
              tabIndex={-1}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content bg-dark border-secondary">
                  <div className="modal-header border-secondary">
                    <h5 className="modal-title text-light">
                      Add New Component
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowNewComponentModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label text-light">
                        Component Name
                      </label>
                      <input
                        type="text"
                        className="form-control bg-dark text-light border-secondary"
                        value={newComponentName}
                        onChange={(e) => setNewComponentName(e.target.value)}
                        placeholder="Enter component name"
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-secondary">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowNewComponentModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleAddNewComponent}
                      disabled={!newComponentName.trim()}
                    >
                      Add Component
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditRelease;
