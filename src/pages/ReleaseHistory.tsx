import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Component, Release } from '../types';
import { componentService } from '../services/componentService';
import { releaseService } from '../services/releaseService';
import 'bootstrap/dist/css/bootstrap.min.css';

type RouteParams = {
  id?: string;
};

const ReleaseHistory: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const [component, setComponent] = useState<Component | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;

        console.log('Fetching component with ID or slug:', id);

        // Try to fetch the component
        try {
          const componentData = await componentService.getComponentById(id);
          setComponent(componentData);

          // Now fetch releases using the component's ID or slug
          try {
            const releasesData = await releaseService.getReleasesByServiceId(
              componentData._id || id
            );
            setReleases(releasesData);
          } catch (releasesError) {
            console.error('Error fetching releases:', releasesError);
            setReleases([]);
          }
        } catch (componentError) {
          console.error('Error fetching component:', componentError);
          setError('Component not found. Please check the URL and try again.');
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

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="alert alert-danger m-3">{error}</div>;
  if (!component)
    return <div className="alert alert-warning m-3">Component not found</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Release History: {component.name}</h1>
        <Link
          to={`/release-preparation/${component._id}`}
          className="btn btn-primary"
        >
          Prepare New Release
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Released By</th>
                  <th>Tickets</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {releases.map((release) => (
                  <tr key={release._id}>
                    <td>{release.version}</td>
                    <td>{new Date(release.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`badge bg-${
                          release.status === 'success' ? 'success' : 'warning'
                        }`}
                      >
                        {release.status}
                      </span>
                    </td>
                    <td>{release.releasedBy}</td>
                    <td>
                      {release.tickets?.length ||
                        release.jiraTickets?.length ||
                        0}{' '}
                      tickets
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          /* Implement view details */
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {releases.length === 0 && (
            <div className="text-center p-4">
              <p className="text-muted">
                No releases found for this component.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReleaseHistory;
