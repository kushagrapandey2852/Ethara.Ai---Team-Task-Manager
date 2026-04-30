import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedPage from '../components/AnimatedPage';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleToggle = (type) => {
    setLoginType(type);
    if (type === 'admin') {
      setEmail('admin@example.com');
      setPassword('admin123');
    } else {
      setEmail('member@example.com');
      setPassword('member123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedPage className="auth-page">
      <button 
        onClick={toggleTheme} 
        className="theme-toggle-btn auth-theme-toggle" 
        title="Toggle Theme"
        style={{ position: 'absolute', top: '1rem', right: '1rem' }}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      <div className="auth-container auth-container-minimal">
        <div className="auth-logo-minimal">
          <img src="/logo.png" alt="Ethara.AI" className="logo-img" />
          <span className="logo-text">Ethara.AI</span>
        </div>

        <div className="auth-header-minimal">
          <h1>Welcome back</h1>
          <p>Sign in to continue</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', justifyContent: 'center' }}>
          <button 
            type="button" 
            onClick={() => handleToggle('admin')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: loginType === 'admin' ? '2px solid var(--primary)' : '2px solid var(--border-focus)',
              backgroundColor: loginType === 'admin' ? 'var(--primary)' : 'var(--bg-surface-light)',
              color: loginType === 'admin' ? '#fff' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            Admin Login
          </button>
          <button 
            type="button" 
            onClick={() => handleToggle('member')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: loginType === 'member' ? '2px solid var(--primary)' : '2px solid var(--border-focus)',
              backgroundColor: loginType === 'member' ? 'var(--primary)' : 'var(--bg-surface-light)',
              color: loginType === 'member' ? '#fff' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            Member Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-minimal">
          {error && <div className="alert-minimal alert-error-minimal">{error}</div>}

          <div className="form-group-minimal">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="input-minimal"
            />
          </div>

          <div className="form-group-minimal">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="input-minimal"
            />
          </div>

          <button type="submit" className="btn-minimal btn-primary-minimal" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer-minimal">
          <p>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default Login;
