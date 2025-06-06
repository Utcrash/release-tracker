import React, { useEffect, useState, useRef } from 'react';
import Select, { MultiValue } from 'react-select';
import { JiraTicket } from '../types';
import { jiraService } from '../services/jiraService';
import 'bootstrap/dist/css/bootstrap.min.css';
import './JiraTickets.css';

interface JiraStatus {
  id: string;
  name: string;
  category: string;
}

interface Option {
  value: string;
  label: string;
}

const JiraTickets: React.FC = () => {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const initialFetchDone = useRef(false);
  const [jiraQuery, setJiraQuery] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string[]>([
    'Ready for Release',
  ]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>(['all']);
  const [componentFilter, setComponentFilter] = useState<string[]>(['all']);
  const [fixVersionFilter, setFixVersionFilter] = useState<string[]>(['all']);

  // For filter dropdowns
  const [availableStatuses, setAvailableStatuses] = useState<JiraStatus[]>([]);
  const [availablePriorities, setAvailablePriorities] = useState<string[]>([]);
  const [availableComponents, setAvailableComponents] = useState<string[]>([]);
  const [availableFixVersions, setAvailableFixVersions] = useState<string[]>(
    []
  );

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
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
      pointerEvents: 'auto',
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#495057' : '#212529',
      '&:hover': {
        backgroundColor: '#495057',
      },
      color: '#fff',
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
      '&:hover': {
        backgroundColor: '#6c757d',
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

  // Debounce search term
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

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

    fetchStatuses();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await jiraService.getTicketsByStatuses(
        process.env.REACT_APP_JIRA_PROJECT_KEY,
        statusFilter
      );
      setTickets(data);

      // Extract unique values for filters
      const priorities = Array.from(
        new Set(data.map((ticket: JiraTicket) => ticket.priority || 'None'))
      ) as string[];
      const components = Array.from(
        new Set(data.flatMap((ticket: JiraTicket) => ticket.components))
      ) as string[];
      const versions = Array.from(
        new Set(data.flatMap((ticket: JiraTicket) => ticket.fixVersions))
      ) as string[];

      setAvailablePriorities(priorities);
      setAvailableComponents(components);
      setAvailableFixVersions(versions);
      setError(null);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to fetch tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    selectedOptions: MultiValue<Option> | null,
    setFilter: React.Dispatch<React.SetStateAction<string[]>>,
    currentFilter: string[]
  ) => {
    if (!selectedOptions || selectedOptions.length === 0) {
      setFilter(['all']);
      return;
    }

    const values = selectedOptions.map((option) => option.value);

    // Check if 'all' is being selected or deselected
    if (values.includes('all')) {
      // If all wasn't previously selected, select only 'all'
      if (!currentFilter.includes('all')) {
        setFilter(['all']);
      } else {
        // If all was previously selected and user is trying to select something else,
        // remove 'all' and select only the new option
        setFilter(values.filter((v) => v !== 'all'));
      }
    } else {
      setFilter(values);
    }
  };

  // Convert arrays to options format for react-select
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...availableStatuses.map((status) => ({
      value: status.name,
      label: status.name,
    })),
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    ...availablePriorities.map((priority) => ({
      value: priority,
      label: priority,
    })),
  ];

  const componentOptions = [
    { value: 'all', label: 'All Components' },
    ...availableComponents.map((component) => ({
      value: component,
      label: component,
    })),
  ];

  const fixVersionOptions = [
    { value: 'all', label: 'All Fix Versions' },
    ...availableFixVersions.map((version) => ({
      value: version,
      label: version,
    })),
  ];

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

  const getStatusColor = (status: string): string => {
    const statusObj = availableStatuses.find((s) => s.name === status);
    if (!statusObj) return 'secondary';

    switch (statusObj.category.toLowerCase()) {
      case 'done':
        return 'success';
      case 'in progress':
        return 'primary';
      case 'to do':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    // Enhanced search logic for ticket ID and summary
    const searchTermLower = debouncedSearchTerm.toLowerCase().trim();
    let matchesSearch = true;

    if (searchTermLower) {
      // Search in summary
      const summaryMatch = ticket.summary
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

      matchesSearch = summaryMatch || ticketIdMatch;
    }

    const matchesPriority =
      priorityFilter.includes('all') ||
      priorityFilter.some((p) => p === ticket.priority);
    const matchesComponent =
      componentFilter.includes('all') ||
      ticket.components.some((c) => componentFilter.includes(c));
    const matchesVersion =
      fixVersionFilter.includes('all') ||
      ticket.fixVersions.some((v) => fixVersionFilter.includes(v));

    return (
      matchesSearch && matchesPriority && matchesComponent && matchesVersion
    );
  });

  return (
    <div className="dark-theme min-vh-100 py-4">
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col">
            <h1 className="text-light mb-2">JIRA Tickets</h1>
            <p className="text-light-muted">
              Manage and track JIRA tickets for releases
            </p>
          </div>
        </div>

        <div className="card bg-dark border-secondary mb-4">
          <div className="card-header border-secondary">
            <h5 className="mb-0 text-light">Filters</h5>
          </div>
          <div
            className="card-body"
            style={{ position: 'relative', zIndex: 3 }}
          >
            <div className="row mb-3">
              <div className="col-md-3" style={{ position: 'relative' }}>
                <label className="form-label text-light">Status</label>
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
                  onChange={(selected) =>
                    handleFilterChange(selected, setStatusFilter, statusFilter)
                  }
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={selectStyles}
                  placeholder="Select Statuses"
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
              <div className="col-md-3" style={{ position: 'relative' }}>
                <label className="form-label text-light">Priority</label>
                <Select
                  isMulti
                  options={priorityOptions}
                  value={
                    priorityFilter.includes('all')
                      ? []
                      : priorityOptions.filter((option) =>
                          priorityFilter.includes(option.value)
                        )
                  }
                  onChange={(selected) =>
                    handleFilterChange(
                      selected,
                      setPriorityFilter,
                      priorityFilter
                    )
                  }
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={selectStyles}
                  placeholder="Select Priorities"
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
              <div className="col-md-3" style={{ position: 'relative' }}>
                <label className="form-label text-light">Component</label>
                <Select
                  isMulti
                  options={componentOptions}
                  value={
                    componentFilter.includes('all')
                      ? []
                      : componentOptions.filter((option) =>
                          componentFilter.includes(option.value)
                        )
                  }
                  onChange={(selected) =>
                    handleFilterChange(
                      selected,
                      setComponentFilter,
                      componentFilter
                    )
                  }
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={selectStyles}
                  placeholder="Select Components"
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
              <div className="col-md-3" style={{ position: 'relative' }}>
                <label className="form-label text-light">Fix Version</label>
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
                  onChange={(selected) =>
                    handleFilterChange(
                      selected,
                      setFixVersionFilter,
                      fixVersionFilter
                    )
                  }
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={selectStyles}
                  placeholder="Select Fix Versions"
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
            </div>

            <div className="row">
              <div className="col">
                <input
                  type="text"
                  className="form-control bg-dark text-light border-secondary"
                  placeholder="Search by ticket number or summary (e.g., 1234 or DNIO-1234)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div
          className="card bg-dark border-secondary"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Summary</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Components</th>
                    <th>Fix Versions</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center">
                        <div
                          className="spinner-border text-light"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center">
                        No tickets found
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <tr key={ticket.ticketId}>
                        <td>
                          <a
                            href={`${process.env.REACT_APP_JIRA_BASE_URL}/browse/${ticket.ticketId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-info"
                          >
                            {ticket.ticketId}
                          </a>
                        </td>
                        <td>{ticket.summary}</td>
                        <td>
                          <span
                            className={`badge bg-${getStatusColor(
                              ticket.status
                            )}`}
                          >
                            {ticket.status}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge bg-${getPriorityColor(
                              ticket.priority
                            )}`}
                          >
                            {ticket.priority || 'None'}
                          </span>
                        </td>
                        <td>{ticket.assignee}</td>
                        <td>
                          {ticket.components.map((component) => (
                            <span
                              key={component}
                              className="badge bg-secondary me-1"
                            >
                              {component}
                            </span>
                          ))}
                        </td>
                        <td>
                          {ticket.fixVersions.map((version) => (
                            <span
                              key={version}
                              className="badge bg-info text-dark me-1"
                            >
                              {version}
                            </span>
                          ))}
                        </td>
                        <td>{new Date(ticket.updated).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JiraTickets;
