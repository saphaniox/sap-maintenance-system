import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import authService from '../services/auth.service';
import '../styles/pages/Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    bio: ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    language: 'en',
    timezone: 'UTC'
  });

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        bio: user.bio || ''
      });
      setAvatarPreview(user.avatar || null);
      
      // Load settings from localStorage
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      }
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setSettings(prev => {
      const newSettings = { ...prev, [name]: newValue };
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
      
      return newSettings;
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image size should be less than 2MB', 'error');
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData();
      Object.keys(profileData).forEach(key => {
        formData.append(key, profileData[key]);
      });
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await authService.updateProfile(formData);
      updateUser(response);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      showToast('Password changed successfully', 'success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = passwordData.newPassword;
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['', '#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997'];
    
    return {
      strength: (strength / 5) * 100,
      label: labels[strength],
      color: colors[strength]
    };
  };

  const passwordStrength = getPasswordStrength();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>👤 My Profile</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="profile-container">
        {/* Sidebar with Avatar */}
        <div className="profile-sidebar">
          <div className="profile-avatar-section">
            <div className="avatar-wrapper">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {getInitials(user?.name)}
                </div>
              )}
              <label htmlFor="avatar-upload" className="avatar-upload-btn" title="Change profile picture">
                📷
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
            <h3>{user?.name}</h3>
            <p className="profile-email">{user?.email}</p>
            <span className="profile-role">{user?.role}</span>
          </div>

          <nav className="profile-nav">
            <button
              className={`profile-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="nav-icon">👤</span>
              Profile Information
            </button>
            <button
              className={`profile-nav-item ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <span className="nav-icon">🔒</span>
              Change Password
            </button>
            <button
              className={`profile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <span className="nav-icon">⚙️</span>
              Settings & Preferences
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="profile-content">
          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="section-header">
                <h2>Profile Information</h2>
                <p>Update your personal information and contact details</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      placeholder="+256 XXX XXX XXX"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      name="department"
                      className="form-control"
                      value={profileData.department}
                      onChange={handleProfileChange}
                    >
                      <option value="">Select Department</option>
                      <option value="operations">Operations</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="engineering">Engineering</option>
                      <option value="management">Management</option>
                      <option value="admin">Administration</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea
                    name="bio"
                    className="form-control"
                    rows="4"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    placeholder="Tell us a bit about yourself..."
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <div className="profile-section">
              <div className="section-header">
                <h2>Change Password</h2>
                <p>Ensure your account is using a strong password</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="profile-form">
                <div className="form-group">
                  <label className="form-label required">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    className="form-control"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    className="form-control"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  {passwordData.newPassword && (
                    <div className="password-strength">
                      <div className="password-strength-bar">
                        <div
                          className="password-strength-fill"
                          style={{
                            width: `${passwordStrength.strength}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        ></div>
                      </div>
                      <span style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label required">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-control"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  {passwordData.confirmPassword && (
                    <small className={
                      passwordData.newPassword === passwordData.confirmPassword
                        ? 'text-success'
                        : 'text-danger'
                    }>
                      {passwordData.newPassword === passwordData.confirmPassword
                        ? '✓ Passwords match'
                        : '✗ Passwords do not match'}
                    </small>
                  )}
                </div>

                <div className="password-requirements">
                  <h4>Password Requirements:</h4>
                  <ul>
                    <li className={passwordData.newPassword.length >= 6 ? 'met' : ''}>
                      At least 6 characters
                    </li>
                    <li className={/[a-z]/.test(passwordData.newPassword) && /[A-Z]/.test(passwordData.newPassword) ? 'met' : ''}>
                      Contains uppercase and lowercase letters
                    </li>
                    <li className={/\d/.test(passwordData.newPassword) ? 'met' : ''}>
                      Contains at least one number
                    </li>
                    <li className={/[^a-zA-Z0-9]/.test(passwordData.newPassword) ? 'met' : ''}>
                      Contains at least one special character
                    </li>
                  </ul>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="profile-section">
              <div className="section-header">
                <h2>Settings & Preferences</h2>
                <p>Customize your app experience</p>
              </div>

              <div className="settings-form">
                {/* Notifications */}
                <div className="settings-group">
                  <h3>🔔 Notifications</h3>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label className="setting-label">Email Notifications</label>
                      <p className="setting-description">Receive email updates about your account activity</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={settings.emailNotifications}
                        onChange={handleSettingsChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <label className="setting-label">Push Notifications</label>
                      <p className="setting-description">Get push notifications for important updates</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="pushNotifications"
                        checked={settings.pushNotifications}
                        onChange={handleSettingsChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {/* Localization */}
                <div className="settings-group">
                  <h3>🌍 Localization</h3>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label className="setting-label">Language</label>
                      <p className="setting-description">Select your preferred language</p>
                    </div>
                    <select
                      name="language"
                      className="form-control"
                      value={settings.language}
                      onChange={handleSettingsChange}
                      style={{ maxWidth: '200px' }}
                    >
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                      <option value="lg">Luganda</option>
                    </select>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <label className="setting-label">Timezone</label>
                      <p className="setting-description">Set your local timezone</p>
                    </div>
                    <select
                      name="timezone"
                      className="form-control"
                      value={settings.timezone}
                      onChange={handleSettingsChange}
                      style={{ maxWidth: '200px' }}
                    >
                      <option value="UTC">UTC</option>
                      <option value="Africa/Kampala">East Africa Time (EAT)</option>
                      <option value="Africa/Nairobi">East Africa Time (Nairobi)</option>
                    </select>
                  </div>
                </div>

                <div className="settings-info-box">
                  <p>💡 Settings are saved automatically and applied across all your devices.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
