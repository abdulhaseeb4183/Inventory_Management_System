import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/AuthPage.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Load users from localStorage
    let savedUsers = [];
    try {
      const raw = localStorage.getItem('sm_users');
      if (raw) {
        savedUsers = JSON.parse(raw);
      } else {
        savedUsers = [
          { id: 1, name: 'Admin', email: 'admin@stockmaster.com', password: 'admin', role: 'Administrator' }
        ];
        localStorage.setItem('sm_users', JSON.stringify(savedUsers));
      }
    } catch {
      savedUsers = [
        { id: 1, name: 'Admin', email: 'admin@stockmaster.com', password: 'admin', role: 'Administrator' }
      ];
    }

    if (isLogin) {
      const user = savedUsers.find(
        (u) =>
          u.email.trim().toLowerCase() === email.trim().toLowerCase() &&
          u.password === password
      );
      if (user) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('sm_currentUser', JSON.stringify(user));
        navigate('/dashboard');
      } else {
        setError('Invalid email or password.');
      }
    } else {
      // Sign up flow
      const exists = savedUsers.some(
        (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
      );
      if (exists) {
        setError('A user with this email address already exists.');
        return;
      }

      const newUser = {
        id: Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: 'Operator', // Default role for self-signups
      };

      const updatedUsers = [...savedUsers, newUser];
      localStorage.setItem('sm_users', JSON.stringify(updatedUsers));
      alert('Registration successful! You can now log in.');
      setIsLogin(true);
      setName('');
      setPassword('');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-back-header">
          <Link
            to="/"
            className="auth-back-link"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to home
          </Link>
        </div>
        <h2 className="auth-title">
          {isLogin ? 'Welcome Back' : 'Create Admin Account'}
        </h2>
        <p className="auth-subtitle">
          {isLogin ? 'Enter your credentials to access the dashboard.' : 'Sign up to start managing your inventory.'}
        </p>

        {error && (
          <div className="auth-error-message" style={{ color: 'var(--danger, #ef4444)', fontSize: '13px', margin: '0 0 15px', fontWeight: '600', background: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--danger, #ef4444)' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <label className="auth-label">Full Name</label>
              <input
                type="text"
                className="auth-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </>
          )}

          <label className="auth-label">Email Address</label>
          <input
            type="email"
            className="auth-input"
            placeholder="admin@stockmaster.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="auth-label">Password</label>
          <input
            type="password"
            className="auth-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="auth-submit-btn">
            {isLogin ? 'Login to Dashboard' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch-text">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="auth-switch-btn"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>

        <div className="auth-footer">
          <Link
            to="/"
            aria-label="Back to landing page"
            className="auth-footer-link"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}
