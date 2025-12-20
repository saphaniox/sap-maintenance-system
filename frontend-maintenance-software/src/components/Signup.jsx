import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { FieldTooltip } from './Tooltip';
import sapLogo from '../assets/saplogo.png';
import '../styles/components/Signup.css';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { success: showSuccess } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    // Client-side validation
    const errors = {};

    // Validate name
    if (!name || name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Validate password length
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    // Validate password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/;
    if (password && !passwordRegex.test(password)) {
      errors.password = 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&#)';
    }

    // Make sure passwords match
    if (password !== confirm) {
      errors.confirm = 'Passwords don\'t match';
    }

    // If there are any validation errors, show them and don't submit
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix the errors below before submitting');
      return;
    }

    setLoading(true);
    try {
      // Create the account
      await axios.post('/api/auth/register', { name, email, password });
      
      // Show success notification
      showSuccess('🎉 Account created successfully! Please login to continue.', 4000);
      
      // Account created - redirect to login page
      setTimeout(() => {
        navigate('/login');
      }, 500);
    } catch (err) {
      console.error('Registration error:', err.response?.data || err.message);
      
      // Handle validation errors from backend
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const backendErrors = {};
        err.response.data.errors.forEach(error => {
          // Map error field to our form fields (e.g., error.path or error.param)
          const field = error.path || error.param;
          if (field) {
            backendErrors[field] = error.msg;
          }
        });
        setValidationErrors(backendErrors);
        setError(err.response.data.message || 'Validation failed. Please check the errors below.');
      } else if (err.response?.status === 400 && err.response?.data?.message) {
        // Handle specific error messages (like duplicate email)
        setError(err.response.data.message);
      } else {
        // Generic error
        setError(err.response?.data?.message || err.message || 'Could not create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <img src={sapLogo} alt="SAP Management Software" className="signup-logo" />
        <h2>Create an account</h2>
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <FieldTooltip content="Enter your full legal name as it appears on your ID. This will be used for official records.">
            <label className="form-label">Full name</label>
          </FieldTooltip>
          <input
            type="text"
            className={`form-control ${validationErrors.name ? 'input-error' : ''}`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              // Clear error when user starts typing
              if (validationErrors.name) {
                setValidationErrors(prev => ({ ...prev, name: '' }));
              }
            }}
            required
            placeholder="Enter your full name"
          />
          {validationErrors.name && (
            <div className="field-error">{validationErrors.name}</div>
          )}
        </div>

        <div className="form-group">
          <FieldTooltip content="Enter a valid work email address. This will be your login username and for notifications.">
            <label className="form-label">Email</label>
          </FieldTooltip>
          <input
            type="email"
            className={`form-control ${validationErrors.email ? 'input-error' : ''}`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              // Clear error when user starts typing
              if (validationErrors.email) {
                setValidationErrors(prev => ({ ...prev, email: '' }));
              }
            }}
            required
            placeholder="Enter your email"
          />
          {validationErrors.email && (
            <div className="field-error">{validationErrors.email}</div>
          )}
        </div>

        <div className="form-group">
          <FieldTooltip content="Create a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.">
            <label className="form-label">Password</label>
          </FieldTooltip>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              className={`form-control ${validationErrors.password ? 'input-error' : ''}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                // Clear error when user starts typing
                if (validationErrors.password) {
                  setValidationErrors(prev => ({ ...prev, password: '' }));
                }
              }}
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
          {validationErrors.password && (
            <div className="field-error">{validationErrors.password}</div>
          )}
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
              className={`form-control ${validationErrors.confirm ? 'input-error' : ''}`}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                // Clear error when user starts typing
                if (validationErrors.confirm) {
                  setValidationErrors(prev => ({ ...prev, confirm: '' }));
                }
              }}
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
          {validationErrors.confirm && (
            <div className="field-error">{validationErrors.confirm}</div>
          )}
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
