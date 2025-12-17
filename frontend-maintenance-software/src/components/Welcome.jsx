import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/components/Welcome.css';

export default function Welcome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, show them a button to go to dashboard
  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1 className="welcome-title">
          🛠 SAP Maintenance Tracking System
        </h1>
        <p className="welcome-subtitle">
          Streamline Your Maintenance Operations
        </p>
        <p className="welcome-description">
          A comprehensive solution for managing machines, tracking maintenance schedules,
          monitoring inventory and handling requisitions. Built for efficiency and reliability.
        </p>

        <div className="welcome-actions">
          {user ? (
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/login')}
              >
                Login
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        <div className="welcome-features">
          <div className="feature-card">
            <div className="feature-icon">🔧</div>
            <h3 className="feature-title">Maintenance Tracking</h3>
            <p className="feature-description">
              Schedule and monitor maintenance tasks to prevent downtime and extend equipment life.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📦</div>
            <h3 className="feature-title">Inventory Control</h3>
            <p className="feature-description">
              Manage spare parts and supplies with real-time inventory tracking and alerts.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📍</div>
            <h3 className="feature-title">Site Management</h3>
            <p className="feature-description">
              Organize and monitor multiple locations with centralized oversight and reporting.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3 className="feature-title">Requisition System</h3>
            <p className="feature-description">
              Streamline procurement with automated requisition workflows and approval tracking.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3 className="feature-title">Analytics & Reports</h3>
            <p className="feature-description">
              Gain insights with comprehensive analytics, performance metrics, and custom reports.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3 className="feature-title">Production Reports</h3>
            <p className="feature-description">
              Track daily production metrics, monitor efficiency, and generate detailed reports.
            </p>
          </div>
        </div>

        <div className="welcome-benefits">
          <h2 className="benefits-title">Why Choose Our System?</h2>
          <div className="benefits-grid">
            <div className="benefit-item">
              <span className="benefit-icon">⚡</span>
              <div className="benefit-content">
                <h4>Real-Time Updates</h4>
                <p>Stay informed with instant notifications and live data synchronization</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🔒</span>
              <div className="benefit-content">
                <h4>Secure & Reliable</h4>
                <p>Role-based access control and encrypted data protection</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">📱</span>
              <div className="benefit-content">
                <h4>Responsive Design</h4>
                <p>Access from any device - desktop, tablet, or mobile</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">⚙️</span>
              <div className="benefit-content">
                <h4>Easy to Use</h4>
                <p>Intuitive interface designed for efficiency and minimal training</p>
              </div>
            </div>
          </div>
        </div>

        <div className="welcome-stats">
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">System Availability</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">100+</div>
            <div className="stat-label">Machines Managed</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">1000+</div>
            <div className="stat-label">Tasks Completed</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">99%</div>
            <div className="stat-label">Uptime Guarantee</div>
          </div>
        </div>
      </div>
      
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
