import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import Sidebar from './components/Sidebar';
import JiraTickets from './pages/JiraTickets';
import Releases from './pages/Releases';
import ReleaseDetails from './pages/ReleaseDetails';
import EditRelease from './pages/EditRelease';
import NewRelease from './pages/NewRelease';
import { AlertProvider } from './context/AlertContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/darkTheme.css';
import './App.css';

function App() {
  // Get base path from environment variables, package.json homepage, or use /release-tracker as default
  const basePath =
    process.env.REACT_APP_BASE_PATH ||
    (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '/release-tracker');

  console.log('React app using base path:', basePath);

  useEffect(() => {
    // Apply dark theme to body
    document.body.classList.add('dark-theme');
    return () => {
      document.body.classList.remove('dark-theme');
    };
  }, []);

  return (
    <AlertProvider>
      <Router basename={basePath}>
        <div className="app-wrapper dark-theme">
          <div className="content-wrapper">
            <Sidebar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Navigate to="/jira" replace />} />
                <Route path="/jira" element={<JiraTickets />} />
                <Route path="/releases" element={<Releases />} />
                <Route path="/releases/new" element={<NewRelease />} />
                <Route path="/releases/:id" element={<ReleaseDetails />} />
                <Route path="/edit-release/:id" element={<EditRelease />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AlertProvider>
  );
}

export default App;
