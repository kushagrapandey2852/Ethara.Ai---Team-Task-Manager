import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Analytics = () => {
  const { user, logout } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/analytics/analytics');
      // Initialize with default values if data is empty
      const data = response.data || {};
      setAnalytics({
        completionRate: data.completionRate || 0,
        completedThisWeek: data.completedThisWeek || 0,
        createdThisWeek: data.createdThisWeek || 0,
        memberPerformance: data.memberPerformance || [],
        projectsWithProgress: data.projectsWithProgress || [],
        overdueAnalysis: data.overdueAnalysis || [],
        tasksByPriority: data.tasksByPriority || [],
        activityFeed: data.activityFeed || []
      });
    } catch (err) {
      console.error('Analytics error:', err);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCompletionColor = (rate) => {
    if (rate >= 80) return 'var(--success)';
    if (rate >= 50) return 'var(--warning)';
    return 'var(--error)';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--error)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'task_created': return '+';
      case 'task_completed': return '✓';
      default: return '•';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'task_created': return 'var(--primary)';
      case 'task_completed': return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
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
      <div className="analytics-page">
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
    <div className="analytics-page">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to="/">
            <img src="/logo.svg" alt="Team Tasks" className="logo-img" />
          </Link>
        </div>
<div className="nav-links">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/projects" className="nav-link">Projects</Link>
          <Link to="/team" className="nav-link">Team</Link>
          <Link to="/analytics" className="nav-link active">Analytics</Link>
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
            <h1>Analytics & Reports</h1>
            <p>System-wide performance insights</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Overview Stats */}
        <section className="analytics-section">
          <h2>Overview</h2>
          <div className="analytics-grid">
            <div className="stat-card">
              <div className="stat-value" style={{ color: getCompletionColor(analytics.completionRate) }}>
                {analytics.completionRate?.toFixed(1)}%
              </div>
              <div className="stat-label">Completion Rate</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {analytics.completedThisWeek}
              </div>
              <div className="stat-label">Completed This Week</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--primary)' }}>
                {analytics.createdThisWeek}
              </div>
              <div className="stat-label">Created This Week</div>
            </div>
          </div>
        </section>

        {/* Task Distribution */}
        <section className="analytics-section">
          <h2>Task Distribution</h2>
          <div className="distribution-chart">
            {analytics.tasksByPriority?.map((item) => (
              <div key={item.priority} className="distribution-bar">
                <div className="bar-label">
                  <span className="bar-name">{item.priority}</span>
                  <span className="bar-value">{item.count}</span>
                </div>
                <div className="bar-track">
                  <div 
                    className="bar-fill"
                    style={{ 
                      width: `${(item.count / (analytics.tasksByPriority.reduce((a, b) => a + b.count, 0) || 1)) * 100}%`,
                      backgroundColor: getPriorityColor(item.priority)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Project Progress */}
        <section className="analytics-section">
          <h2>Project Progress</h2>
          <div className="project-progress-list">
            {analytics.projectsWithProgress?.length > 0 ? (
              analytics.projectsWithProgress.map((project) => (
                <div key={project.id} className="project-progress-card">
                  <div className="project-info">
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                  </div>
                  <div className="progress-stats">
                    <div className="progress-item">
                      <span className="progress-label">Progress</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="progress-value">{project.progress}%</span>
                    </div>
                    <div className="task-counts">
                      <span>{project.completed_tasks}/{project.total_tasks} tasks</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No projects found</p>
              </div>
            )}
          </div>
        </section>

        {/* Member Performance */}
        <section className="analytics-section">
          <h2>Member Performance</h2>
          <div className="performance-table-container">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Total Tasks</th>
                  <th>Completed</th>
                  <th>Completion Rate</th>
                  <th>Overdue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.memberPerformance?.length > 0 ? (
                  analytics.memberPerformance.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="user-cell">
                          <span className="user-avatar">{member.username.charAt(0).toUpperCase()}</span>
                          <span>{member.username}</span>
                        </div>
                      </td>
                      <td>{member.total}</td>
                      <td>{member.completed}</td>
                      <td>
                        <div className="completion-rate">
                          <div className="rate-bar">
                            <div 
                              className="rate-fill"
                              style={{ 
                                width: `${member.total > 0 ? (member.completed / member.total) * 100 : 0}%`,
                                backgroundColor: getCompletionColor(member.total > 0 ? (member.completed / member.total) * 100 : 0)
                              }}
                            />
                          </div>
                          <span>{member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0}%</span>
                        </div>
                      </td>
                      <td className={member.overdue > 0 ? 'text-error' : ''}>
                        {member.overdue}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-cell">No member data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Overdue Analysis */}
        <section className="analytics-section">
          <h2>Overdue Analysis</h2>
          <div className="overdue-list">
            {analytics.overdueAnalysis?.length > 0 ? (
              analytics.overdueAnalysis.map((item) => (
                <div key={item.id} className="overdue-item">
                  <span className="overdue-project">{item.name}</span>
                  <span className="overdue-count">{item.overdue_count} overdue</span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No overdue tasks</p>
              </div>
            )}
          </div>
        </section>

        {/* Activity Feed */}
        <section className="analytics-section">
          <h2>Recent Activity</h2>
          <div className="activity-feed">
            {analytics.activityFeed?.length > 0 ? (
              analytics.activityFeed.map((activity, index) => (
                <div key={index} className="activity-item">
                  <span 
                    className="activity-icon"
                    style={{ backgroundColor: getActivityColor(activity.type) }}
                  >
                    {getActivityIcon(activity.type)}
                  </span>
                  <div className="activity-content">
                    <span className="activity-description">{activity.description}</span>
                    <span className="activity-meta">
                      by {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Analytics;
