import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Navbar from '../components/Navbar';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    assignee_id: ''
  });
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editProjectData, setEditProjectData] = useState({
    name: '',
    description: '',
    deadline: ''
  });
  const [categories, setCategories] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [newMember, setNewMember] = useState({ user_id: '', role: 'member' });
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myTaskStatus, setMyTaskStatus] = useState(null);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [taskDetail, setTaskDetail] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      setCategories(response.data);
    } catch (err) {
      // Ignore
    }
  };

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes, membersRes] = await Promise.all([
        axios.get(`/projects/${id}`),
        axios.get(`/tasks/project/${id}`),
        axios.get(`/projects/${id}/members`)
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
      setMembers(membersRes.data);

      // Check if user is project admin or system admin
      const member = membersRes.data.find(m => m.user_id === user.id || m.id === user.id);
      setIsAdmin(member?.project_role === 'admin' || user.role === 'admin');
    } catch (err) {
      setError('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`/tasks/project/${id}`, newTask);
      const tasksRes = await axios.get(`/tasks/project/${id}`);
      setTasks(tasksRes.data);
      setShowTaskModal(false);
      resetTaskForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`/tasks/${selectedTask.id}`, newTask);
      const tasksRes = await axios.get(`/tasks/project/${id}`);
      setTasks(tasksRes.data);
      setShowTaskModal(false);
      setSelectedTask(null);
      resetTaskForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  // Member can only update status of their own assigned tasks
  const handleUpdateMyTaskStatus = async (taskId, newStatus) => {
    setSubmitting(true);
    try {
      await axios.patch(`/tasks/${taskId}/status`, { status: newStatus });
      const tasksRes = await axios.get(`/tasks/project/${id}`);
      setTasks(tasksRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`/projects/${id}/members`, newMember);
      const membersRes = await axios.get(`/projects/${id}/members`);
      setMembers(membersRes.data);
      setShowMemberModal(false);
      setNewMember({ user_id: '', role: 'member' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await axios.delete(`/projects/${id}/members/${userId}`);
      setMembers(members.filter(m => m.id !== userId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const fetchComments = async (taskId) => {
    setLoadingComments(true);
    try {
      const response = await axios.get(`/tasks/${taskId}/comments`);
      setComments(response.data);
    } catch (err) {
      console.error('Failed to fetch comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      const response = await axios.post(`/tasks/${taskDetail.id}/comments`, { content: newComment });
      setComments([...comments, response.data]);
      setNewComment('');
    } catch (err) {
      setError('Failed to add comment');
    }
  };

  const openTaskDetail = async (task) => {
    setTaskDetail(task);
    setShowTaskDetailModal(true);
    fetchComments(task.id);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`/projects/${id}`, editProjectData);
      const projectRes = await axios.get(`/projects/${id}`);
      setProject(projectRes.data);
      setShowEditProjectModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? ALL tasks and data will be permanently removed.')) return;
    try {
      await axios.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const openEditProject = () => {
    setEditProjectData({
      name: project.name,
      description: project.description || '',
      deadline: project.deadline ? project.deadline.split('T')[0] : '',
      category_id: project.category_id || ''
    });
    setShowEditProjectModal(true);
  };

  const resetTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      due_date: '',
      assignee_id: ''
    });
  };

  const openEditTask = (task) => {
    setSelectedTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      assignee_id: task.assignee_id || ''
    });
    setShowTaskModal(true);
  };

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('/users');
      setAllUsers(response.data);
    } catch (err) {
      // Ignore
    }
  };

  const openMemberModal = async () => {
    await fetchAllUsers();
    setShowMemberModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'var(--warning)';
      case 'in_progress': return 'var(--primary)';
      case 'completed': return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--error)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      <Navbar />

      <main className="page-content">
        <div className="page-header">
          <div>
            <Link to="/projects" className="back-link">← Back to Projects</Link>
            <div className="project-title-area">
              <h1>{project?.name}</h1>
              {project?.category_name && (
                <span className="project-category-badge" style={{ backgroundColor: project.category_color }}>
                  {project.category_name}
                </span>
              )}
              {isAdmin && (
                <div className="project-actions">
                  <button onClick={openEditProject} className="btn btn-secondary btn-small">Edit Project</button>
                  <button onClick={handleDeleteProject} className="btn btn-delete btn-small">Delete Project</button>
                </div>
              )}
            </div>
            {project?.description && <p>{project.description}</p>}
            {project?.deadline && (
              <p className={`project-deadline ${new Date(project.deadline) < new Date() ? 'text-error' : ''}`}>
                Deadline: {new Date(project.deadline).toLocaleDateString()}
              </p>
            )}
          </div>
          <button onClick={() => { resetTaskForm(); setSelectedTask(null); setShowTaskModal(true); }} className="btn btn-primary">
            + New Task
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

<div className="project-layout">
          <section className="tasks-section">
            <h2>Tasks ({tasks.length})</h2>
            <div className="task-list">
              {tasks.length > 0 ? (
                tasks.map((task) => {
                  // Check if this task is assigned to current user (for member status update)
                  const isMyTask = task.assignee_id === user.id;
                  const canEdit = isAdmin || isMyTask;
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`task-card ${isOverdue(task.due_date) && task.status !== 'completed' ? 'task-overdue' : ''}`}
                      onClick={() => openTaskDetail(task)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="task-header">
                        <h3>{task.title}</h3>
                        <div className="task-actions">
                          {isAdmin ? (
                            <div onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => openEditTask(task)} className="btn-icon">Edit</button>
                              <button onClick={() => handleDeleteTask(task.id)} className="btn-icon btn-delete">Delete</button>
                            </div>
                          ) : (
                            isMyTask && (
                              <div onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={task.status}
                                  onChange={(e) => handleUpdateMyTaskStatus(task.id, e.target.value)}
                                  className="status-select"
                                  disabled={submitting}
                                >
                                  <option value="pending">To Do</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="completed">Done</option>
                                </select>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                      {task.description && <p className="task-description">{task.description}</p>}
                      <div className="task-badges">
                        <span className="task-badge" style={{ backgroundColor: getStatusColor(task.status) }}>
                          {task.status?.replace('_', ' ')}
                        </span>
                        <span className="task-badge" style={{ backgroundColor: getPriorityColor(task.priority) }}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="task-meta">
                        {task.assignee_name && <span>Assigned to: @{task.assignee_name}</span>}
                        {task.due_date && (
                          <span className={isOverdue(task.due_date) && task.status !== 'completed' ? 'text-error' : ''}>
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <p>No tasks yet. Create your first task!</p>
                </div>
              )}
            </div>
          </section>

          <aside className="members-section">
            <div className="section-header">
              <h2>Members ({members.length})</h2>
              {isAdmin && (
                <button onClick={openMemberModal} className="btn btn-small">+ Add</button>
              )}
            </div>
            <div className="members-list">
              {members.map((member) => (
                <div key={member.id} className="member-item">
                  <div className="member-info">
                    <span className="member-name">{member.username}</span>
                    <span className="member-role">{member.project_role}</span>
                  </div>
                  {isAdmin && member.id !== user.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="btn-icon btn-delete"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>

      {showTaskModal && (
        <div className="modal-overlay" onClick={() => { setShowTaskModal(false); setSelectedTask(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTask ? 'Edit Task' : 'Create Task'}</h2>
              <button onClick={() => { setShowTaskModal(false); setSelectedTask(null); }} className="modal-close">&times;</button>
            </div>
            <form onSubmit={selectedTask ? handleUpdateTask : handleCreateTask} className="modal-form">
              <div className="form-group">
                <label htmlFor="taskTitle">Task Title</label>
                <input
                  type="text"
                  id="taskTitle"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="taskDescription">Description</label>
                <textarea
                  id="taskDescription"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="taskStatus">Status</label>
                  <select
                    id="taskStatus"
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="taskPriority">Priority</label>
                  <select
                    id="taskPriority"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="taskAssignee">Assignee</label>
                <select
                  id="taskAssignee"
                  value={newTask.assignee_id}
                  onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.username}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="taskDueDate">Due Date</label>
                <input
                  type="date"
                  id="taskDueDate"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => { setShowTaskModal(false); setSelectedTask(null); }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (selectedTask ? 'Update Task' : 'Create Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditProjectModal && (
        <div className="modal-overlay" onClick={() => setShowEditProjectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Project</h2>
              <button onClick={() => setShowEditProjectModal(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleUpdateProject} className="modal-form">
              <div className="form-group">
                <label htmlFor="editProjectName">Project Name</label>
                <input
                  type="text"
                  id="editProjectName"
                  value={editProjectData.name}
                  onChange={(e) => setEditProjectData({ ...editProjectData, name: e.target.value })}
                  placeholder="Enter project name"
                  required
                  minLength={3}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editProjectDescription">Description</label>
                <textarea
                  id="editProjectDescription"
                  value={editProjectData.description}
                  onChange={(e) => setEditProjectData({ ...editProjectData, description: e.target.value })}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editProjectDeadline">Deadline</label>
                <input
                  type="date"
                  id="editProjectDeadline"
                  value={editProjectData.deadline}
                  onChange={(e) => setEditProjectData({ ...editProjectData, deadline: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editProjectCategory">Category</label>
                <select
                  id="editProjectCategory"
                  value={editProjectData.category_id}
                  onChange={(e) => setEditProjectData({ ...editProjectData, category_id: e.target.value })}
                >
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowEditProjectModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Update Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Member</h2>
              <button onClick={() => setShowMemberModal(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleAddMember} className="modal-form">
              <div className="form-group">
                <label htmlFor="memberUser">Select User</label>
                <select
                  id="memberUser"
                  value={newMember.user_id}
                  onChange={(e) => setNewMember({ ...newMember, user_id: e.target.value })}
                  required
                >
                  <option value="">Select a user</option>
                  {allUsers
                    .filter(u => !members.some(m => m.id === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="memberRole">Role</label>
                <select
                  id="memberRole"
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskDetailModal && taskDetail && (
        <div className="modal-overlay" onClick={() => setShowTaskDetailModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Task Details</h2>
              <button onClick={() => setShowTaskDetailModal(false)} className="modal-close">&times;</button>
            </div>
            <div className="task-detail-content">
              <div className="task-main-info">
                <h3>{taskDetail.title}</h3>
                <div className="task-badges" style={{ marginBottom: '1rem' }}>
                  <span className="task-badge" style={{ backgroundColor: getStatusColor(taskDetail.status) }}>
                    {taskDetail.status?.replace('_', ' ')}
                  </span>
                  <span className="task-badge" style={{ backgroundColor: getPriorityColor(taskDetail.priority) }}>
                    {taskDetail.priority}
                  </span>
                </div>
                <p className="task-description-large">{taskDetail.description || 'No description provided.'}</p>
                
                <div className="task-meta-grid">
                  <div className="meta-item">
                    <span className="meta-label">Assignee</span>
                    <span className="meta-value">{taskDetail.assignee_name ? `@${taskDetail.assignee_name}` : 'Unassigned'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Due Date</span>
                    <span className="meta-value">{taskDetail.due_date ? new Date(taskDetail.due_date).toLocaleDateString() : 'No deadline'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Created By</span>
                    <span className="meta-value">{taskDetail.creator_name ? `@${taskDetail.creator_name}` : 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="task-comments-section">
                <h4>Comments ({comments.length})</h4>
                <div className="comments-list">
                  {loadingComments ? (
                    <div className="loader-small"></div>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-user">@{comment.username}</span>
                          <span className="comment-date">{new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        <div className="comment-content">{comment.content}</div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-msg">No comments yet. Start the conversation!</p>
                  )}
                </div>
                <form onSubmit={handleAddComment} className="comment-form">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={2}
                    required
                  />
                  <button type="submit" className="btn btn-primary btn-small" disabled={!newComment.trim()}>
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
