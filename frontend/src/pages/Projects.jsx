import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Navbar from '../components/Navbar';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', deadline: '', category_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      setCategories(response.data);
    } catch (err) {
      // Ignore
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects');
      setProjects(response.data);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axios.post('/projects', newProject);
      navigate(`/projects/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <Navbar />

      <main className="page-content">
        <div className="page-header">
          <div>
            <h1>Projects</h1>
            <p>Manage your team projects</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + New Project
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {projects.length > 0 ? (
          <div className="projects-grid">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="project-card"
              >
                <h3>{project.name}</h3>
                {project.description && <p>{project.description}</p>}
                <div className="project-stats">
                  <span>{project.task_count || 0} tasks</span>
                  <span>{project.completed_count || 0} completed</span>
                </div>
                <div className="project-owner">
                  Owned by {project.owner_name}
                  {project.category_name && (
                    <span className="project-category-badge" style={{ backgroundColor: project.category_color }}>
                      {project.category_name}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>Create your first project to start managing tasks</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              Create Project
            </button>
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button onClick={() => setShowModal(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleCreateProject} className="modal-form">
              <div className="form-group">
                <label htmlFor="projectName">Project Name</label>
                <input
                  type="text"
                  id="projectName"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Enter project name"
                  required
                  minLength={3}
                />
              </div>
              <div className="form-group">
                <label htmlFor="projectDescription">Description (optional)</label>
                <textarea
                  id="projectDescription"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label htmlFor="projectDeadline">Deadline (optional)</label>
                <input
                  type="date"
                  id="projectDeadline"
                  value={newProject.deadline}
                  onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="projectCategory">Category (optional)</label>
                <select
                  id="projectCategory"
                  value={newProject.category_id}
                  onChange={(e) => setNewProject({ ...newProject, category_id: e.target.value })}
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
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
