import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from 'react-router-dom';
import Sidebar from './components/Sidebar';
import JiraTickets from './pages/JiraTickets';
import Releases from './pages/Releases';
import ReleaseDetails from './pages/ReleaseDetails';
import EditRelease from './pages/EditRelease';
import NewRelease from './pages/NewRelease';
import Login from './pages/Login';
import { AlertProvider } from './context/AlertContext';
import { UserProvider, useUser } from './context/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/darkTheme.css';
import './App.css';
import AdminPanel from './pages/AdminPanel';

function AppContent() {
  const location = useLocation();
  const { loading } = useUser();
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  const isLoginPage = location.pathname === '/login';
  return (
    <div className="app-wrapper dark-theme">
      <div className="content-wrapper">
        {location.pathname !== '/login' && <Sidebar />}
        <main className={`main-content${isLoginPage ? ' no-sidebar' : ''}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="/jira" element={<ProtectedRoute><JiraTickets /></ProtectedRoute>} />
            <Route path="/releases" element={<ProtectedRoute><Releases /></ProtectedRoute>} />
            <Route path="/releases/new" element={<ProtectedRoute><NewRelease /></ProtectedRoute>} />
            <Route path="/releases/:id" element={<ProtectedRoute><ReleaseDetails /></ProtectedRoute>} />
            <Route path="/edit-release/:id" element={<ProtectedRoute><EditRelease /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/jira" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

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
      <UserProvider>
        <Router basename={basePath}>
          <AppContent />
        </Router>
      </UserProvider>
    </AlertProvider>
  );
}

export default App;
