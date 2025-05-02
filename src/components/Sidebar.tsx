import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h5>Release Tracker</h5>
      </div>

      <ul className="nav flex-column">
        <li className="nav-header mt-4 mb-2">
          <span className="text-muted px-3">Navigation</span>
        </li>

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

        <li className="nav-item mt-3">
          <Link
            to="/new-release"
            className={`nav-link btn btn-success text-white ${isActive(
              '/new-release'
            )}`}
            style={{
              borderRadius: '4px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>
            <span>New Release</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
