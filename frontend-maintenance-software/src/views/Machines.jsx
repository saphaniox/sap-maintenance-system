// Machines View - Professional MVC implementation with advanced features
import React, { useState, useEffect } from 'react';
import MachineService from '../services/machine.service';
import siteService from '../services/site.service';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { PaginationControls, getPaginatedDataLocal } from '../utils/pagination';
import { SkeletonTable } from '../components/LoadingSkeleton';
import { InfoTooltip } from '../components/Tooltip';
import LazyImage from '../components/LazyImage';
import { downloadCSV, downloadJSON, printData } from '../utils/exportUtils';
import '../styles/pages/Machines.css';

const Machines = () => {
  const [machines, setMachines] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortKey, setSortKey] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const toast = useToast();

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    installedDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchMachines();
    fetchSites();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const data = await MachineService.getAll();
      setMachines(data);
    } catch (error) {
      toast.error(error.message || 'Failed to load machines');
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const data = await siteService.getAll();
      setSites(data);
    } catch (error) {
      console.error('Failed to load sites:', error);
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
      installedDate: '',
      notes: '',
    });
    setEditingMachine(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (machine) => {
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
      installedDate: machine.installedDate ? machine.installedDate.split('T')[0] : '',
      notes: machine.notes || '',
    });
    setEditingMachine(machine);
    setShowForm(true);
  };

  const handleDelete = (machine) => {
    setDeleteConfirm(machine);
  };

  const confirmDelete = async () => {
    try {
      await MachineService.delete(deleteConfirm._id);
      toast.success('Machine deleted successfully');
      fetchMachines();
    } catch (error) {
      toast.error(error.message || 'Failed to delete machine');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('Submitting machine data:', formData);
      
      if (editingMachine) {
        await MachineService.update(editingMachine._id, formData);
        toast.success('Machine updated successfully');
      } else {
        await MachineService.create(formData);
        toast.success('Machine created successfully');
      }
      
      setShowForm(false);
      resetForm();
      fetchMachines();
    } catch (error) {
      console.error('Error saving machine:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save machine';
      toast.error(errorMessage);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      operational: 'badge-operational',
      under_maintenance: 'badge-under_maintenance',
      out_of_service: 'badge-out_of_service',
    };
    return `badge ${statusMap[status] || ''}`;
  };

  const getStatusLabel = (status) => {
    return status ? status.replace(/_/g, ' ').toUpperCase() : '';
  };

  // Sorting handler
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Export functions
  const exportColumns = [
    { key: 'name', label: 'Name' },
    { key: 'model', label: 'Model' },
    { key: 'serialNumber', label: 'Serial Number' },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'location', label: 'Location' },
    { key: 'department', label: 'Department' },
    { key: 'status', label: 'Status' },
    { key: 'maintenanceInterval', label: 'Maintenance Interval' },
    { key: 'installedDate', label: 'Installed Date', type: 'date' },
  ];

  const handleExportCSV = () => {
    downloadCSV(sortedMachines, exportColumns, 'machines');
    toast.success('Machines exported to CSV');
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    downloadJSON(sortedMachines, 'machines');
    toast.success('Machines exported to JSON');
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    printData(sortedMachines, exportColumns, 'Machines List');
    setShowExportMenu(false);
  };

  // Filter, sort, and paginate logic
  const filteredMachines = machines.filter(machine => {
    const matchesSearch = !searchQuery || 
      machine.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || machine.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Sort the filtered machines by selected column in chosen direction
  const sortedMachines = [...filteredMachines].sort((machineA, machineB) => {
    // Extract values from machines using the sort key
    const machineAValue = machineA[sortKey] || '';
    const machineBValue = machineB[sortKey] || '';
    
    // Compare values alphabetically/numerically
    if (sortDirection === 'asc') {
      // Ascending: A comes before Z
      return machineAValue.toString().localeCompare(machineBValue.toString());
    } else {
      // Descending: Z comes before A
      return machineBValue.toString().localeCompare(machineAValue.toString());
    }
  });

  // Get paginated data using the hook
  // Get paginated data from client-side helper
  const paginatedData = getPaginatedDataLocal(sortedMachines, currentPage, pageSize);

  const modalFooter = (
    <>
      <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
        Cancel
      </button>
      <button type="submit" form="machine-form" className="btn btn-primary">
        {editingMachine ? 'Update Machine' : 'Create Machine'}
      </button>
    </>
  );

  return (
    <div className="machines-page">
      <div className="card">
        <div className="card-header">
          <h1>Machines</h1>
          <div className="header-actions">
            <div className="export-dropdown">
              <button 
                className="btn btn-outline-primary"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                📥 Export
              </button>
              {showExportMenu && (
                <div className="export-menu">
                  <button onClick={handleExportCSV}>Export as CSV</button>
                  <button onClick={handleExportJSON}>Export as JSON</button>
                  <button onClick={handlePrint}>Print</button>
                </div>
              )}
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>
              + Add Machine
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Search and Filter */}
          <div className="machines-filters">
            <div className="search-box">
              <input
                type="text"
                className="form-control"
                placeholder="Search machines..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <select
              className="form-control"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="operational">Operational</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="out_of_service">Out of Service</option>
            </select>
            <select
              className="form-control"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="loading">
              <SkeletonTable rows={5} columns={8} />
            </div>
          ) : filteredMachines.length === 0 ? (
            <div className="empty-state">
              <p>No machines found</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-sortable">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('name')} className="sortable">
                        Name {sortKey === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Image</th>
                      <th onClick={() => handleSort('model')} className="sortable">
                        Model {sortKey === 'model' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('serialNumber')} className="sortable">
                        Serial Number {sortKey === 'serialNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('location')} className="sortable">
                        Location {sortKey === 'location' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('department')} className="sortable">
                        Department {sortKey === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('status')} className="sortable">
                        Status {sortKey === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.data.map((machine) => (
                      <tr key={machine._id}>
                        <td><strong>{machine.name}</strong></td>
                        <td>
                          {machine.image ? (
                            <LazyImage src={machine.image} alt={machine.name} className="machine-thumb" />
                          ) : (
                            <div className="machine-thumb-placeholder">—</div>
                          )}
                        </td>
                        <td>{machine.model || '-'}</td>
                        <td>{machine.serialNumber || '-'}</td>
                        <td>{machine.location || '-'}</td>
                        <td>{machine.department || '-'}</td>
                        <td>
                          <InfoTooltip text={`Status meaning: ${getStatusLabel(machine.status)}`}>
                            <span className={getStatusBadgeClass(machine.status)}>
                              {getStatusLabel(machine.status)}
                            </span>
                          </InfoTooltip>
                        </td>
                        <td>
                          <InfoTooltip text="Edit this machine to change details, schedule maintenance, or update inventory references">
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleEdit(machine)}
                            >
                              Edit
                            </button>
                          </InfoTooltip>
                          <InfoTooltip text="Delete will mark this machine as inactive. This action cannot be undone.">
                            <button
                              className="btn btn-sm btn-danger ml-1"
                              onClick={() => handleDelete(machine)}
                            >
                              Delete
                            </button>
                          </InfoTooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {/* Build pagination object for the controls */}
              {(() => {
                const paginationObj = {
                  currentPage,
                  pageSize,
                  totalItems: paginatedData.totalItems,
                  totalPages: paginatedData.totalPages,
                  hasNextPage: currentPage < paginatedData.totalPages,
                  hasPrevPage: currentPage > 1
                };

                return (
                  <PaginationControls
                    pagination={paginationObj}
                    onPageChange={(page) => setCurrentPage(page)}
                    onPageSizeChange={(size) => setPageSize(size)}
                  />
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingMachine ? 'Edit Machine' : 'Add New Machine'}
        footer={modalFooter}
        size="large"
      >
        <form id="machine-form" onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label required">Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label required">Site</label>
                <select
                  name="site"
                  className="form-control"
                  value={formData.site}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a site</option>
                  {sites.map((site) => (
                    <option key={site._id} value={site._id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label required">Machine Type</label>
                <select
                  name="type"
                  className="form-control"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="composter_5_tonne">Composter 5 Tonne</option>
                  <option value="composter_3_tonne">Composter 3 Tonne</option>
                  <option value="composter_1_tonne">Composter 1 Tonne</option>
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
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Model</label>
                <input
                  type="text"
                  name="model"
                  className="form-control"
                  value={formData.model}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input
                  type="text"
                  name="serialNumber"
                  className="form-control"
                  value={formData.serialNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Manufacturer</label>
                <input
                  type="text"
                  name="manufacturer"
                  className="form-control"
                  value={formData.manufacturer}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  name="location"
                  className="form-control"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  name="department"
                  className="form-control"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label required">Status</label>
                <select
                  name="status"
                  className="form-control"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="operational">Operational</option>
                  <option value="under_maintenance">Under Maintenance</option>
                  <option value="out_of_service">Out of Service</option>
                </select>
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Maintenance Interval (days)</label>
                <input
                  type="number"
                  name="maintenanceInterval"
                  className="form-control"
                  value={formData.maintenanceInterval}
                  onChange={handleChange}
                  min="1"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Installed Date</label>
            <input
              type="date"
              name="installedDate"
              className="form-control"
              value={formData.installedDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              className="form-control"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Machine"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Machines;
