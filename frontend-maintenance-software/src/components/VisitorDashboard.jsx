import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages/VisitorDashboard.css';

const VisitorDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="visitor-dashboard">
      <div className="visitor-welcome-card">
        <div className="visitor-icon">👋</div>
        <h1>Welcome, {user?.name}!</h1>
        <p className="visitor-subtitle">Thank you for registering</p>
        
        <div className="visitor-message">
          <div className="pending-icon">⏳</div>
          <h2>Account Pending Approval</h2>
          <p>
            Your account has been created successfully, but you currently have limited access.
            An administrator will review your account and assign you the appropriate role soon.
          </p>
        </div>

        <div className="visitor-info-box">
          <h3>What happens next?</h3>
          <ul>
            <li>
              <span className="step-number">1</span>
              <span>An administrator will be notified of your registration</span>
            </li>
            <li>
              <span className="step-number">2</span>
              <span>They will assign you a role based on your responsibilities</span>
            </li>
            <li>
              <span className="step-number">3</span>
              <span>You'll receive full access to the system features</span>
            </li>
            <li>
              <span className="step-number">4</span>
              <span>You'll be able to manage maintenance, inventory, and more</span>
            </li>
          </ul>
        </div>

        <div className="visitor-contact">
          <p>
            <strong>Need immediate access?</strong>
          </p>
          <p>
            Please contact your system administrator or manager to expedite the approval process.
          </p>
        </div>

        <div className="visitor-current-info">
          <h3>Your Current Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{user?.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{user?.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Department:</span>
              <span className="info-value">{user?.department || 'Not specified'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Current Role:</span>
              <span className="info-value visitor-role-badge">Visitor</span>
            </div>
          </div>
        </div>

        <div className="visitor-footer">
          <p className="visitor-tip">
            💡 <strong>Tip:</strong> You can update your profile information while waiting for approval.
          </p>
          <div className="visitor-branding">
            <p className="visitor-branding-text">
              Designed and Powered by <span className="brand-highlight">SAP-Technology</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorDashboard;
