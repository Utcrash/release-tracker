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
  const initialFetchDone = useRef(false);
  const [jiraQuery, setJiraQuery] = useState<string | null>(null);

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
      const data = await jiraService.getTicketsByStatuses('DNIO', statusFilter);
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
    selectedOptions: MultiValue<Option>,
    setFilter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (!selectedOptions || selectedOptions.length === 0) {
      setFilter(['all']);
      return;
    }
    const values = selectedOptions.map((option) => option.value);
    if (values.includes('all')) {
      setFilter(['all']);
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
    const matchesSearch = ticket.summary
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
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
          <div className="card-body">
            <div className="row mb-4 g-3">
              <div className="col-md-3">
                <label className="form-label text-light">Status</label>
                <Select<Option, true>
                  isMulti
                  options={statusOptions}
                  styles={selectStyles}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  value={statusOptions.filter((option) =>
                    statusFilter.includes(option.value)
                  )}
                  onChange={(selected) =>
                    handleFilterChange(selected, setStatusFilter)
                  }
                  placeholder="Select statuses..."
                />
              </div>
              <div className="col-md-3">
                <label className="form-label text-light">Priority</label>
                <Select<Option, true>
                  isMulti
                  options={priorityOptions}
                  styles={selectStyles}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  value={priorityOptions.filter((option) =>
                    priorityFilter.includes(option.value)
                  )}
                  onChange={(selected) =>
                    handleFilterChange(selected, setPriorityFilter)
                  }
                  placeholder="Select priorities..."
                />
              </div>
              <div className="col-md-3">
                <label className="form-label text-light">Component</label>
                <Select<Option, true>
                  isMulti
                  options={componentOptions}
                  styles={selectStyles}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  value={componentOptions.filter((option) =>
                    componentFilter.includes(option.value)
                  )}
                  onChange={(selected) =>
                    handleFilterChange(selected, setComponentFilter)
                  }
                  placeholder="Select components..."
                />
              </div>
              <div className="col-md-3">
                <label className="form-label text-light">Fix Version</label>
                <Select<Option, true>
                  isMulti
                  options={fixVersionOptions}
                  styles={selectStyles}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  value={fixVersionOptions.filter((option) =>
                    fixVersionFilter.includes(option.value)
                  )}
                  onChange={(selected) =>
                    handleFilterChange(selected, setFixVersionFilter)
                  }
                  placeholder="Select versions..."
                />
              </div>
            </div>

            <div className="row">
              <div className="col">
                <input
                  type="text"
                  className="form-control bg-dark text-light border-secondary"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card bg-dark border-secondary">
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
