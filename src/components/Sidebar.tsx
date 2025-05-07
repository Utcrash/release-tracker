import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { releaseService } from '../services/releaseService';
import { Release } from '../types';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [recentReleases, setRecentReleases] = useState<Release[]>([]);

  useEffect(() => {
    fetchRecentReleases();
  }, []);

  const fetchRecentReleases = async () => {
    try {
      const data = await releaseService.getAllReleases(1);
      setRecentReleases(data.releases.slice(0, 5));
    } catch (err) {
      console.error('Error fetching recent releases:', err);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="datanimbus-logo" />
        </div>
        <h5>Release Tracker</h5>
      </div>

      <ul className="nav flex-column">
        <li className="nav-item">
          <Link to="/jira" className={`nav-link ${isActive('/jira')}`}>
            <i className="bi bi-kanban"></i>
            <span>JIRA Tickets</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link to="/releases" className={`nav-link ${isActive('/releases')}`}>
            <i className="bi bi-box"></i>
            <span>Releases</span>
          </Link>
        </li>

        {recentReleases.length > 0 && (
          <>
            <li className="nav-header mt-4 mb-2">
              <span className="text-muted px-3">Quick Links</span>
            </li>
            {recentReleases.map((release) => (
              <li key={release._id} className="nav-item">
                <Link
                  to={`/releases/${release._id}`}
                  className={`nav-link ${isActive(`/releases/${release._id}`)}`}
                >
                  <i className="bi bi-bookmark"></i>
                  <span>{release.version}</span>
                </Link>
              </li>
            ))}
          </>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
