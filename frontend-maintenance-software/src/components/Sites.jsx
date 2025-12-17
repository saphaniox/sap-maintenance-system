import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import siteService from '../services/site.service';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import '../styles/pages/Sites.css';

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { hasPermission } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'waste_management',
    status: 'active',
    location: {
      address: '',
      city: '',
      region: '',
      country: 'Uganda'
    },
    contactPerson: {
      name: '',
      phone: '',
      email: ''
    },
    operatingHours: {
      start: '08:00',
      end: '17:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    description: '',
    capacity: '',
    notes: ''
  });

  useEffect(() => {
    fetchSites();
  }, [filterStatus, filterType]);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterType) filters.type = filterType;
      
      const data = await siteService.getAllSites(filters);
      setSites(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch sites');
      addToast('Failed to fetch sites', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('Submitting site data:', formData);
      
      if (editingSite) {
        const result = await siteService.updateSite(editingSite._id, formData);
        console.log('Site updated:', result);
        addToast('Site updated successfully', 'success');
      } else {
        const result = await siteService.createSite(formData);
        console.log('Site created:', result);
        addToast('Site created successfully', 'success');
      }
      
      setShowModal(false);
      resetForm();
      fetchSites();
    } catch (err) {
      console.error('Error saving site:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message || 'Failed to save site';
      addToast(errorMsg, 'error');
    }
  };

  const handleEdit = (site) => {
    setEditingSite(site);
    setFormData({
      name: site.name || '',
      code: site.code || '',
      type: site.type || 'waste_management',
      status: site.status || 'active',
      location: {
        address: site.location?.address || '',
        city: site.location?.city || '',
        region: site.location?.region || '',
        country: site.location?.country || 'Uganda'
      },
      contactPerson: {
        name: site.contactPerson?.name || '',
        phone: site.contactPerson?.phone || '',
        email: site.contactPerson?.email || ''
      },
      operatingHours: {
        start: site.operatingHours?.start || '08:00',
        end: site.operatingHours?.end || '17:00',
        workingDays: site.operatingHours?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      description: site.description || '',
      capacity: site.capacity || '',
      notes: site.notes || ''
    });
    setShowModal(true);
  };

  const handleDeleteClick = (site) => {
    setSiteToDelete(site);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await siteService.deleteSite(siteToDelete._id);
      addToast('Site deleted successfully', 'success');
      setShowDeleteConfirm(false);
      setSiteToDelete(null);
      fetchSites();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete site', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'waste_management',
      status: 'active',
      location: {
        address: '',
        city: '',
        region: '',
        country: 'Uganda'
      },
      contactPerson: {
        name: '',
        phone: '',
        email: ''
      },
      operatingHours: {
        start: '08:00',
        end: '17:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      description: '',
      capacity: '',
      notes: ''
    });
    setEditingSite(null);
  };

  const handleViewDetails = (siteId) => {
    navigate(`/sites/${siteId}`);
  };

  const filteredSites = sites.filter(site => {
    const searchLower = searchTerm.toLowerCase();
    return (
      site.name.toLowerCase().includes(searchLower) ||
      site.code.toLowerCase().includes(searchLower) ||
      site.location?.city?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'status-badge-active';
      case 'inactive': return 'status-badge-inactive';
      case 'maintenance': return 'status-badge-maintenance';
      case 'closed': return 'status-badge-closed';
      default: return '';
    }
  };

  if (loading) {
    return <div className="loading">Loading sites...</div>;
  }

  return (
    <div className="sites-container">
      <div className="sites-header">
        <h1>Sites & Facilities</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Add Site
        </button>
      </div>

      <div className="sites-filters">
        <input
          type="text"
          placeholder="Search sites..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
          <option value="closed">Closed</option>
        </select>

        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="waste_management">Waste Management</option>
          <option value="water_treatment">Water Treatment</option>
          <option value="industrial">Industrial</option>
          <option value="warehouse">Warehouse</option>
          <option value="office">Office</option>
          <option value="other">Other</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="sites-grid">
        {filteredSites.map((site) => (
          <div key={site._id} className="site-card">
            <div className="site-card-header">
              <div>
                <h3>{site.name}</h3>
                <span className="site-code">{site.code}</span>
              </div>
              <span className={`status-badge ${getStatusBadgeClass(site.status)}`}>
                {site.status}
              </span>
            </div>

            <div className="site-card-body">
              <div className="site-info">
                <div className="info-row">
                  <span className="info-label">📍 Location:</span>
                  <span>{site.location?.city || 'N/A'}, {site.location?.region || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">🏭 Type:</span>
                  <span>{site.type?.replace('_', ' ')}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">🔧 Machines:</span>
                  <span>{site.totalMachines || 0} total, {site.activeMachines || 0} active</span>
                </div>
                {site.contactPerson?.name && (
                  <div className="info-row">
                    <span className="info-label">👤 Contact:</span>
                    <span>{site.contactPerson.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="site-card-actions">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleViewDetails(site._id)}
              >
                View Details
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => handleEdit(site)}
              >
                Edit
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleDeleteClick(site)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSites.length === 0 && (
        <div className="no-data">
          <p>No sites found. Click "Add Site" to create one.</p>
        </div>
      )}

      <Modal
        isOpen={showModal}
        title={editingSite ? 'Edit Site' : 'Add New Site'}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        size="large"
      >
          <form onSubmit={handleSubmit} className="site-form">
            <div className="form-section">
              <h4>Basic Information</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Site Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Site Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., TWSA-TNG"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="waste_management">Waste Management</option>
                    <option value="water_treatment">Water Treatment</option>
                    <option value="industrial">Industrial</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="office">Office</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Location</h4>
              
              <div className="form-group">
                <label>Address (Optional)</label>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, address: e.target.value }
                  })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City (Optional)</label>
                  <input
                    type="text"
                    value={formData.location.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, city: e.target.value }
                    })}
                  />
                </div>

                <div className="form-group">
                  <label>Region (Optional)</label>
                  <input
                    type="text"
                    value={formData.location.region}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, region: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Contact Person</h4>
              
              <div className="form-group">
                <label>Name (Optional)</label>
                <input
                  type="text"
                  value={formData.contactPerson.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    contactPerson: { ...formData.contactPerson, name: e.target.value }
                  })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone (Optional)</label>
                  <input
                    type="tel"
                    value={formData.contactPerson.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactPerson: { ...formData.contactPerson, phone: e.target.value }
                    })}
                  />
                </div>

                <div className="form-group">
                  <label>Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.contactPerson.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactPerson: { ...formData.contactPerson, email: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Additional Information</h4>
              
              <div className="form-group">
                <label>Capacity (Optional)</label>
                <input
                  type="text"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="e.g., 10 tonnes per day"
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the site"
                />
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or remarks"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingSite ? 'Update Site' : 'Create Site'}
              </button>
            </div>
          </form>
        </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSiteToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Site"
        message={`Are you sure you want to delete "${siteToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Sites;
