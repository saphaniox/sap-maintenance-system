import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';
import Breadcrumbs from './Breadcrumbs';
import { APP_VERSION } from '../config/version';
import sapLogo from '../assets/saplogo.png';
import '../styles/components/Layout.css';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  const getInitials = (name) => {
    // Get first letters of name for avatar (e.g., "John Doe" -> "JD")
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="layout">
      <header className="navbar">
        <nav className="navbar-content">
          {/* Logo and brand */}
          <div className="navbar-brand-section">
            <img src={sapLogo} alt="SAP Management Software" className="company-logo" />
            <div className="brand-text">
              <h1 className="navbar-brand">SAP Maintenance</h1>
              <span className="brand-tagline">Professional Tracking System</span>
            </div>
          </div>
          
          {/* Mobile menu toggle */}
          {user && (
            <button 
              className="mobile-menu-toggle"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle menu"
            >
              {showMobileMenu ? '✕' : '☰'}
            </button>
          )}
          
          {/* Navigation links - desktop */}
          <ul className={`navbar-nav ${showMobileMenu ? 'mobile-open' : ''}`}>
            <li>
              <Link 
                to="/dashboard" 
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Dashboard
              </Link>
            </li>
            {user?.role !== 'visitor' && (
              <>
                <li>
                  <Link 
                    to="/sites" 
                    className={`nav-link ${isActive('/sites') ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    Sites
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/maintenance" 
                    className={`nav-link ${isActive('/maintenance') ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    Maintenance
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/inventory" 
                    className={`nav-link ${isActive('/inventory') ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    Inventory
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/requisitions" 
                    className={`nav-link ${isActive('/requisitions') ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    Requisitions
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/production-reports" 
                    className={`nav-link ${isActive('/production-reports') ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    Reports
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/analytics" 
                    className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    Analytics
                  </Link>
                </li>
              </>
            )}
            {(user?.role === 'administrator' || user?.role === 'manager') && (
              <li>
                <Link 
                  to="/users" 
                  className={`nav-link ${isActive('/users') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Users
                </Link>
              </li>
            )}
            
            {/* Mobile-only menu items */}
            {user && (
              <>
                <li className="mobile-menu-divider"></li>
                <li className="mobile-only">
                  <Link 
                    to="/profile" 
                    className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    <span>👤</span> My Profile
                  </Link>
                </li>
                <li className="mobile-only">
                  <button 
                    className="nav-link mobile-logout-btn" 
                    onClick={() => {
                      handleLogout();
                      closeMobileMenu();
                    }}
                  >
                    <span>🚪</span> Logout
                  </button>
                </li>
              </>
            )}
          </ul>
          
          {/* Right side actions */}
          <div className="navbar-actions">
            {/* Global Search */}
            {user && <GlobalSearch />}
            
            {/* Notifications and User menu */}
            {user ? (
              <>
                <NotificationCenter />
                <div className="user-dropdown">
                  <button 
                    className="user-menu-btn" 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <div className="user-avatar">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        <span>{getInitials(user.name)}</span>
                      )}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-role">{user.role}</span>
                    </div>
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="user-menu">
                      <Link to="/profile" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                        <span>👤</span> My Profile
                      </Link>
                      <Link to="/profile" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                        <span>⚙️</span> Settings
                      </Link>
                      <div className="user-menu-divider"></div>
                      <button onClick={handleLogout} className="user-menu-item logout-item">
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`}>
                  Login
                </Link>
                <Link to="/signup" className={`nav-link ${isActive('/signup') ? 'active' : ''}`}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      
      {/* Breadcrumbs navigation */}
      {user && <Breadcrumbs />}
      
      <main className="main-content">
        {children}
      </main>
      
      {/* Footer with company info */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-center">
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
        </div>
      </footer>
      
      {/* Mobile menu overlay */}
      {showMobileMenu && (
        <div 
          className="mobile-menu-overlay" 
          onClick={() => setShowMobileMenu(false)}
        />
      )}
    </div>
  );
}

export default Layout;