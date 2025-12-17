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

    // Enforce minimum password length
    if (password.length < 6) {
      setError('Password should be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // Create the account
      await axios.post('/api/auth/register', { name, email, password });
      
      // Account created - redirect to login page
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not create account. Please try again.');
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
          <FieldTooltip content="Create a strong password with at least 6 characters, including letters and numbers.">
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
