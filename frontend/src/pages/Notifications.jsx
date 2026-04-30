import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Notifications = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/notifications');
      setNotifications(response.data);
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: 1 } : n
      ));
    } catch (err) {
      // Ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      // Ignore
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      // Ignore
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return '📋';
      case 'task_updated':
        return '✏️';
      case 'task_completed':
        return '✅';
      case 'deadline_approaching':
        return '⏰';
      case 'project_invite':
        return '📥';
      case 'comment_added':
        return '💬';
      default:
        return '🔔';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
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
            <h1>Notifications</h1>
            <p>{unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className="btn btn-secondary">
              Mark All as Read
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="notifications-list">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <h3>{notification.title}</h3>
                    <span className="notification-time">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {notification.message && (
                    <p className="notification-message">{notification.message}</p>
                  )}
                  {notification.task_title && (
                    <Link to={`/projects/${notification.project_id}`} className="notification-link">
                      View Task: {notification.task_title}
                    </Link>
                  )}
                  {notification.project_name && (
                    <Link to={`/projects/${notification.project_id}`} className="notification-link">
                      View Project: {notification.project_name}
                    </Link>
                  )}
                </div>
                <div className="notification-actions">
                  {!notification.is_read && (
                    <button 
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="btn-icon"
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(notification.id)}
                    className="btn-icon btn-delete"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No notifications yet.</p>
              <p className="text-secondary">
                You'll receive notifications when tasks are assigned to you or updated.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
