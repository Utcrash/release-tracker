import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { releaseService } from '../services/releaseService';
import { Release, JiraTicket } from '../types';
import { useAlert } from '../context/AlertContext';
import { useUser } from '../context/UserContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './JiraTickets.css'; // Reuse the same CSS for consistency
import * as XLSX from 'xlsx';

const Releases: React.FC = () => {
  const navigate = useNavigate();
  const alert = useAlert();
  const { role } = useUser();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versionFilter, setVersionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (role !== null) {
      fetchReleases();
    }
    // eslint-disable-next-line
  }, [currentPage, role]);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const data = await releaseService.getAllReleases(currentPage);
      setReleases(data.releases);
      setTotalPages(data.pagination.totalPages);
      setHasMore(data.pagination.hasMore);
      setError(null);
    } catch (err) {
      console.error('Error fetching releases:', err);
      setError('Failed to fetch releases. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (role === null) {
    return <Navigate to="/login" replace />;
  }

  // Function to filter releases based on version
  const filterReleases = (releases: Release[], filter: string): Release[] => {
    if (!filter) return releases;

    const filterParts = filter.trim().split('.');
    return releases.filter((release) => {
      const versionParts = release.version.split('.');

      // Match exact version if all parts are provided (e.g., "2.8.4")
      if (filterParts.length === 3) {
        return release.version === filter;
      }

      // Match major and minor versions (e.g., "2.8")
      if (filterParts.length === 2) {
        return (
          versionParts[0] === filterParts[0] &&
          versionParts[1] === filterParts[1]
        );
      }

      // Match major version only (e.g., "2")
      return versionParts[0] === filterParts[0];
    });
  };

  const handleDelete = async (id: string, version: string) => {
    alert.showConfirmation(
      {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete release ${version}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger',
      },
      async () => {
        try {
          await releaseService.deleteRelease(id);
          // Remove the deleted release from the state
          setReleases(releases.filter((release) => release._id !== id));

          // Show success message
          alert.showAlert({
            title: 'Success',
            message: `Release ${version} has been deleted successfully.`,
            type: 'success',
          });
        } catch (err) {
          console.error('Error deleting release:', err);
          alert.showAlert({
            title: 'Error',
            message: 'Failed to delete release. Please try again.',
            type: 'danger',
          });
        }
      }
    );
  };

  // Helper to count tickets in a release
  const getTicketCount = (release: Release): number => {
    if (release.tickets && release.tickets.length > 0) {
      return release.tickets.length;
    }

    if (release.jiraTickets) {
      return release.jiraTickets.length;
    }

    return 0;
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'released':
        return 'success';
      case 'planned':
        return 'info';
      case 'in progress':
        return 'primary';
      case 'delayed':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li
          key={i}
          className={`page-item ${currentPage === i ? 'active' : ''}`}
        >
          <button
            className="page-link bg-dark text-light border-secondary"
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        </li>
      );
    }

    return (
      <nav aria-label="Release pagination" className="mt-4">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link bg-dark text-light border-secondary"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
          </li>
          {startPage > 1 && (
            <>
              <li className="page-item">
                <button
                  className="page-link bg-dark text-light border-secondary"
                  onClick={() => handlePageChange(1)}
                >
                  1
                </button>
              </li>
              {startPage > 2 && (
                <li className="page-item disabled">
                  <span className="page-link bg-dark text-light border-secondary">
                    ...
                  </span>
                </li>
              )}
            </>
          )}
          {pages}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <li className="page-item disabled">
                  <span className="page-link bg-dark text-light border-secondary">
                    ...
                  </span>
                </li>
              )}
              <li className="page-item">
                <button
                  className="page-link bg-dark text-light border-secondary"
                  onClick={() => handlePageChange(totalPages)}
                >
                  {totalPages}
                </button>
              </li>
            </>
          )}
          <li className={`page-item ${!hasMore ? 'disabled' : ''}`}>
            <button
              className="page-link bg-dark text-light border-secondary"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasMore}
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  // Export to XLSX
  const handleExportXLSX = () => {
    const data = filteredReleases.map((release) => ({
      'Release Version': release.version,
      'Release Date': new Date(release.createdAt).toLocaleDateString(),
      'Status': release.status,
      'Components': (release.componentDeliveries || []).map(c => c.name).join(', '),
      'Customers': (release.customers || []).join(', '),
      'JIRA Ids': (release.tickets && release.tickets.length > 0
        ? release.tickets.map(t => t.ticketId)
        : Array.isArray(release.jiraTickets)
          ? release.jiraTickets.map(t => typeof t === 'string' ? t : t.ticketId)
          : []).join(', '),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Releases');
    XLSX.writeFile(wb, 'releases.xlsx');
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

  const filteredReleases = filterReleases(releases, versionFilter);

  return (
    <div className="dark-theme min-vh-100 py-4">
      <div className="container">
        <div className="row mb-4">
          <div className="col d-flex justify-content-between align-items-center">
            <div>
              <h1 className="text-light mb-2">Releases</h1>
              <p className="text-light-muted mb-0">
                Manage and track all releases
              </p>
              {error && <div className="alert alert-danger mt-2">{error}</div>}
            </div>
            <div className="d-flex align-items-center">
              <div className="me-3">
                <input
                  type="text"
                  className="form-control bg-dark text-light border-secondary"
                  placeholder="Filter by version (e.g., 2 or 2.8 or 2.8.4)"
                  value={versionFilter}
                  onChange={(e) => setVersionFilter(e.target.value)}
                />
              </div>
              <button className="btn btn-outline-success me-2" onClick={handleExportXLSX}>
                <i className="bi bi-file-earmark-excel me-1"></i>
                Export to XLSX
              </button>
              {['editor', 'admin'].includes(role || '') && (
                <Link to="/releases/new" className="btn btn-primary">
                  <i className="bi bi-plus me-2"></i>
                  New Release
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="card bg-dark border-secondary mb-4">
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0">
              <thead>
                <tr className="border-secondary">
                  <th className="border-secondary">Version</th>
                  <th className="border-secondary">Release Date</th>
                  <th className="border-secondary">Status</th>
                  <th className="border-secondary">Components</th>
                  <th className="border-secondary">Tickets</th>
                  <th className="border-secondary">Customers</th>
                  <th className="border-secondary text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReleases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center p-4 text-light-muted border-secondary"
                    >
                      {versionFilter
                        ? 'No releases found matching the filter'
                        : 'No releases found'}
                    </td>
                  </tr>
                ) : (
                  filteredReleases.map((release) => (
                    <tr key={release._id} className="border-secondary">
                      <td className="border-secondary">
                        <Link
                          to={`/releases/${release._id}`}
                          className="text-info text-decoration-none"
                        >
                          {release.version}
                        </Link>
                      </td>
                      <td className="border-secondary text-light">
                        {new Date(release.createdAt).toLocaleDateString()}
                      </td>
                      <td className="border-secondary">
                        <span
                          className={`badge bg-${getStatusColor(
                            release.status
                          )}`}
                        >
                          {release.status}
                        </span>
                      </td>
                      <td className="border-secondary">
                        {release.componentDeliveries?.map(
                          (component, index) => (
                            <span
                              key={index}
                              className="badge bg-dark border border-secondary me-1"
                            >
                              {component.name}
                            </span>
                          )
                        )}
                      </td>
                      <td className="border-secondary text-light">
                        {getTicketCount(release)}
                      </td>
                      <td className="border-secondary text-light">
                        {(release.customers || []).join(', ')}
                      </td>
                      <td className="border-secondary text-end">
                        {['editor', 'admin'].includes(role || '') && (
                          <>
                            <Link
                              to={`/edit-release/${release._id}`}
                              className="btn btn-sm btn-outline-light me-2"
                            >
                              <i className="bi bi-pencil"></i>
                            </Link>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                handleDelete(release._id, release.version)
                              }
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!versionFilter && renderPagination()}
      </div>
    </div>
  );
};

export default Releases;
