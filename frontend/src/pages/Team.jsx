import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Team = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignProject, setAssignProject] = useState({ project_id: '', role: 'member' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, projectsRes] = await Promise.all([
        axios.get('/analytics/users'),
        axios.get('/projects')
      ]);
      setUsers(usersRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/analytics/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await axios.delete(`/analytics/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const openAssignModal = (user) => {
    setSelectedUser(user);
    setAssignProject({ project_id: '', role: 'member' });
    setShowAssignModal(true);
  };

  const handleAssignToProject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`/projects/${assignProject.project_id}/members`, {
        user_id: selectedUser.id,
        role: assignProject.role
      });
      setShowAssignModal(false);
      setSelectedUser(null);
      alert('User assigned to project successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign user to project');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    return role === 'admin' ? 'badge-admin' : 'badge-member';
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loader"></div>
      </div>
    );
  }

  // Only admins can access this page
  if (user.role !== 'admin') {
    return (
      <div className="team-page">
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/">
              <img src="/logo.png" alt="Ethara.AI" className="logo-img" />
            </Link>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/projects" className="nav-link">Projects</Link>
          </div>
          <div className="nav-user">
            <span className="user-name">{user.username}</span>
            <span className="user-role">{user.role}</span>
            <button onClick={logout} className="btn btn-logout">Logout</button>
          </div>
        </nav>
        <main className="page-content">
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>You need admin privileges to access this page.</p>
            <Link to="/" className="btn btn-primary">Back to Dashboard</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="team-page">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to="/">
            <img src="/logo.png" alt="Ethara.AI" className="logo-img" />
          </Link>
        </div>
<div className="nav-links">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/projects" className="nav-link">Projects</Link>
          <Link to="/team" className="nav-link active">Team</Link>
          <Link to="/analytics" className="nav-link">Analytics</Link>
          <Link to="/settings" className="nav-link">Settings</Link>
        </div>
        <div className="nav-user">
          <span className="user-name">{user.username}</span>
          <span className="user-role">{user.role}</span>
          <button onClick={logout} className="btn btn-logout">Logout</button>
        </div>
      </nav>

      <main className="page-content">
        <div className="page-header">
          <div>
            <h1>Team Management</h1>
            <p>Manage team members and their roles</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="team-stats">
          <div className="stat-card">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Total Members</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{users.filter(u => u.role === 'admin').length}</div>
            <div className="stat-label">Admins</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{users.filter(u => u.role === 'member').length}</div>
            <div className="stat-label">Members</div>
          </div>
        </div>

        <div className="team-table-container">
          <table className="team-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Projects</th>
                <th>Tasks</th>
                <th>Completed</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="user-cell">
                      <span className="user-avatar">{member.username.charAt(0).toUpperCase()}</span>
                      <span className="user-name">{member.username}</span>
                    </div>
                  </td>
                  <td>{member.email}</td>
                  <td>
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className={`role-select ${getRoleBadgeClass(member.role)}`}
                      disabled={member.id === user.id}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{member.project_count || 0}</td>
                  <td>{member.assigned_tasks || 0}</td>
                  <td>{member.completed_tasks || 0}</td>
                  <td>{new Date(member.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => openAssignModal(member)}
                        className="btn btn-small"
                      >
                        Assign
                      </button>
                      {member.id !== user.id && (
                        <button 
                          onClick={() => handleDeleteUser(member.id)}
                          className="btn btn-small btn-delete"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign to Project</h2>
              <button onClick={() => setShowAssignModal(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleAssignToProject} className="modal-form">
              <div className="form-group">
                <label>User</label>
                <div className="form-value">{selectedUser.username}</div>
              </div>
              <div className="form-group">
                <label htmlFor="projectSelect">Select Project</label>
                <select
                  id="projectSelect"
                  value={assignProject.project_id}
                  onChange={(e) => setAssignProject({ ...assignProject, project_id: e.target.value })}
                  required
                >
                  <option value="">Select a project</option>
                  {projects
                    .filter(p => !p.members?.some(m => m.id === selectedUser.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="projectRole">Project Role</label>
                <select
                  id="projectRole"
                  value={assignProject.role}
                  onChange={(e) => setAssignProject({ ...assignProject, role: e.target.value })}
                >
                  <option value="member">Member</option>
                  <option value="admin">Project Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Assigning...' : 'Assign to Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
