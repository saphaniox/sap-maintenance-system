import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FieldTooltip } from './Tooltip';
import '../styles/components/Signup.css';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Make sure passwords match before sending to server
    if (password !== confirm) {
      setError('Passwords don\'t match. Please check and try again.');
      return;
    }

    // Enforce minimum password length (match backend requirements)
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Validate password complexity (match backend requirements)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/;
    if (!passwordRegex.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)');
      return;
    }

    setLoading(true);
    try {
      // Create the account
      await axios.post('/api/auth/register', { name, email, password });
      
      // Account created - redirect to login page
      navigate('/login');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Could not create account. Please try again.';
      // Extract validation errors if present
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const validationErrors = err.response.data.errors.map(e => e.msg).join(', ');
        setError(validationErrors);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2>Create an account</h2>
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <FieldTooltip content="Enter your full legal name as it appears on your ID. This will be used for official records.">
            <label className="form-label">Full name</label>
          </FieldTooltip>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group">
          <FieldTooltip content="Enter a valid work email address. This will be your login username and for notifications.">
            <label className="form-label">Email</label>
          </FieldTooltip>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <FieldTooltip content="Create a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.">
            <label className="form-label">Password</label>
          </FieldTooltip>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {password && (
            <div className="password-requirements" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ color: password.length >= 8 ? 'green' : 'gray' }}>
                {password.length >= 8 ? '✓' : '○'} At least 8 characters
              </div>
              <div style={{ color: /[A-Z]/.test(password) ? 'green' : 'gray' }}>
                {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
              </div>
              <div style={{ color: /[a-z]/.test(password) ? 'green' : 'gray' }}>
                {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
              </div>
              <div style={{ color: /\d/.test(password) ? 'green' : 'gray' }}>
                {/\d/.test(password) ? '✓' : '○'} One number
              </div>
              <div style={{ color: /[@$!%*?&#]/.test(password) ? 'green' : 'gray' }}>
                {/[@$!%*?&#]/.test(password) ? '✓' : '○'} One special character (@$!%*?&#)
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <FieldTooltip content="Re-enter your password exactly as above to confirm it matches.">
            <label className="form-label">Confirm password</label>
          </FieldTooltip>
          <div className="password-input-wrapper">
            <input
              type={showConfirm ? "text" : "password"}
              className="form-control"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button type="submit" className="signup-button" disabled={loading}>
          <span>{loading ? 'Creating account...' : 'Sign up'}</span>
        </button>

        <div className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </form>
      
      <footer className="page-footer">
        <div className="footer-content">
          <span className="footer-text">Designed and Powered by </span>
          <a 
            href="https://www.sap-technologies.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="footer-link-company"
          >
            SAP-Technologies Uganda
          </a>
        </div>
      </footer>
    </div>
  );
}
