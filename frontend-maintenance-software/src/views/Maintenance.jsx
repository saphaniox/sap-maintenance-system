// Maintenance View - Professional CRUD implementation
import React, { useState, useEffect } from 'react';
import MaintenanceService from '../services/maintenance.service';
import MachineService from '../services/machine.service';
import siteService from '../services/site.service';
import InventoryService from '../services/inventory.service';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { PaginationControls } from '../utils/pagination';
import { usePagination } from '../utils/pagination';
import { convertToCSV, downloadCSV, downloadJSON, printData } from '../utils/exportUtils';
import '../styles/pages/Maintenance.css';

const Maintenance = () => {
  const { hasPermission } = useAuth();
  const [activities, setActivities] = useState([]);
  const [machines, setMachines] = useState([]);
  const [sites, setSites] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  
  // Pagination & Sorting
  const [sortKey, setSortKey] = useState('title');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const toast = useToast();

  // Use the pagination hook
  const {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    getPaginatedData,
    totalPages,
    totalItems,
    startIndex,
    endIndex
  } = usePagination();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    machineId: '',
    site: '',
    location: '',
    status: 'pending',
    priority: 'medium',
    scheduledDate: '',
    dueDate: '',
    assignedTo: '',
    cost: '',
    notes: '',
    materialsUsed: [],
    isRecurring: false,
    recurrencePattern: 'weekly',
    recurrenceInterval: 1,
    recurrenceEndDate: '',
  });

  const [materialInput, setMaterialInput] = useState({
    inventoryItem: '',
    quantityUsed: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [activitiesData, machinesData, sitesData, inventoryData] = await Promise.all([
        MaintenanceService.getAll(),
        MachineService.getAll(),
        siteService.getAllSites(),
        InventoryService.getAll(),
      ]);
      setActivities(activitiesData);
      setMachines(machinesData);
      setSites(sitesData);
      setInventory(inventoryData);
    } catch (error) {
      toast.error(error.message || 'Failed to load maintenance activities');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      machineId: '',
      site: '',
      location: '',
      status: 'pending',
      priority: 'medium',
      scheduledDate: '',
      dueDate: '',
      assignedTo: '',
      cost: '',
      notes: '',
      materialsUsed: [],
      isRecurring: false,
      recurrencePattern: 'weekly',
      recurrenceInterval: 1,
      recurrenceEndDate: '',
    });
    setMaterialInput({ inventoryItem: '', quantityUsed: 0 });
    setEditingActivity(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (activity) => {
    setFormData({
      title: activity.title || '',
      description: activity.description || '',
      machineId: activity.machineId?._id || activity.machineId || '',
      site: activity.site?._id || activity.site || '',
      location: activity.location || '',
      status: activity.status || 'pending',
      priority: activity.priority || 'medium',
      scheduledDate: activity.scheduledDate ? activity.scheduledDate.split('T')[0] : '',
      dueDate: activity.dueDate ? activity.dueDate.split('T')[0] : '',
      assignedTo: activity.assignedTo || '',
      cost: activity.cost || '',
      notes: activity.notes || '',
      materialsUsed: activity.materialsUsed || [],
    });
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleDelete = (activity) => {
    setDeleteConfirm(activity);
  };

  const confirmDelete = async () => {
    try {
      await MaintenanceService.delete(deleteConfirm._id);
      toast.success('Maintenance activity deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete activity');
    }
  };

  const handleAddMaterial = () => {
    if (!materialInput.inventoryItem || materialInput.quantityUsed <= 0) {
      toast.error('Please select an item and enter a valid quantity');
      return;
    }

    const selectedItem = inventory.find(item => item._id === materialInput.inventoryItem);
    if (!selectedItem) return;

    if (selectedItem.currentStock < materialInput.quantityUsed) {
      toast.error(`Insufficient stock! Available: ${selectedItem.currentStock}`);
      return;
    }

    const material = {
      inventoryItem: materialInput.inventoryItem,
      quantityUsed: Number(materialInput.quantityUsed)
    };

    setFormData({
      ...formData,
      materialsUsed: [...formData.materialsUsed, material]
    });

    setMaterialInput({ inventoryItem: '', quantityUsed: 0 });
    toast.success('Material added to list');
  };

  const handleRemoveMaterial = (index) => {
    setFormData({
      ...formData,
      materialsUsed: formData.materialsUsed.filter((_, i) => i !== index)
    });
    toast.success('Material removed from list');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      if (editingActivity) {
        response = await MaintenanceService.update(editingActivity._id, formData);
        
        // Check for inventory deduction results
        if (response.inventoryDeducted && response.inventoryDeducted.length > 0) {
          const itemsDeducted = response.inventoryDeducted.map(item => 
            `${item.itemName} (${item.quantityDeducted} units)`
          ).join(', ');
          toast.success(`Inventory updated: ${itemsDeducted}`, 5000);
        }
        
        // Check for inventory errors
        if (response.inventoryErrors && response.inventoryErrors.length > 0) {
          response.inventoryErrors.forEach(error => toast.error(error, 5000));
        }
        
        // Check if next maintenance was scheduled
        if (response.nextMaintenanceScheduled) {
          const nextDate = new Date(response.nextMaintenanceDate).toLocaleDateString();
          toast.success(
            `Maintenance activity completed! Next maintenance scheduled for ${nextDate}`,
            5000
          );
        } else {
          toast.success('Maintenance activity updated successfully');
        }
      } else {
        await MaintenanceService.create(formData);
        toast.success('Maintenance activity created successfully');
      }
      
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to save activity');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'badge-pending',
      'in-progress': 'badge-in-progress',
      completed: 'badge-completed',
      cancelled: 'badge-danger',
    };
    return `badge ${statusMap[status] || ''}`;
  };

  const getPriorityBadgeClass = (priority) => {
    const priorityMap = {
      low: 'badge-info',
      medium: 'badge-warning',
      high: 'badge-danger',
      critical: 'badge-danger',
    };
    return `badge ${priorityMap[priority] || ''}`;
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchQuery || 
      activity.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || activity.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sort maintenance activities by selected column (supports nested fields like 'site.name')
  const sortedActivities = [...filteredActivities].sort((activityA, activityB) => {
    // Helper function to get nested object values (e.g., 'site.name' → activity.site.name)
    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((current, key) => current?.[key], obj) || '';
    };
    
    // Extract values from both activities using the sort path
    const activityAValue = getNestedValue(activityA, sortKey);
    const activityBValue = getNestedValue(activityB, sortKey);
    
    // Compare alphabetically/numerically
    if (sortDirection === 'asc') {
      return String(activityAValue).localeCompare(String(activityBValue));
    } else {
      return String(activityBValue).localeCompare(String(activityAValue));
    }
  });

  const paginationResult = getPaginatedData(sortedActivities);
  const paginatedActivities = Array.isArray(paginationResult?.data) 
    ? paginationResult.data 
    : Array.isArray(paginationResult) 
    ? paginationResult 
    : [];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterPriority]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (key) => {
    if (sortKey !== key) return ' ↕';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const handleExportCSV = () => {
    const exportData = filteredActivities.map(activity => ({
      Title: activity.title,
      Machine: activity.machineId?.name || '-',
      Site: activity.site?.name || '-',
      'Site Code': activity.site?.code || '-',
      Status: activity.status?.toUpperCase(),
      Priority: activity.priority?.toUpperCase(),
      'Assigned To': activity.assignedTo || '-',
      'Due Date': activity.dueDate ? new Date(activity.dueDate).toLocaleDateString() : '-',
      'Cost (UGX)': activity.cost || '-',
      Description: activity.description,
    }));
    const csv = convertToCSV(exportData);
    downloadCSV(csv, 'maintenance-activities.csv');
    setShowExportMenu(false);
    toast.success('Exported to CSV');
  };

  const handleExportJSON = () => {
    downloadJSON(filteredActivities, 'maintenance-activities.json');
    setShowExportMenu(false);
    toast.success('Exported to JSON');
  };

  const handlePrint = () => {
    const headers = ['Title', 'Machine', 'Site', 'Status', 'Priority', 'Assigned To', 'Due Date'];
    const rows = filteredActivities.map(activity => [
      activity.title,
      activity.machineId?.name || '-',
      activity.site?.name || '-',
      activity.status?.toUpperCase(),
      activity.priority?.toUpperCase(),
      activity.assignedTo || '-',
      activity.dueDate ? new Date(activity.dueDate).toLocaleDateString() : '-',
    ]);
    printData('Maintenance Activities', headers, rows);
    setShowExportMenu(false);
  };

  const modalFooter = (
    <>
      <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
        Cancel
      </button>
      <button type="submit" form="maintenance-form" className="btn btn-primary">
        {editingActivity ? 'Update Activity' : 'Create Activity'}
      </button>
    </>
  );

  return (
    <div className="maintenance-page">
      <div className="card">
        <div className="card-header">
          <h1>Maintenance Activities</h1>
          <div className="header-actions">
            <div className="export-dropdown">
              <button
                className="btn btn-secondary"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Export ▾
              </button>
              {showExportMenu && (
                <div className="export-menu">
                  <button onClick={handleExportCSV}>Download CSV</button>
                  <button onClick={handleExportJSON}>Download JSON</button>
                  <button onClick={handlePrint}>Print</button>
                </div>
              )}
            </div>
            {hasPermission('create:maintenance') && (
              <button className="btn btn-primary" onClick={handleAdd}>
                + Add Activity
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {/* Search and Filters */}
          <div className="maintenance-filters">
            <div className="search-box">
              <input
                type="text"
                className="form-control"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="form-control"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="form-control"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Loading/Empty State */}
          {loading ? (
            <div className="loading">
              <div className="spinner spinner-primary"></div>
              <p>Loading maintenance activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="empty-state">
              <p>No maintenance activities found</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => handleSort('title')}>
                        Title{getSortIcon('title')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('machineId.name')}>
                        Machine{getSortIcon('machineId.name')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('site.name')}>
                        Site{getSortIcon('site.name')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('status')}>
                        Status{getSortIcon('status')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('priority')}>
                        Priority{getSortIcon('priority')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('assignedTo')}>
                        Assigned To{getSortIcon('assignedTo')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('dueDate')}>
                        Due Date{getSortIcon('dueDate')}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedActivities.map((activity) => (
                    <tr key={activity._id}>
                      <td>
                        <strong>{activity.title}</strong>
                        <br />
                        <small className="text-muted">{activity.description}</small>
                      </td>
                      <td>{activity.machineId?.name || '-'}</td>
                      <td>
                        {activity.site ? (
                          <>
                            <strong>{activity.site.name}</strong>
                            <br />
                            <small className="text-muted">{activity.site.code}</small>
                          </>
                        ) : '-'}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(activity.status)}>
                          {activity.status?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={getPriorityBadgeClass(activity.priority)}>
                          {activity.priority?.toUpperCase()}
                        </span>
                      </td>
                      <td>{activity.assignedTo || '-'}</td>
                      <td>
                        {activity.dueDate 
                          ? new Date(activity.dueDate).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td>
                        {hasPermission('update:maintenance') && (
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => handleEdit(activity)}
                          >
                            Edit
                          </button>
                        )}
                        {hasPermission('delete:maintenance') && (
                          <button
                            className="btn btn-sm btn-danger ml-1"
                            onClick={() => handleDelete(activity)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingActivity ? 'Edit Maintenance Activity' : 'Add New Activity'}
        footer={modalFooter}
        size="large"
      >
        <form id="maintenance-form" onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label required">Title</label>
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Machine (Optional)</label>
                <select
                  name="machineId"
                  className="form-control"
                  value={formData.machineId}
                  onChange={handleChange}
                >
                  <option value="">Select Machine</option>
                  {machines.map(machine => (
                    <option key={machine._id} value={machine._id}>
                      {machine.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Site (Optional)</label>
                <select
                  name="site"
                  className="form-control"
                  value={formData.site}
                  onChange={handleChange}
                >
                  <option value="">Select Site</option>
                  {sites.map(site => (
                    <option key={site._id} value={site._id}>
                      {site.name} ({site.code})
                    </option>
                  ))}
                </select>
                <small className="form-text text-muted">Primary storage location</small>
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Specific Location (Optional)</label>
                <select
                  name="location"
                  className="form-control"
                  value={formData.location || ''}
                  onChange={handleChange}
                >
                  <option value="">Select Location</option>
                  <option value="Site Store">Site Store</option>
                  <option value="Site Office">Site Office</option>
                </select>
                <small className="form-text text-muted">Exact storage location within site</small>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Description</label>
            <textarea
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              required
            />
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
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label required">Priority</label>
                <select
                  name="priority"
                  className="form-control"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Scheduled Date (Optional)</label>
                <input
                  type="date"
                  name="scheduledDate"
                  className="form-control"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Due Date (Optional)</label>
                <input
                  type="date"
                  name="dueDate"
                  className="form-control"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Assigned To (Optional)</label>
                <input
                  type="text"
                  name="assignedTo"
                  className="form-control"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  placeholder="Enter name or user ID"
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Cost in UGX (Optional)</label>
                <input
                  type="number"
                  name="cost"
                  className="form-control"
                  value={formData.cost}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              name="notes"
              className="form-control"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Additional notes or comments"
            />
          </div>

          {/* Materials/Spares Used Section */}
          <div className="form-section">
            <h4>Materials/Spares Used</h4>
            <p className="text-muted">Add materials or spare parts used during maintenance. Inventory will be automatically updated when maintenance is completed.</p>
            
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Select Item</label>
                  <select
                    className="form-control"
                    value={materialInput.inventoryItem}
                    onChange={(e) => setMaterialInput({ ...materialInput, inventoryItem: e.target.value })}
                  >
                    <option value="">Select Inventory Item</option>
                    {inventory.map(item => (
                      <option key={item._id} value={item._id}>
                        {item.name} - Available: {item.currentStock} {item.category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-4">
                <div className="form-group">
                  <label className="form-label">Quantity Used</label>
                  <input
                    type="number"
                    className="form-control"
                    value={materialInput.quantityUsed}
                    onChange={(e) => setMaterialInput({ ...materialInput, quantityUsed: e.target.value })}
                    min="0"
                    step="1"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="col-2">
                <div className="form-group">
                  <label className="form-label">&nbsp;</label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddMaterial}
                    style={{ width: '100%' }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {formData.materialsUsed.length > 0 && (
              <div className="materials-list">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.materialsUsed.map((material, index) => {
                      const item = inventory.find(inv => inv._id === material.inventoryItem);
                      return (
                        <tr key={index}>
                          <td>{item?.name || 'Unknown Item'}</td>
                          <td>{material.quantityUsed}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRemoveMaterial(index)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recurring Maintenance Section */}
          <div className="form-section">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                />
                <span>Recurring Maintenance</span>
              </label>
            </div>

            {formData.isRecurring && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Recurrence Pattern</label>
                    <select
                      name="recurrencePattern"
                      className="form-control"
                      value={formData.recurrencePattern}
                      onChange={handleChange}
                      required={formData.isRecurring}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="fortnight">Fortnight (2 Weeks)</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly (3 Months)</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Every (Interval)</label>
                    <input
                      type="number"
                      name="recurrenceInterval"
                      className="form-control"
                      value={formData.recurrenceInterval}
                      onChange={handleChange}
                      min="1"
                      required={formData.isRecurring}
                    />
                    <small className="form-hint">
                      e.g., "2" for every 2 {
                        formData.recurrencePattern === 'daily' ? 'days' : 
                        formData.recurrencePattern === 'weekly' ? 'weeks' : 
                        formData.recurrencePattern === 'fortnight' ? 'fortnights' : 
                        formData.recurrencePattern === 'monthly' ? 'months' : 
                        formData.recurrencePattern === 'quarterly' ? 'quarters' : 
                        'years'
                      }
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Date (Optional)</label>
                    <input
                      type="date"
                      name="recurrenceEndDate"
                      className="form-control"
                      value={formData.recurrenceEndDate}
                      onChange={handleChange}
                    />
                    <small className="form-hint">Leave blank for indefinite recurrence</small>
                  </div>
                </div>
              </>
            )}
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Maintenance Activity"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Maintenance;
