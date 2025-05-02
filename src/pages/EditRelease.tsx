import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Release, ComponentDelivery } from '../types';
import { releaseService } from '../services/releaseService';
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
}

const EditRelease: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const navigate = useNavigate();
  const [release, setRelease] = useState<Release | null>(null);
  const [initialVersion, setInitialVersion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditReleaseFormData>({
    version: '',
    releaseDate: '',
    status: '',
    notes: '',
    additionalPoints: [''],
    componentDeliveries: [],
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
  }, [id]);

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
