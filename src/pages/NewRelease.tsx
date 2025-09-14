import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Select, { MultiValue } from 'react-select';
import { jiraService } from '../services/jiraService';
import { releaseService } from '../services/releaseService';
import { JiraTicket, ComponentDelivery } from '../types';
import 'bootstrap/dist/css/bootstrap.min.css';
import './JiraTickets.css';
import { useUser } from '../context/UserContext';

interface JiraStatus {
  id: string;
  name: string;
  category: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface JiraTicketTableProps {
  tickets: JiraTicket[];
  selectedTickets: Record<string, boolean>;
  onTicketSelect: (ticketId: string) => void;
  loading: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const JiraTicketTable: React.FC<JiraTicketTableProps> = ({
  tickets,
  selectedTickets,
  onTicketSelect,
  loading,
  onSelectAll,
  onDeselectAll,
}) => {
  return (
    <>
      <div className="d-flex justify-content-between mb-3">
        <div>
          <span className="text-light-muted me-2">
            {
              Object.keys(selectedTickets).filter((key) => selectedTickets[key])
                .length
            }{' '}
            tickets selected
          </span>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-sm btn-outline-light me-2"
            onClick={onSelectAll}
          >
            Select All
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onDeselectAll}
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-dark table-hover border-secondary">
          <thead>
            <tr>
              <th style={{ width: '50px' }}></th>
              <th>Ticket ID</th>
              <th>Summary</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Components</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-4 text-light-muted">
                  <span
                    className="spinner-border spinner-border-sm text-light me-2"
                    role="status"
                  ></span>
                  Loading tickets...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-4 text-light-muted">
                  No tickets found matching your criteria
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr
                  key={ticket.ticketId}
                  onClick={() => onTicketSelect(ticket.ticketId)}
                  className={
                    selectedTickets[ticket.ticketId] ? 'table-active' : ''
                  }
                  style={{ cursor: 'pointer' }}
                >
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedTickets[ticket.ticketId] || false}
                      onChange={() => onTicketSelect(ticket.ticketId)}
                      onClick={(e) => e.stopPropagation()}
                      className="form-check-input"
                    />
                  </td>
                  <td>
                    <a
                      href={`https://appveen.atlassian.net/browse/${ticket.ticketId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ticket.ticketId}
                    </a>
                  </td>
                  <td>{ticket.summary}</td>
                  <td>
                    <span
                      className={`badge ${
                        ticket.status === 'Done'
                          ? 'bg-success'
                          : ticket.status === 'Ready for Release'
                          ? 'bg-info'
                          : ticket.status === 'In Progress'
                          ? 'bg-warning'
                          : 'bg-secondary'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        ticket.priority === 'High'
                          ? 'bg-danger'
                          : ticket.priority === 'Medium'
                          ? 'bg-warning'
                          : 'bg-info'
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td>{ticket.assignee}</td>
                  <td>{ticket.components.join(', ')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

interface NewReleaseFormData {
  version: string;
  releaseDate: string;
  notes: string;
  additionalPoints: string[];
  componentDeliveries: ComponentDelivery[];
  customers: string[];
}

const NewRelease: React.FC = () => {
  const { role } = useUser();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, boolean>>({});
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<JiraTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>(['Ready for Release']);
  const [availableStatuses, setAvailableStatuses] = useState<JiraStatus[]>([]);
  const [fixVersionFilter, setFixVersionFilter] = useState<string[]>(['all']);
  const [uniqueFixVersions, setUniqueFixVersions] = useState<string[]>([]);
  const [formData, setFormData] = useState<NewReleaseFormData>({
    version: '',
    releaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    additionalPoints: [''],
    componentDeliveries: [],
    customers: [],
  });
  const [showNewComponentModal, setShowNewComponentModal] = useState(false);
  const [newComponentName, setNewComponentName] = useState('');
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

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const statuses = await jiraService.getJiraStatuses();
        setAvailableStatuses(statuses);
      } catch (error) {
        console.error('Error fetching JIRA statuses:', error);
      }
    };
    if (role && ['editor', 'admin'].includes(role)) {
      fetchStatuses();
    }
  }, [role]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const statuses = statusFilter.length > 0 ? statusFilter : ['Ready for Release'];
        const data = await jiraService.getTicketsByStatusesAndSearch(
          'DNIO',
          statuses,
          debouncedSearchTerm
        );
        setTickets(data);
        setSelectedTickets((prev) => {
          const newSelectedTickets = { ...prev };
          Object.keys(newSelectedTickets).forEach((ticketId) => {
            if (!data.some((t) => t.ticketId === ticketId)) {
              delete newSelectedTickets[ticketId];
            }
          });
          return newSelectedTickets;
        });
        setSelectedTicketDetails((prev) => {
          const existingSelected = prev.filter(
            (t) => !data.some((newT) => newT.ticketId === t.ticketId)
          );
          const newlySelected = data.filter((t) => selectedTickets[t.ticketId]);
          return [...existingSelected, ...newlySelected];
        });
        const versions = new Set<string>();
        data.forEach((ticket: JiraTicket) => {
          ticket.fixVersions.forEach((version: string) => {
            versions.add(version);
          });
        });
        setUniqueFixVersions(Array.from(versions).sort());
        setError(null);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError('Failed to fetch tickets. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (role && ['editor', 'admin'].includes(role)) {
      fetchTickets();
    }
    // eslint-disable-next-line
  }, [statusFilter, debouncedSearchTerm, role]);

  // Update component deliveries whenever selectedTicketDetails changes
  useEffect(() => {
    // Extract unique components from selected tickets
    const uniqueComponents = new Set<string>();
    selectedTicketDetails.forEach((ticket) => {
      ticket.components.forEach((component) => {
        uniqueComponents.add(component);
      });
    });
    // Create or update component deliveries
    const existingComponents = formData.componentDeliveries.reduce(
      (acc, comp) => {
        acc[comp.name] = comp;
        return acc;
      },
      {} as Record<string, ComponentDelivery>
    );
    // Create new component deliveries array
    const newComponentDeliveries = Array.from(uniqueComponents).map(
      (component) => {
        // Keep existing links if the component was already in the list
        return existingComponents[component] || { name: component };
      }
    );
    setFormData((prev) => ({
      ...prev,
      componentDeliveries: newComponentDeliveries,
    }));
  }, [selectedTicketDetails]);

  if (role === null) {
    // return <Navigate to="/login" replace />;
  }
  if (!role || !['editor', 'admin'].includes(role)) {
    return <div style={{ color: '#e03d5f', textAlign: 'center', marginTop: 40 }}>You do not have permission to create a new release.</div>;
  }

  const handleTicketSelect = (ticketId: string) => {
    const ticket = tickets.find((t) => t.ticketId === ticketId);
    if (!ticket) return;

    setSelectedTickets((prev) => {
      const newSelectedTickets = {
        ...prev,
        [ticketId]: !prev[ticketId],
      };

      // Update selectedTicketDetails based on the new selection
      setSelectedTicketDetails((currentDetails) => {
        if (newSelectedTickets[ticketId]) {
          // Add ticket if it's not already in the details
          if (!currentDetails.some((t) => t.ticketId === ticketId)) {
            return [...currentDetails, ticket];
          }
        } else {
          // Remove ticket if it's being deselected
          return currentDetails.filter((t) => t.ticketId !== ticketId);
        }
        return currentDetails;
      });

      return newSelectedTickets;
    });
  };

  const handleSelectAll = () => {
    const newSelectedTickets: Record<string, boolean> = {};
    tickets.forEach((ticket) => {
      newSelectedTickets[ticket.ticketId] = true;
    });
    setSelectedTickets(newSelectedTickets);
    setSelectedTicketDetails(tickets);
  };

  const handleDeselectAll = () => {
    setSelectedTickets({});
    setSelectedTicketDetails([]);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const selectedTicketIds = Object.keys(selectedTickets).filter(
        (id) => selectedTickets[id]
      );
      const selectedTicketData = tickets.filter((ticket) =>
        selectedTicketIds.includes(ticket.ticketId)
      );

      const releaseData = {
        version: formData.version,
        createdAt: formData.releaseDate,
        status: 'Planned',
        tickets: selectedTicketData, // This is what the backend expects
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

      // Send data to API
      await releaseService.createRelease(releaseData);

      // Navigate to releases page on success
      navigate('/releases');
    } catch (error) {
      console.error('Failed to create release:', error);
      setError('Failed to create release. Please try again.');
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (
    selectedOptions: MultiValue<SelectOption> | null
  ) => {
    if (!selectedOptions || selectedOptions.length === 0) {
      setStatusFilter(['all']);
      return;
    }

    const values = selectedOptions.map((option) => option.value);

    // Check if 'all' is being selected or deselected
    if (values.includes('all')) {
      // If all wasn't previously selected, select only 'all'
      if (!statusFilter.includes('all')) {
        setStatusFilter(['all']);
      } else {
        // If all was previously selected and user is trying to select something else,
        // remove 'all' and select only the new option
        setStatusFilter(values.filter((v) => v !== 'all'));
      }
    } else {
      setStatusFilter(values);
    }
  };

  const handleFixVersionFilterChange = (
    selectedOptions: MultiValue<SelectOption> | null
  ) => {
    if (!selectedOptions || selectedOptions.length === 0) {
      setFixVersionFilter(['all']);
      return;
    }

    const values = selectedOptions.map((option) => option.value);

    // Check if 'all' is being selected or deselected
    if (values.includes('all')) {
      // If all wasn't previously selected, select only 'all'
      if (!fixVersionFilter.includes('all')) {
        setFixVersionFilter(['all']);
      } else {
        // If all was previously selected and user is trying to select something else,
        // remove 'all' and select only the new option
        setFixVersionFilter(values.filter((v) => v !== 'all'));
      }
    } else {
      setFixVersionFilter(values);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    // Enhanced search logic for ticket ID, summary, and assignee
    const searchTermLower = debouncedSearchTerm.toLowerCase().trim();
    let matchesSearch = true;

    if (searchTermLower) {
      // Search in summary
      const summaryMatch = ticket.summary
        .toLowerCase()
        .includes(searchTermLower);

      // Search in assignee
      const assigneeMatch = ticket.assignee
        .toLowerCase()
        .includes(searchTermLower);

      // Search in ticket ID with DNIO prefix handling
      const ticketIdLower = ticket.ticketId.toLowerCase();
      let ticketIdMatch = false;

      // Direct match
      if (ticketIdLower.includes(searchTermLower)) {
        ticketIdMatch = true;
      }

      // If search term doesn't start with 'dnio' but ticket ID does, try adding DNIO prefix
      if (
        !ticketIdMatch &&
        !searchTermLower.startsWith('dnio') &&
        ticketIdLower.startsWith('dnio')
      ) {
        const searchWithDnio = `dnio-${searchTermLower}`;
        if (ticketIdLower.includes(searchWithDnio)) {
          ticketIdMatch = true;
        }
      }

      // If search term starts with 'dnio' but we want to match without prefix too
      if (!ticketIdMatch && searchTermLower.startsWith('dnio-')) {
        const searchWithoutDnio = searchTermLower.replace('dnio-', '');
        if (ticketIdLower.includes(searchWithoutDnio)) {
          ticketIdMatch = true;
        }
      }

      matchesSearch = summaryMatch || ticketIdMatch || assigneeMatch;
    }

    // Status filtering
    const matchesStatus =
      statusFilter.includes('all') || statusFilter.includes(ticket.status);

    // Fix version filtering
    const matchesVersion =
      fixVersionFilter.includes('all') ||
      ticket.fixVersions.some((v) => fixVersionFilter.includes(v));

    return matchesSearch && matchesStatus && matchesVersion;
  });

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

  // Convert arrays to react-select options
  const statusOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses' },
    ...availableStatuses.map((status) => ({
      value: status.name,
      label: status.name,
    })),
  ];

  const fixVersionOptions: SelectOption[] = [
    { value: 'all', label: 'All Fix Versions' },
    ...uniqueFixVersions.map((version) => ({
      value: version,
      label: version,
    })),
  ];

  // Custom styles for react-select
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: '#212529',
      borderColor: '#495057',
      '&:hover': {
        borderColor: '#6c757d',
      },
      position: 'relative',
      zIndex: 2,
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#212529',
      border: '1px solid #495057',
      zIndex: 9999,
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#495057' : '#212529',
      color: '#fff',
      cursor: 'pointer',
      ':active': {
        backgroundColor: '#6c757d',
      },
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: '#495057',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: '#fff',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: '#fff',
      ':hover': {
        backgroundColor: '#dc3545',
        color: '#fff',
      },
    }),
    input: (base: any) => ({
      ...base,
      color: '#fff',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#fff',
    }),
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

  return (
    <div className="dark-theme min-vh-100 py-4">
      <div className="container">
        <div className="row mb-4">
          <div className="col">
            <h1 className="text-light mb-2">Create New Release</h1>
            <p className="text-light-muted mb-4">
              Select JIRA tickets and provide release information
            </p>
            {error && <div className="alert alert-danger">{error}</div>}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-8">
              <div className="card bg-dark border-secondary mb-4">
                <div className="card-header border-secondary d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 text-light">Select JIRA Tickets</h5>
                  <span className="badge bg-primary">
                    {selectedTicketDetails.length} selected
                  </span>
                </div>
                <div className="card-body">
                  <div className="row g-3 mb-3">
                    <div className="col-lg-4" style={{ position: 'relative' }}>
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
                    <div className="col-lg-4">
                      <Select
                        isMulti
                        options={statusOptions}
                        value={
                          statusFilter.includes('all')
                            ? []
                            : statusOptions.filter((option) =>
                                statusFilter.includes(option.value)
                              )
                        }
                        onChange={handleStatusFilterChange}
                        placeholder="Filter by Status"
                        styles={selectStyles}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                    </div>
                    <div className="col-lg-4">
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
                        onChange={handleFixVersionFilterChange}
                        placeholder="Filter by Fix Version"
                        styles={selectStyles}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                    </div>
                  </div>

                  <JiraTicketTable
                    tickets={tickets}
                    selectedTickets={selectedTickets}
                    onTicketSelect={handleTicketSelect}
                    loading={loading}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                  />
                </div>
              </div>

              {selectedTicketDetails.length > 0 && (
                <div className="card bg-dark border-secondary mb-4">
                  <div className="card-header border-secondary">
                    <h5 className="mb-0 text-light">Selected Tickets</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-dark table-hover border-secondary">
                        <thead>
                          <tr>
                            <th>Ticket ID</th>
                            <th>Summary</th>
                            <th>Components</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTicketDetails.map((ticket) => (
                            <tr key={ticket.ticketId}>
                              <td>
                                <a
                                  href={`https://appveen.atlassian.net/browse/${ticket.ticketId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {ticket.ticketId}
                                </a>
                              </td>
                              <td>{ticket.summary}</td>
                              <td>{ticket.components.join(', ')}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    handleTicketSelect(ticket.ticketId)
                                  }
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
                </div>
              )}

              {formData.componentDeliveries.length > 0 && (
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
                                    placeholder="DockerHub URL (optional)"
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
                                    placeholder="E-Delivery URL (optional)"
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
            </div>

            <div className="col-md-4">
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

                  <div className="mb-3">
                    <label htmlFor="customers" className="form-label text-light">
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
                </div>

                <div className="card-footer border-secondary d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/releases')}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      !formData.version ||
                      Object.keys(selectedTickets).filter(Boolean).length === 0
                    }
                  >
                    Create Release
                  </button>
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
                  <h5 className="modal-title text-light">Add New Component</h5>
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
  );
};

export default NewRelease;
