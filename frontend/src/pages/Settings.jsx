import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Settings = () => {
  const { user, logout, setUser } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    taskUpdates: true,
    projectInvites: true,
    weeklyDigest: false
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [profileMode, setProfileMode] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#7C3AED' });
  const [categoryLoading, setCategoryLoading] = useState(false);

  React.useEffect(() => {
    if (user.role === 'admin') {
      fetchCategories();
    }
  }, [user.role]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCategoryLoading(true);
    try {
      const response = await axios.post('/categories', newCategory);
      setCategories([...categories, response.data]);
      setNewCategory({ name: '', color: '#7C3AED' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create category');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure? Projects in this category will become uncategorized.')) return;
    try {
      await axios.delete(`/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  const handleChange = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      // In a real app, this would save to backend
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSaved(false);

    // Validate passwords match if trying to change password
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setProfileError('New passwords do not match');
      return;
    }

    if (profileData.newPassword && profileData.newPassword.length < 6) {
      setProfileError('New password must be at least 6 characters');
      return;
    }

    try {
      const updateData = {};
      if (profileData.username && profileData.username !== user.username) {
        updateData.username = profileData.username;
      }
      if (profileData.newPassword) {
        updateData.currentPassword = profileData.currentPassword;
        updateData.newPassword = profileData.newPassword;
      }

      const response = await axios.put('/users/profile', updateData);
      setUser(response.data);
      setProfileSaved(true);
      setProfileData({
        username: response.data.username,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  return (
    <div className="settings-page">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to="/">
            <img src="/logo.png" alt="Ethara.AI" className="logo-img" />
          </Link>
        </div>
<div className="nav-links">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/projects" className="nav-link">Projects</Link>
          {user.role === 'admin' && (
            <>
              <Link to="/team" className="nav-link">Team</Link>
              <Link to="/analytics" className="nav-link">Analytics</Link>
            </>
          )}
          <Link to="/settings" className="nav-link active">Settings</Link>
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
            <h1>Settings</h1>
            <p>Manage your preferences and account settings</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {saved && <div className="alert alert-success">Settings saved successfully!</div>}

        <div className="settings-sections">
          {/* Account Settings */}
<section className="settings-section">
            <h2>Account</h2>
            <div className="settings-card">
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Profile</h3>
                  <p>Your account information</p>
                </div>
                <button 
                  onClick={() => setProfileMode(!profileMode)} 
                  className="btn btn-secondary"
                >
                  {profileMode ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
              <div className="setting-details">
                <div className="detail-row">
                  <span className="detail-label">Username</span>
                  <span className="detail-value">{user.username}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{user.email || 'Not set'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Role</span>
                  <span className="detail-value">{user.role}</span>
                </div>
              </div>

              {/* Profile Update Form */}
              {profileMode && (
                <form onSubmit={handleProfileUpdate} className="profile-form">
                  {profileError && <div className="alert alert-error">{profileError}</div>}
                  {profileSaved && <div className="alert alert-success">Profile updated successfully!</div>}
                  
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                      placeholder="Enter new username"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                      placeholder="Required to change password"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      Update Profile
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>

          {/* Notification Settings */}
          <section className="settings-section">
            <h2>Notifications</h2>
            <div className="settings-card">
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Email Notifications</h3>
                  <p>Receive email updates about your tasks and projects</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={() => handleChange('emailNotifications')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Task Updates</h3>
                  <p>Get notified when tasks are assigned or updated</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.taskUpdates}
                    onChange={() => handleChange('taskUpdates')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Project Invites</h3>
                  <p>Get notified when you're added to a project</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.projectInvites}
                    onChange={() => handleChange('projectInvites')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Weekly Digest</h3>
                  <p>Receive a weekly summary of your task activity</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.weeklyDigest}
                    onChange={() => handleChange('weeklyDigest')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>

          {/* Admin Settings */}
          {user.role === 'admin' && (
            <section className="settings-section">
              <h2>Admin Settings</h2>
              <div className="settings-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Project Categories</h3>
                    <p>Organize projects into categories</p>
                  </div>
                </div>
                <div className="category-management">
                  <form onSubmit={handleCreateCategory} className="category-form">
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Category Name"
                      required
                    />
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    />
                    <button type="submit" className="btn btn-primary" disabled={categoryLoading}>
                      Add
                    </button>
                  </form>
                  <div className="category-list">
                    {categories.map((cat) => (
                      <div key={cat.id} className="category-item-manage">
                        <span className="category-dot" style={{ backgroundColor: cat.color }}></span>
                        <span className="category-name">{cat.name}</span>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="btn-icon btn-delete">×</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Role Permissions</h3>
                    <p>Configure what each role can access</p>
                  </div>
                  <button className="btn btn-secondary">Configure</button>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>System Settings</h3>
                    <p>Global system configuration</p>
                  </div>
                  <button className="btn btn-secondary">Configure</button>
                </div>
              </div>
            </section>
          )}

          {/* About */}
          <section className="settings-section">
            <h2>About</h2>
            <div className="settings-card">
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Team Task Manager</h3>
                  <p>Version 1.0.0</p>
                </div>
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <p className="app-description">
                    A collaborative project management tool where users can create projects, 
                    assign tasks, and track progress with role-based access control.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="settings-actions">
          <button onClick={handleSave} className="btn btn-primary">
            Save Settings
          </button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
