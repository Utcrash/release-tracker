import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Component } from '../types';
import { componentService } from '../services/componentService';
import 'bootstrap/dist/css/bootstrap.min.css';

const Dashboard: React.FC = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchComponents = async () => {
    try {
      const data = await componentService.getAllComponents();
      setComponents(data);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching components:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to fetch components. Please check your network connection and try again.'
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const retryFetch = () => {
    setLoading(true);
    setError(null);
    fetchComponents();
  };

  const filteredComponents = components.filter((component) =>
    component.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error)
    return (
      <div className="alert alert-danger m-3">
        <p>{error}</p>
        <button className="btn btn-outline-danger mt-2" onClick={retryFetch}>
          Retry
        </button>
      </div>
    );

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col">
          <h1>Components Dashboard</h1>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="row">
        {filteredComponents.map((component) => (
          <div key={component._id} className="col-md-6 mb-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">{component.name}</h5>
                <p className="card-text">
                  <small className="text-muted">
                    Repository: {component.bitbucketRepo}
                  </small>
                </p>
                <p className="card-text">
                  <small className="text-muted">
                    JIRA Project: {component.jiraProjectKey}
                  </small>
                </p>
                <div className="d-flex justify-content-between align-items-center">
                  <Link
                    to={`/release-preparation/${component._id}`}
                    className="btn btn-primary"
                  >
                    Prepare Release
                  </Link>
                  <Link
                    to={`/release-history/${component._id}`}
                    className="btn btn-outline-secondary"
                  >
                    View History
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredComponents.length === 0 && (
        <div className="alert alert-info">
          No components found. {searchTerm && 'Try adjusting your search.'}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
