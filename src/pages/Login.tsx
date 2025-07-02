import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { useUser } from '../context/UserContext';

const loginResponsiveStyle = `
@media (max-width: 900px) {
  .login-flex-root {
    flex-direction: column !important;
  }
  .login-flex-left, .login-flex-right {
    flex: none !important;
    width: 100vw !important;
    min-width: 0 !important;
    max-width: 100vw !important;
  }
}
`;

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setRole } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(username, password);
      setRole(result.role);
      navigate('/releases');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{loginResponsiveStyle}</style>
      <div
        className="login-flex-root"
        style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          background: '#181c24',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          flexDirection: 'row',
        }}
      >
        {/* Left: Logo and Title */}
        <div
          className="login-flex-left"
          style={{
            minWidth: 350,
            maxWidth: 600,
            width: '40vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#181c24',
          }}
        >
          <img
            src={`${process.env.PUBLIC_URL}/DataNimbus_Logo_White.svg`}
            alt="DataNimbus Logo"
            style={{ width: 340, maxWidth: '80vw', marginBottom: 32 }}
          />
          <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 36, letterSpacing: 2, marginTop: 0, textAlign: 'center' }}>
            Release Tracker
          </h1>
        </div>
        {/* Right: Login Box */}
        <div
          className="login-flex-right"
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#23283a',
          }}
        >
          <div style={{ background: '#23283a', padding: 40, borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.2)', width: '100%', maxWidth: 400 }}>
            <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: 24, fontWeight: 600 }}>Login</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#b0b8d1', display: 'block', marginBottom: 6 }}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #3a405a', background: '#181c24', color: '#fff', fontSize: 16 }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#b0b8d1', display: 'block', marginBottom: 6 }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #3a405a', background: '#181c24', color: '#fff', fontSize: 16 }}
                />
              </div>
              {error && <div className="error-message" style={{ color: '#e03d5f', marginBottom: 12 }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 4, background: '#214392', color: '#fff', border: 'none', fontWeight: 600, fontSize: 18, marginTop: 8 }}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login; 