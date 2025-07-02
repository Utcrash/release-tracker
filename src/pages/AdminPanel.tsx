import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

interface User {
  _id: string;
  username: string;
  role: string;
}

const roles = ['admin', 'editor', 'viewer'];
const USERS_PER_PAGE = 20;

const AdminPanel: React.FC = () => {
  const { role } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'viewer' });
  const [resetPassword, setResetPassword] = useState<{ [id: string]: string }>({});
  const [editRole, setEditRole] = useState<{ [id: string]: string }>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Confirmation dialog state
  const [confirm, setConfirm] = useState<{
    open: boolean;
    action: null | (() => void);
    message: string;
  }>({ open: false, action: null, message: '' });

  // Reset password modal state
  const [resetModal, setResetModal] = useState<{
    open: boolean;
    userId: string | null;
    username: string;
    password: string;
    confirm: string;
    error: string | null;
  }>({ open: false, userId: null, username: '', password: '', confirm: '', error: null });

  const openConfirm = (message: string, action: () => void) => {
    setConfirm({ open: true, action, message });
  };
  const closeConfirm = () => setConfirm({ open: false, action: null, message: '' });
  const doConfirm = () => {
    if (confirm.action) confirm.action();
    closeConfirm();
  };

  const openResetModal = (userId: string, username: string) => {
    setResetModal({ open: true, userId, username, password: '', confirm: '', error: null });
  };
  const closeResetModal = () => setResetModal({ open: false, userId: null, username: '', password: '', confirm: '', error: null });
  const handleResetModalChange = (field: 'password' | 'confirm', value: string) => {
    setResetModal((prev) => ({ ...prev, [field]: value, error: null }));
  };
  const handleResetModalSubmit = async () => {
    if (!resetModal.password || !resetModal.confirm) {
      setResetModal((prev) => ({ ...prev, error: 'Both fields are required.' }));
      return;
    }
    if (resetModal.password !== resetModal.confirm) {
      setResetModal((prev) => ({ ...prev, error: 'Passwords do not match.' }));
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/release-tracker/api/auth/users/${resetModal.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: resetModal.password }),
      });
      if (!res.ok) throw new Error('Failed to reset password');
      closeResetModal();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/release-tracker/api/auth/users', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'admin') fetchUsers();
  }, [role]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/release-tracker/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newUser),
      });
      if (!res.ok) throw new Error('Failed to add user');
      setNewUser({ username: '', password: '', role: 'viewer' });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = (id: string, username: string) => {
    openConfirm(`Are you sure you want to delete user "${username}"?`, async () => {
      setError(null);
      try {
        const res = await fetch(`/release-tracker/api/auth/users/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to delete user');
        fetchUsers();
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const handleRoleChange = (id: string, username: string) => {
    openConfirm(`Change role for "${username}" to "${editRole[id]}"?`, async () => {
      setError(null);
      try {
        const res = await fetch(`/release-tracker/api/auth/users/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ role: editRole[id] }),
        });
        if (!res.ok) throw new Error('Failed to update role');
        setEditRole((prev) => ({ ...prev, [id]: '' }));
        fetchUsers();
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const handleResetPassword = (id: string, username: string) => {
    openConfirm(`Reset password for "${username}"?`, async () => {
      setError(null);
      try {
        const res = await fetch(`/release-tracker/api/auth/users/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ password: resetPassword[id] }),
        });
        if (!res.ok) throw new Error('Failed to reset password');
        setResetPassword((prev) => ({ ...prev, [id]: '' }));
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  // Search and pagination
  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE);

  if (role === null) {
    return <Navigate to="/login" replace />;
  }
  if (role !== 'admin') {
    return <div style={{ color: '#e03d5f', textAlign: 'center', marginTop: 40 }}>You do not have permission to access the admin panel.</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', background: '#23283a', padding: 32, borderRadius: 12 }}>
      <h2 style={{ color: '#fff', marginBottom: 24 }}>Admin Panel</h2>
      {error && <div style={{ color: '#e03d5f', marginBottom: 16 }}>{error}</div>}
      {/* Search */}
      <input
        type="text"
        placeholder="Search by username..."
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        style={{ marginBottom: 24, padding: 8, borderRadius: 4, border: '1px solid #3a405a', background: '#181c24', color: '#fff', width: 300 }}
      />
      {/* Add user */}
      <form onSubmit={handleAddUser} style={{ marginBottom: 32, display: 'flex', gap: 12 }} autoComplete="off">
        <input
          type="text"
          placeholder="Username"
          value={newUser.username}
          onChange={e => setNewUser({ ...newUser, username: e.target.value })}
          required
          style={{ padding: 8, borderRadius: 4, border: '1px solid #3a405a', background: '#181c24', color: '#fff' }}
          autoComplete="off"
        />
        <input
          type="password"
          placeholder="Password"
          value={newUser.password}
          onChange={e => setNewUser({ ...newUser, password: e.target.value })}
          required
          style={{ padding: 8, borderRadius: 4, border: '1px solid #3a405a', background: '#181c24', color: '#fff' }}
          autoComplete="new-password"
        />
        <select
          value={newUser.role}
          onChange={e => setNewUser({ ...newUser, role: e.target.value })}
          style={{ padding: 8, borderRadius: 4, border: '1px solid #3a405a', background: '#181c24', color: '#fff' }}
          autoComplete="off"
        >
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="submit" style={{ padding: 8, borderRadius: 4, background: '#214392', color: '#fff', border: 'none', fontWeight: 600 }}>Add User</button>
      </form>
      {loading ? (
        <div style={{ color: '#b0b8d1' }}>Loading users...</div>
      ) : (
        <>
        <table style={{ width: '100%', color: '#fff', background: '#23283a', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #3a405a' }}>
              <th style={{ padding: 8 }}>Username</th>
              <th style={{ padding: 8 }}>Role</th>
              <th style={{ padding: 8 }}>Change Role</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map(user => (
              <tr key={user._id} style={{ borderBottom: '1px solid #3a405a' }}>
                <td style={{ padding: 8 }}>{user.username}</td>
                <td style={{ padding: 8 }}>{user.role}</td>
                <td style={{ padding: 8 }}>
                  <select
                    value={editRole[user._id] || user.role}
                    onChange={e => setEditRole(prev => ({ ...prev, [user._id]: e.target.value }))}
                    style={{ padding: 4, borderRadius: 4, background: '#181c24', color: '#fff' }}
                    autoComplete="off"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button
                    style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 4, background: '#214392', color: '#fff', border: 'none' }}
                    onClick={() => handleRoleChange(user._id, user.username)}
                    disabled={editRole[user._id] === user.role || !editRole[user._id]}
                  >
                    Update
                  </button>
                </td>
                <td style={{ padding: 8 }}>
                  <button
                    style={{ padding: '4px 8px', borderRadius: 4, background: '#e03d5f', color: '#fff', border: 'none' }}
                    onClick={() => handleDelete(user._id, user.username)}
                  >
                    Delete
                  </button>
                  <button
                    style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 4, background: '#214392', color: '#fff', border: 'none' }}
                    onClick={() => openResetModal(user._id, user.username)}
                  >
                    Reset Password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination controls */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 16 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '6px 16px', borderRadius: 4, background: '#181c24', color: '#fff', border: '1px solid #3a405a' }}
          >
            Previous
          </button>
          <span style={{ color: '#b0b8d1' }}>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '6px 16px', borderRadius: 4, background: '#181c24', color: '#fff', border: '1px solid #3a405a' }}
          >
            Next
          </button>
        </div>
        </>
      )}
      {/* Confirmation Dialog */}
      {confirm.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#23283a', padding: 32, borderRadius: 12, minWidth: 320, boxShadow: '0 2px 16px rgba(0,0,0,0.3)' }}>
            <div style={{ color: '#fff', marginBottom: 24 }}>{confirm.message}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={closeConfirm} style={{ padding: '6px 16px', borderRadius: 4, background: '#3a405a', color: '#fff', border: 'none' }}>Cancel</button>
              <button onClick={doConfirm} style={{ padding: '6px 16px', borderRadius: 4, background: '#e03d5f', color: '#fff', border: 'none' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
      {/* Reset Password Modal */}
      {resetModal.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div style={{ background: '#23283a', padding: 32, borderRadius: 12, minWidth: 340, boxShadow: '0 2px 16px rgba(0,0,0,0.3)' }}>
            <h4 style={{ color: '#fff', marginBottom: 16 }}>Reset Password for {resetModal.username}</h4>
            <div style={{ marginBottom: 12 }}>
              <input
                type="password"
                placeholder="New Password"
                value={resetModal.password}
                onChange={e => handleResetModalChange('password', e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #3a405a', background: '#181c24', color: '#fff', marginBottom: 8 }}
                autoComplete="new-password"
              />
              <input
                type="password"
                placeholder="Re-enter Password"
                value={resetModal.confirm}
                onChange={e => handleResetModalChange('confirm', e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #3a405a', background: '#181c24', color: '#fff' }}
                autoComplete="new-password"
              />
            </div>
            {resetModal.error && <div style={{ color: '#e03d5f', marginBottom: 12 }}>{resetModal.error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={closeResetModal} style={{ padding: '6px 16px', borderRadius: 4, background: '#3a405a', color: '#fff', border: 'none' }}>Cancel</button>
              <button
                onClick={handleResetModalSubmit}
                style={{ padding: '6px 16px', borderRadius: 4, background: '#214392', color: '#fff', border: 'none' }}
                disabled={!resetModal.password || !resetModal.confirm || resetModal.password !== resetModal.confirm}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel; 