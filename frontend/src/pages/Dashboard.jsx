import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Navbar from '../components/Navbar';
import AnimatedPage from '../components/AnimatedPage';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/dashboard');
      setStats(response.data);
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loader"></div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'var(--warning)';
      case 'in_progress':
        return 'var(--primary)';
      case 'completed':
        return 'var(--success)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'var(--error)';
      case 'medium':
        return 'var(--warning)';
      case 'low':
        return 'var(--success)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
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

  // Determine which title and tasks to show based on user role
  const isAdmin = user?.role === 'admin';

  return (
    <AnimatedPage className="dashboard">
      <Navbar />

      <main className="dashboard-content">
        <div className="page-header">
          <h1>{isAdmin ? 'Admin Dashboard' : 'My Dashboard'}</h1>
          <p>
            {isAdmin 
              ? 'Overview of all tasks and projects across the team' 
              : 'Focus on your assigned tasks and projects'}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Stats Grid - Different for admin vs member */}
        <div className="stats-grid">
          {isAdmin ? (
            // Admin Stats
            <>
              <div className="stat-card">
                <div className="stat-value">{stats?.totalTasks || 0}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--primary)' }}>
                  {stats?.teamMembers || 0}
                </div>
                <div className="stat-label">Team Members</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--warning)' }}>
                  {stats?.pendingTasks || 0}
                </div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--success)' }}>
                  {stats?.completedTasks || 0}
                </div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card stat-card-warning">
                <div className="stat-value" style={{ color: 'var(--error)' }}>
                  {stats?.overdueTasks || 0}
                </div>
                <div className="stat-label">Overdue</div>
              </div>
            </>
          ) : (
            // Member Stats
            <>
              <div className="stat-card">
                <div className="stat-value">{stats?.totalTasks || 0}</div>
                <div className="stat-label">My Tasks</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--warning)' }}>
                  {stats?.pendingTasks || 0}
                </div>
                <div className="stat-label">To Do</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--primary)' }}>
                  {stats?.inProgressTasks || 0}
                </div>
                <div className="stat-label">In Progress</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--success)' }}>
                  {stats?.completedTasks || 0}
                </div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card stat-card-warning">
                <div className="stat-value" style={{ color: 'var(--error)' }}>
                  {stats?.overdueTasks || 0}
                </div>
                <div className="stat-label">Overdue</div>
              </div>
            </>
          )}
        </div>

        <div className="dashboard-sections">
          {/* Admin: Shows all recent tasks | Member: Shows their assigned tasks */}
          <section className="recent-tasks">
            <div className="section-header">
              <h2>{isAdmin ? 'Recent Tasks' : 'My Tasks'}</h2>
              <Link to="/projects" className="btn btn-secondary">
                {isAdmin ? 'All Projects' : 'View Projects'}
              </Link>
            </div>
            {stats?.recentTasks?.length > 0 ? (
              <div className="task-list">
                {stats.recentTasks.map((task) => (
                  <div key={task.id} className={`task-item ${isOverdue(task.due_date) && task.status !== 'completed' ? 'task-overdue' : ''}`}>
                    <div className="task-info">
                      <h3>{task.title}</h3>
                      <p>{task.project_name}</p>
                    </div>
                    <div className="task-meta">
                      <span
                        className="task-status"
                        style={{ backgroundColor: getStatusColor(task.status) }}
                      >
                        {task.status?.replace('_', ' ')}
                      </span>
                      {task.priority && (
                        <span 
                          className="task-badge"
                          style={{ backgroundColor: getPriorityColor(task.priority) }}
                        >
                          {task.priority}
                        </span>
                      )}
                      {task.assignee_name && !isAdmin && (
                        <span className="task-assignee">@{task.assignee_name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>{isAdmin ? 'No tasks yet. Create a project to get started!' : 'No tasks assigned to you yet.'}</p>
                <Link to="/projects" className="btn btn-primary">
                  {isAdmin ? 'Create Project' : 'View Projects'}
                </Link>
              </div>
            )}
          </section>

          {/* Only show upcoming deadlines for members */}
          {!isAdmin && stats?.upcomingDeadlines?.length > 0 && (
            <section className="upcoming-deadlines">
              <div className="section-header">
                <h2>Upcoming Deadlines</h2>
              </div>
              <div className="task-list">
                {stats.upcomingDeadlines.map((task) => (
                  <div key={task.id} className="task-item deadline-item">
                    <div className="task-info">
                      <h3>{task.title}</h3>
                      <p>{task.project_name}</p>
                    </div>
                    <div className="task-meta">
                      <span className={`due-date ${isOverdue(task.due_date) ? 'overdue' : ''}`}>
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="projects-summary">
            <div className="section-header">
              <h2>{isAdmin ? 'Project Progress' : 'My Projects'}</h2>
              <Link to="/projects" className="btn btn-secondary">Manage</Link>
            </div>
            {isAdmin ? (
              <div className="project-progress-grid">
                {stats?.projectProgress?.length > 0 ? (
                  stats.projectProgress.map((project) => (
                    <Link key={project.id} to={`/projects/${project.id}`} className="project-progress-item">
                      <div className="project-info">
                        <h3>{project.name}</h3>
                        <span>{project.completed_tasks}/{project.total_tasks} tasks</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${project.total_tasks > 0 ? (project.completed_tasks / project.total_tasks) * 100 : 0}%` }}
                        />
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="empty-msg">No projects found</p>
                )}
              </div>
            ) : (
              stats?.projects?.length > 0 ? (
                <div className="project-list-compact">
                  {stats.projects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="project-card-compact"
                    >
                      <h3>{project.name}</h3>
                      {isAdmin && project.owner_name && (
                        <span className="project-owner">by @{project.owner_name}</span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>You are not a member of any project yet.</p>
                </div>
              )
            )}
          </section>

          {isAdmin && stats?.activityFeed?.length > 0 && (
            <section className="activity-feed-section">
              <div className="section-header">
                <h2>Activity Feed</h2>
              </div>
              <div className="activity-feed">
                {stats.activityFeed.map((activity, index) => (
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
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </AnimatedPage>
  );
};

export default Dashboard;
