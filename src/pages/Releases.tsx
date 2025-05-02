import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { releaseService } from '../services/releaseService';
import { Release, JiraTicket } from '../types';
import { useAlert } from '../context/AlertContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './JiraTickets.css'; // Reuse the same CSS for consistency

const Releases: React.FC = () => {
  const navigate = useNavigate();
  const alert = useAlert();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const data = await releaseService.getAllReleases();
      setReleases(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching releases:', err);
      setError('Failed to fetch releases. Please try again later.');
    } finally {
      setLoading(false);
    }
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
          <div className="col d-flex justify-content-between align-items-center">
            <div>
              <h1 className="text-light mb-2">Releases</h1>
              <p className="text-light-muted mb-0">
                Manage and track all releases
              </p>
              {error && <div className="alert alert-danger mt-2">{error}</div>}
            </div>
            <Link to="/new-release" className="btn btn-primary">
              <i className="bi bi-plus me-2"></i>
              New Release
            </Link>
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
                  <th className="border-secondary">Notes</th>
                  <th className="border-secondary text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {releases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center p-4 text-light-muted border-secondary"
                    >
                      No releases found
                    </td>
                  </tr>
                ) : (
                  releases.map((release) => (
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
                      <td className="border-secondary text-light-muted">
                        {release.notes}
                      </td>
                      <td className="border-secondary text-end">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Releases;
