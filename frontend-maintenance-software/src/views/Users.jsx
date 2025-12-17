import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import UserService from '../services/user.service';
import SiteService from '../services/site.service';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import '../styles/pages/Users.css';

// User management page - admins can view and manage all users here
const Users = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const toast = useToast();
  
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: '',
    isActive: '',
    search: '',
  });
  
  // State for modals and user selection
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSitesModal, setShowSitesModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedSites, setSelectedSites] = useState([]);
  
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    department: '',
    phone: '',
    role: '',
  });

  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchSites();
  }, [filters]);

  const fetchSites = async () => {
    try {
      const data = await SiteService.getAll();
      setSites(data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('[Users] Fetching users with filters:', filters);
      const data = await UserService.getAll(filters);
      console.log('[Users] Received data:', data);
      console.log('[Users] Data type:', typeof data, 'Is array:', Array.isArray(data));
      console.log('[Users] Data length:', data?.length);
      
      if (Array.isArray(data)) {
        setUsers(data);
        console.log(`[Users] Set ${data.length} users in state`);
      } else {
        console.error('[Users] Data is not an array:', data);
        setUsers([]);
      }
    } catch (error) {
      console.error('[Users] Error fetching users:', error);
      console.error('[Users] Error response:', error.response);
      console.error('[Users] Error status:', error.response?.status);
      console.error('[Users] Error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load users';
      toast.error(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await UserService.getStats();
      console.log('Fetched user stats:', data);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Stats error details:', errorMessage);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await UserService.updateRole(userId, newRole);
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await UserService.updateStatus(userId, !currentStatus);
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      department: user.department || '',
      phone: user.phone || '',
      role: user.role,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await UserService.update(selectedUser._id, editForm);
      toast.success('User updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const handleSitesClick = (user) => {
    setSelectedUser(user);
    setSelectedSites(user.assignedSites?.map(site => site._id) || []);
    setShowSitesModal(true);
  };

  const handleUpdateSites = async () => {
    try {
      await UserService.updateSites(selectedUser._id, selectedSites);
      toast.success('User sites updated successfully');
      setShowSitesModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update sites');
    }
  };

  const toggleSite = (siteId) => {
    setSelectedSites(prev => 
      prev.includes(siteId) 
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  const handleDeleteConfirm = async () => {
    try {
      await UserService.delete(userToDelete._id);
      toast.success('User deleted successfully');
      setShowDeleteDialog(false);
      setUserToDelete(null);
      fetchUsers();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const getRoleBadgeClass = (role) => {
    const roleClasses = {
      visitor: 'badge-visitor',
      administrator: 'badge-admin',
      manager: 'badge-manager',
      supervisor: 'badge-supervisor',
      operator: 'badge-operator',
    };
    return roleClasses[role] || 'badge-default';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!hasPermission('read:users')) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage user roles and permissions</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-details">
              <p className="stat-label">Total Users</p>
              <p className="stat-value">{stats.totalUsers}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-details">
              <p className="stat-label">Active Users</p>
              <p className="stat-value">{stats.activeUsers}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⛔</div>
            <div className="stat-details">
              <p className="stat-label">Inactive Users</p>
              <p className="stat-value">{stats.inactiveUsers}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👑</div>
            <div className="stat-details">
              <p className="stat-label">Administrators</p>
              <p className="stat-value">
                {stats.usersByRole.find(r => r._id === 'administrator')?.count || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="visitor">Visitor (Pending)</option>
            <option value="administrator">Administrator</option>
            <option value="manager">Manager</option>
            <option value="supervisor">Supervisor</option>
            <option value="operator">Operator</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSkeleton count={5} />
      ) : users.length === 0 ? (
        <div className="empty-state">
          <p>No users found</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Assigned Sites</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.avatar ? (
                          <img src={`/api/uploads/avatars/${user.avatar}`} alt={user.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="user-name">{user.name}</div>
                        {user._id === currentUser.id && (
                          <span className="you-badge">You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.department || '-'}</td>
                  <td>
                    {currentUser.role === 'administrator' && user._id !== currentUser.id ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className={`role-select ${getRoleBadgeClass(user.role)}`}
                      >
                        <option value="visitor">Visitor</option>
                        <option value="operator">Operator</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="manager">Manager</option>
                        <option value="administrator">Administrator</option>
                      </select>
                    ) : (
                      <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td>
                    {(user.role === 'operator' || user.role === 'supervisor') && (
                      <div className="sites-cell">
                        {user.assignedSites && user.assignedSites.length > 0 ? (
                          <div className="sites-list">
                            {user.assignedSites.map(site => (
                              <span key={site._id} className="site-badge">{site.name}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="no-sites">No sites assigned</span>
                        )}
                        {currentUser.role === 'administrator' && (
                          <button
                            onClick={() => handleSitesClick(user)}
                            className="btn-icon btn-sm"
                            title="Assign sites"
                          >
                            🏢
                          </button>
                        )}
                      </div>
                    )}
                    {(user.role === 'manager' || user.role === 'administrator') && (
                      <span className="all-sites-badge">All Sites</span>
                    )}
                    {user.role === 'visitor' && (
                      <span className="no-access-badge">No Access</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      {currentUser.role === 'administrator' && user._id !== currentUser.id && (
                        <>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="btn-icon"
                            title="Edit user"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleStatusToggle(user._id, user.isActive)}
                            className="btn-icon"
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {user.isActive ? '🔒' : '🔓'}
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="btn-icon btn-danger"
                            title="Delete user"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit User"
        >
          <form onSubmit={handleUpdateUser} className="edit-user-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Update User
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete User"
          message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
          confirmText="Delete"
          confirmButtonClass="btn-danger"
        />
      )}

      {/* Assign Sites Modal */}
      {showSitesModal && (
        <Modal
          isOpen={showSitesModal}
          onClose={() => setShowSitesModal(false)}
          title={`Assign Sites to ${selectedUser?.name}`}
        >
          <div className="sites-modal-content">
            <p className="modal-description">
              Select which sites this user can access. They will only see data (machines, maintenance, inventory, etc.) from their assigned sites.
            </p>
            
            <div className="sites-checklist">
              {sites.length === 0 ? (
                <p className="no-sites-message">No sites available. Create a site first.</p>
              ) : (
                sites.map(site => (
                  <label key={site._id} className="site-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedSites.includes(site._id)}
                      onChange={() => toggleSite(site._id)}
                    />
                    <div className="site-info">
                      <span className="site-name">{site.name}</span>
                      <span className="site-code">{site.code}</span>
                      {site.type && <span className="site-type">{site.type}</span>}
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="selected-count">
              {selectedSites.length} site{selectedSites.length !== 1 ? 's' : ''} selected
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowSitesModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateSites}
                className="btn-primary"
                disabled={sites.length === 0}
              >
                Update Sites
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Users;
