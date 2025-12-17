import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';

function Machines() {
  const { user, isAdmin, isManagerOrAdmin } = useAuth();
  const [machines, setMachines] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSite, setFilterSite] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    type: 'other',
    site: '',
    model: '',
    serialNumber: '',
    location: '',
    department: '',
    status: 'operational',
    maintenanceInterval: 30,
    manufacturer: '',
  });

  const [sites, setSites] = useState([]);

  useEffect(() => {
    fetchMachines();
    fetchSites();
  }, []);

  useEffect(() => {
    filterMachines();
  }, [machines, searchQuery, filterSite, filterStatus]);

  const fetchMachines = async () => {
    try {
      const response = await api.get('/api/machines');
      setMachines(response.data);
    } catch (error) {
      console.error('Error fetching machines:', error);
      alert('Failed to load machines');
    }
  };

  const fetchSites = async () => {
    try {
      const response = await api.get('/api/sites');
      setSites(response.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const filterMachines = () => {
    let filtered = [...machines];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(machine => 
        machine.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        machine.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        machine.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        machine.site?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        machine.site?.code?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by site
    if (filterSite !== 'all') {
      filtered = filtered.filter(machine => machine.site?._id === filterSite);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(machine => machine.status === filterStatus);
    }

    setFilteredMachines(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMachine) {
        await api.put(`/api/machines/${editingMachine._id}`, formData);
        alert('Machine updated successfully');
      } else {
        await api.post('/api/machines', formData);
        alert('Machine created successfully');
      }
      resetForm();
      fetchMachines();
    } catch (error) {
      console.error('Error saving machine:', error);
      alert(error.response?.data?.message || 'Failed to save machine');
    }
  };

  const handleEdit = (machine) => {
    if (!isManagerOrAdmin()) {
      alert('Only managers and administrators can edit machines');
      return;
    }
    setEditingMachine(machine);
    setFormData({
      name: machine.name || '',
      type: machine.type || 'other',
      site: machine.site?._id || machine.site || '',
      model: machine.model || '',
      serialNumber: machine.serialNumber || '',
      location: machine.location || '',
      department: machine.department || '',
      status: machine.status || 'operational',
      maintenanceInterval: machine.maintenanceInterval || 30,
      manufacturer: machine.manufacturer || '',
    });
    setShowForm(true);
  };

  const handleDelete = (machine) => {
    if (!isAdmin()) {
      alert('Only administrators can delete machines');
      return;
    }
    setDeleteConfirm(machine);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/machines/${deleteConfirm._id}`);
      alert('Machine deleted successfully');
      setDeleteConfirm(null);
      fetchMachines();
    } catch (error) {
      console.error('Error deleting machine:', error);
      alert(error.response?.data?.message || 'Failed to delete machine');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'other',
      site: '',
      model: '',
      serialNumber: '',
      location: '',
      department: '',
      status: 'operational',
      maintenanceInterval: 30,
      manufacturer: '',
    });
    setEditingMachine(null);
    setShowForm(false);
  };

  const handleAdd = () => {
    if (!isManagerOrAdmin()) {
      alert('Only managers and administrators can add machines');
      return;
    }
    resetForm();
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      operational: 'badge badge-success',
      running: 'badge badge-info',
      under_maintenance: 'badge badge-warning',
      out_of_service: 'badge badge-danger',
    };
    return statusMap[status] || 'badge badge-secondary';
  };

  const formatMachineType = (type) => {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A';
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h1>Machines Management</h1>
          {isManagerOrAdmin() && (
            <button 
              className="btn btn-primary"
              onClick={handleAdd}
            >
              Add Machine
            </button>
          )}
        </div>

        {/* Search and Filter Section */}
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search machines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="col-4">
              <select
                className="form-control"
                value={filterSite}
                onChange={(e) => setFilterSite(e.target.value)}
              >
                <option value="all">All Sites</option>
                {sites.map(site => (
                  <option key={site._id} value={site._id}>
                    {site.name} ({site.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-4">
              <select
                className="form-control"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="operational">Operational</option>
                <option value="running">Running</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="out_of_service">Out of Service</option>
              </select>
            </div>
          </div>

          <div className="text-muted mb-2">
            Showing {filteredMachines.length} of {machines.length} machines
          </div>
        </div>
      </div>

      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingMachine ? 'Edit Machine' : 'Add New Machine'}
      >
        <form onSubmit={handleSubmit}>
            {/* Basic Information Section */}
            <div className="form-section">
              <h4>Basic Information</h4>
              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Machine Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Composter Unit 1"
                      required
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Machine Type *</label>
                    <select
                      name="type"
                      className="form-control"
                      value={formData.type}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="composter_5_tonne">5 Tonne Composter</option>
                      <option value="composter_3_tonne">3 Tonne Composter</option>
                      <option value="composter_1_tonne">1 Tonne Composter</option>
                      <option value="shredder">Shredder</option>
                      <option value="baler">Baler</option>
                      <option value="scissor_lift">Scissor Lift</option>
                      <option value="weighing_scale">Weighing Scale</option>
                      <option value="trolley">Trolley</option>
                      <option value="pallet_jack">Pallet Jack</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Site Location *</label>
                    <select
                      name="site"
                      className="form-control"
                      value={formData.site}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Site</option>
                      {sites.map(site => (
                        <option key={site._id} value={site._id}>
                          {site.name} ({site.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Status *</label>
                    <select
                      name="status"
                      className="form-control"
                      value={formData.status}
                      onChange={handleChange}
                      required
                    >
                      <option value="operational">Operational</option>
                      <option value="running">Running</option>
                      <option value="under_maintenance">Under Maintenance</option>
                      <option value="out_of_service">Out of Service</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Machine Details Section */}
            <div className="form-section">
              <h4>Machine Details (Optional)</h4>
              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Model Number</label>
                    <input
                      type="text"
                      name="model"
                      className="form-control"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="e.g., XYZ-2000"
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Serial Number</label>
                    <input
                      type="text"
                      name="serialNumber"
                      className="form-control"
                      value={formData.serialNumber}
                      onChange={handleChange}
                      placeholder="e.g., SN-123456"
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Manufacturer</label>
                    <input
                      type="text"
                      name="manufacturer"
                      className="form-control"
                      value={formData.manufacturer}
                      onChange={handleChange}
                      placeholder="e.g., ABC Manufacturing"
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Specific Location</label>
                    <input
                      type="text"
                      name="location"
                      className="form-control"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Building A, Floor 2"
                    />
                    <small className="form-text text-muted">Location within the site</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Details Section */}
            <div className="form-section">
              <h4>Operational Details (Optional)</h4>
              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      name="department"
                      className="form-control"
                      value={formData.department}
                      onChange={handleChange}
                    >
                      <option value="">Select Department</option>
                      <option value="Production">Production</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Operations">Operations</option>
                      <option value="Quality Control">Quality Control</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Waste Management">Waste Management</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Maintenance Interval (Days)</label>
                    <input
                      type="number"
                      name="maintenanceInterval"
                      className="form-control"
                      value={formData.maintenanceInterval}
                      onChange={handleChange}
                      min="1"
                      placeholder="30"
                    />
                    <small className="form-text text-muted">How often to perform maintenance</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingMachine ? 'Update Machine' : 'Create Machine'}
              </button>
            </div>
        </form>
      </Modal>

      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Site</th>
                <th>Model</th>
                <th>Serial Number</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMachines.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted">
                    No machines found
                  </td>
                </tr>
              ) : (
                filteredMachines.map((machine) => (
                  <tr key={machine._id}>
                    <td>
                      <strong>{machine.name}</strong>
                      {machine.department && (
                        <><br /><small className="text-muted">{machine.department}</small></>
                      )}
                    </td>
                    <td>{formatMachineType(machine.type)}</td>
                    <td>
                      {machine.site ? (
                        <>
                          <strong>{machine.site.name}</strong>
                          <br />
                          <small className="text-muted">{machine.site.code}</small>
                        </>
                      ) : (
                        <span className="text-muted">No site</span>
                      )}
                    </td>
                    <td>{machine.model || '-'}</td>
                    <td>{machine.serialNumber || '-'}</td>
                    <td>{machine.location || '-'}</td>
                    <td>
                      <span className={getStatusBadge(machine.status)}>
                        {machine.status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>
                      {isManagerOrAdmin() && (
                        <>
                          <button 
                            className="btn btn-sm btn-warning"
                            onClick={() => handleEdit(machine)}
                            title="Edit machine"
                          >
                            Edit
                          </button>
                          {isAdmin() && (
                            <button 
                              className="btn btn-sm btn-danger ml-1"
                              onClick={() => handleDelete(machine)}
                              title="Delete machine"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Machine"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

export default Machines;
