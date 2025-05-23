import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { MultiValue } from 'react-select';
import { jiraService } from '../services/jiraService';
import { releaseService } from '../services/releaseService';
import { JiraTicket, ComponentDelivery } from '../types';
import 'bootstrap/dist/css/bootstrap.min.css';
import './JiraTickets.css';

interface JiraStatus {
  id: string;
  name: string;
  category: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface NewReleaseFormData {
  version: string;
  releaseDate: string;
  notes: string;
  additionalPoints: string[];
  componentDeliveries: ComponentDelivery[];
}

const NewRelease: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([
    'Ready For Release',
  ]);
  const [availableStatuses, setAvailableStatuses] = useState<JiraStatus[]>([]);
  const [fixVersionFilter, setFixVersionFilter] = useState<string[]>(['all']);
  const [uniqueFixVersions, setUniqueFixVersions] = useState<string[]>([]);
  const [formData, setFormData] = useState<NewReleaseFormData>({
    version: '',
    releaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    additionalPoints: [''],
    componentDeliveries: [],
  });
  const [showNewComponentModal, setShowNewComponentModal] = useState(false);
  const [newComponentName, setNewComponentName] = useState('');

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
      zIndex: 2,
      width: '100%',
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#212529',
      border: '1px solid #495057',
      zIndex: 9999,
      width: '100%',
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#495057' : '#212529',
      '&:hover': {
        backgroundColor: '#495057',
      },
      color: '#fff',
    }),
    container: (base: any) => ({
      ...base,
      width: '100%',
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
    const fetchTickets = async () => {
      try {
        setLoading(true);
        // If 'all' is selected, fetch all tickets
        const data = await jiraService.getTicketsByStatuses(
          'DNIO',
          statusFilter.includes('all') ? [] : statusFilter
        );
        setTickets(data);

        // Extract unique fix versions
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

    fetchTickets();
  }, [statusFilter]);

  const handleTicketSelect = (ticketId: string) => {
    setSelectedTickets((prev) => {
      const newSelectedTickets = {
        ...prev,
        [ticketId]: !prev[ticketId],
      };

      // Update component deliveries when tickets are selected/deselected
      updateComponentDeliveries(newSelectedTickets);

      return newSelectedTickets;
    });
  };

  const updateComponentDeliveries = (
    selectedTicketsMap: Record<string, boolean>
  ) => {
    const selectedTicketIds = Object.keys(selectedTicketsMap).filter(
      (id) => selectedTicketsMap[id]
    );
    const selectedTicketData = tickets.filter((ticket) =>
      selectedTicketIds.includes(ticket.ticketId)
    );

    // Extract unique components from selected tickets
    const uniqueComponents = new Set<string>();
    selectedTicketData.forEach((ticket) => {
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
  };

  const handleSelectAll = () => {
    const newSelectedTickets: Record<string, boolean> = {};
    filteredTickets.forEach((ticket) => {
      newSelectedTickets[ticket.ticketId] = true;
    });
    setSelectedTickets(newSelectedTickets);
    updateComponentDeliveries(newSelectedTickets);
  };

  const handleDeselectAll = () => {
    setSelectedTickets({});
    setFormData((prev) => ({
      ...prev,
      componentDeliveries: [],
    }));
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
    const matchesSearch =
      ticket.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.assignee.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVersion =
      fixVersionFilter.includes('all') ||
      ticket.fixVersions.some((v) => fixVersionFilter.includes(v));

    return matchesSearch && matchesVersion;
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
                <div className="card-header border-secondary">
                  <h5 className="mb-0 text-light">Select JIRA Tickets</h5>
                </div>
                <div
                  className="card-body"
                  style={{ position: 'relative', zIndex: 3 }}
                >
                  <div className="row g-3 mb-3">
                    <div className="col-lg-4" style={{ position: 'relative' }}>
                      <div className="input-group">
                        <span className="input-group-text bg-dark border-secondary">
                          <i className="bi bi-search text-light"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control bg-dark text-light border-secondary"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-lg-4" style={{ position: 'relative' }}>
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
                          handleStatusFilterChange(selected)
                        }
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={selectStyles}
                        placeholder="Select Statuses"
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    </div>
                    <div className="col-lg-4" style={{ position: 'relative' }}>
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
                        {Object.values(selectedTickets).filter(Boolean).length}{' '}
                        tickets selected
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
                        {filteredTickets.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="text-center p-4 text-light-muted border-secondary"
                            >
                              No tickets found matching your criteria
                            </td>
                          </tr>
                        ) : (
                          filteredTickets.map((ticket) => (
                            <tr
                              key={ticket.ticketId}
                              className={`border-secondary ${
                                selectedTickets[ticket.ticketId]
                                  ? 'table-active'
                                  : ''
                              }`}
                              onClick={() =>
                                handleTicketSelect(ticket.ticketId)
                              }
                              style={{ cursor: 'pointer' }}
                            >
                              <td className="border-secondary">
                                <div className="form-check">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={!!selectedTickets[ticket.ticketId]}
                                    onChange={() =>
                                      handleTicketSelect(ticket.ticketId)
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
                                    className="badge bg-dark border border-success text-success me-1"
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

              {formData.componentDeliveries.length > 0 && (
                <div
                  className="card bg-dark border-secondary mb-4"
                  style={{ position: 'relative', zIndex: 2 }}
                >
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
                      Object.values(selectedTickets).filter(Boolean).length ===
                        0
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
