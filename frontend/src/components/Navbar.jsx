import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">
          <img src="/logo.png" alt="Ethara.AI" className="logo-img" />
          <span className="logo-text">Ethara.AI</span>
        </Link>
      </div>
      <div className="nav-links">
        <Link to="/" className={`nav-link ${isActive('/')}`}>Dashboard</Link>
        <Link to="/projects" className={`nav-link ${isActive('/projects')}`}>Projects</Link>
        {user.role === 'admin' && (
          <Link to="/team" className={`nav-link ${isActive('/team')}`}>Team</Link>
        )}
        {user.role === 'admin' && (
          <Link to="/analytics" className={`nav-link ${isActive('/analytics')}`}>Analytics</Link>
        )}
        <Link to="/notifications" className={`nav-link ${isActive('/notifications')}`}>Notifications</Link>
        <Link to="/settings" className={`nav-link ${isActive('/settings')}`}>Settings</Link>
      </div>
      <div className="nav-user">
        <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="user-info-badge">
          <span className="user-name">@{user.username}</span>
          <span className="user-role">{user.role}</span>
        </div>
        <button onClick={logout} className="btn btn-logout">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
