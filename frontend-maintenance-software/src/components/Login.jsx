import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { FieldTooltip } from './Tooltip';
import '../styles/components/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { success: showSuccess } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Try to log them in
    const result = await login(email, password);
    
    if (result.success) {
      // Show success notification
      showSuccess('✅ Login successful! Welcome back!', 3000);
      
      // All good! Send them to the welcome page
      setTimeout(() => {
        navigate('/');
      }, 300);
    } else {
      // Something went wrong - show the error message
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Maintenance Tracker</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <FieldTooltip content="Enter your work email address. This should be the email you used during registration.">
            <label className="form-label">Email *</label>
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
          <FieldTooltip content="Enter your secure password. Make sure caps lock is off and check for typos.">
            <label className="form-label">Password *</label>
          </FieldTooltip>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
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
        <button
          type="submit"
          className="login-button"
          disabled={loading}
        >
          <span>{loading ? 'Logging in...' : 'Login'}</span>
        </button>
        <div className="signup-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
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

export default Login;