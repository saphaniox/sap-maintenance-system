// Requisitions View - Professional CRUD implementation with approval workflow
import React, { useState, useEffect } from 'react';
import RequisitionService from '../services/requisition.service';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { paginate, sortData } from '../utils/paginationUtils';
import { convertToCSV, downloadCSV, downloadJSON, printData } from '../utils/exportUtils';
import '../styles/pages/Requisitions.css';

const Requisitions = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRequisition, setEditingRequisition] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionConfirm, setActionConfirm] = useState(null); // for approve/reject
  
  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState('title');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    requester: '',
    items: [{ name: '', quantity: '', unit: '' }],
    priority: 'medium',
    neededBy: '',
    notes: '',
  });

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      const data = await RequisitionService.getAll();
      setRequisitions(data);
    } catch (error) {
      toast.error(error.message || 'Failed to load requisitions');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      department: '',
      requester: '',
      items: [{ name: '', quantity: '', unit: '' }],
      priority: 'medium',
      neededBy: '',
      notes: '',
    });
    setEditingRequisition(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (requisition) => {
    setFormData({
      title: requisition.title || '',
      description: requisition.description || '',
      department: requisition.department || '',
      requester: requisition.requester || '',
      items: requisition.items?.length > 0 
        ? requisition.items 
        : [{ name: '', quantity: '', unit: '' }],
      priority: requisition.priority || 'medium',
      neededBy: requisition.neededBy ? requisition.neededBy.split('T')[0] : '',
      notes: requisition.notes || '',
    });
    setEditingRequisition(requisition);
    setShowForm(true);
  };

  const handleDelete = (requisition) => {
    setDeleteConfirm(requisition);
  };

  const confirmDelete = async () => {
    try {
      await RequisitionService.delete(deleteConfirm._id);
      toast.success('Requisition deleted successfully');
      fetchRequisitions();
    } catch (error) {
      toast.error(error.message || 'Failed to delete requisition');
    }
  };

  const handleApprove = (requisition) => {
    setActionConfirm({
      requisition,
      action: 'approve',
      title: 'Approve Requisition',
      message: `Are you sure you want to approve "${requisition.title}"?`,
    });
  };

  const handleReject = (requisition) => {
    setActionConfirm({
      requisition,
      action: 'reject',
      title: 'Reject Requisition',
      message: `Are you sure you want to reject "${requisition.title}"?`,
    });
  };

  const confirmAction = async () => {
    try {
      if (actionConfirm.action === 'approve') {
        await RequisitionService.approve(actionConfirm.requisition._id);
        toast.success('Requisition approved successfully');
      } else {
        await RequisitionService.reject(actionConfirm.requisition._id);
        toast.success('Requisition rejected successfully');
      }
      setActionConfirm(null);
      fetchRequisitions();
    } catch (error) {
      toast.error(error.message || 'Failed to process requisition');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate items
    const validItems = formData.items.filter(item => item.name && item.quantity);
    if (validItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      const submitData = {
        ...formData,
        items: validItems,
      };

      if (editingRequisition) {
        await RequisitionService.update(editingRequisition._id, submitData);
        toast.success('Requisition updated successfully');
      } else {
        await RequisitionService.create(submitData);
        toast.success('Requisition created successfully');
      }
      
      setShowForm(false);
      resetForm();
      fetchRequisitions();
    } catch (error) {
      toast.error(error.message || 'Failed to save requisition');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: '', unit: '' }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      toast.warning('At least one item is required');
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      completed: 'badge-info',
    };
    return `badge ${statusMap[status] || ''}`;
  };

  const getPriorityBadgeClass = (priority) => {
    const priorityMap = {
      low: 'badge-info',
      medium: 'badge-warning',
      high: 'badge-danger',
      urgent: 'badge-danger',
    };
    return `badge ${priorityMap[priority] || ''}`;
  };

  const filteredRequisitions = requisitions.filter(req => {
    const matchesSearch = !searchQuery || 
      req.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Sort and paginate
  const sortedRequisitions = sortData(filteredRequisitions, sortKey, sortDirection);
  const { data: paginatedRequisitions, totalPages, totalItems } = paginate(
    sortedRequisitions,
    currentPage,
    pageSize
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

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
    const exportData = filteredRequisitions.map(req => ({
      Title: req.title,
      Department: req.department || '-',
      Requester: req.requester || '-',
      Priority: req.priority?.toUpperCase(),
      Status: req.status?.toUpperCase(),
      'Needed By': req.neededBy ? new Date(req.neededBy).toLocaleDateString() : '-',
      Items: req.items?.length || 0,
    }));
    const csv = convertToCSV(exportData);
    downloadCSV(csv, 'requisitions.csv');
    setShowExportMenu(false);
    toast.success('Exported to CSV');
  };

  const handleExportJSON = () => {
    downloadJSON(filteredRequisitions, 'requisitions.json');
    setShowExportMenu(false);
    toast.success('Exported to JSON');
  };

  const handlePrint = () => {
    const headers = ['Title', 'Department', 'Requester', 'Priority', 'Status', 'Needed By'];
    const rows = filteredRequisitions.map(req => [
      req.title,
      req.department || '-',
      req.requester || '-',
      req.priority?.toUpperCase(),
      req.status?.toUpperCase(),
      req.neededBy ? new Date(req.neededBy).toLocaleDateString() : '-',
    ]);
    printData('Requisitions', headers, rows);
    setShowExportMenu(false);
  };

  const modalFooter = (
    <>
      <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
        Cancel
      </button>
      <button type="submit" form="requisition-form" className="btn btn-primary">
        {editingRequisition ? 'Update Requisition' : 'Create Requisition'}
      </button>
    </>
  );

  return (
    <div className="requisitions-page">
      <div className="card">
        <div className="card-header">
          <h1>Requisitions</h1>
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
            <button className="btn btn-primary" onClick={handleAdd}>
              + New Requisition
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Search and Filters */}
          <div className="requisitions-filters">
            <div className="search-box">
              <input
                type="text"
                className="form-control"
                placeholder="Search requisitions..."
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
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Loading/Empty State */}
          {loading ? (
            <div className="loading">
              <div className="spinner spinner-primary"></div>
              <p>Loading requisitions...</p>
            </div>
          ) : filteredRequisitions.length === 0 ? (
            <div className="empty-state">
              <p>No requisitions found</p>
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
                      <th className="sortable" onClick={() => handleSort('department')}>
                        Department{getSortIcon('department')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('requester')}>
                        Requester{getSortIcon('requester')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('priority')}>
                        Priority{getSortIcon('priority')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('status')}>
                        Status{getSortIcon('status')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('neededBy')}>
                        Needed By{getSortIcon('neededBy')}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRequisitions.map((req) => (
                    <tr key={req._id}>
                      <td>
                        <strong>{req.title}</strong>
                        <br />
                        <small className="text-muted">
                          {req.items?.length || 0} item(s)
                        </small>
                      </td>
                      <td>{req.department || '-'}</td>
                      <td>{req.requester || '-'}</td>
                      <td>
                        <span className={getPriorityBadgeClass(req.priority)}>
                          {req.priority?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(req.status)}>
                          {req.status?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {req.neededBy 
                          ? new Date(req.neededBy).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td>
                        {req.status === 'pending' && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(req)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-warning ml-1"
                              onClick={() => handleReject(req)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-sm btn-info ml-1"
                          onClick={() => handleEdit(req)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger ml-1"
                          onClick={() => handleDelete(req)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingRequisition ? 'Edit Requisition' : 'New Requisition'}
        footer={modalFooter}
        size="large"
      >
        <form id="requisition-form" onSubmit={handleSubmit}>
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

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              rows="2"
            />
          </div>

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Requester</label>
                <input
                  type="text"
                  name="requester"
                  className="form-control"
                  value={formData.requester}
                  onChange={handleChange}
                />
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
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Needed By</label>
            <input
              type="date"
              name="neededBy"
              className="form-control"
              value={formData.neededBy}
              onChange={handleChange}
            />
          </div>

          {/* Items Section */}
          <div className="form-group">
            <label className="form-label required">Items</label>
            {formData.items.map((item, index) => (
              <div key={index} className="item-row">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                  required
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  min="1"
                  required
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Unit"
                  value={item.unit}
                  onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                />
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeItem(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-sm btn-secondary mt-2"
              onClick={addItem}
            >
              + Add Item
            </button>
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
        title="Delete Requisition"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />

      {/* Approve/Reject Confirmation */}
      <ConfirmDialog
        isOpen={!!actionConfirm}
        onClose={() => setActionConfirm(null)}
        onConfirm={confirmAction}
        title={actionConfirm?.title}
        message={actionConfirm?.message}
        confirmText={actionConfirm?.action === 'approve' ? 'Approve' : 'Reject'}
        type={actionConfirm?.action === 'approve' ? 'success' : 'warning'}
      />
    </div>
  );
};

export default Requisitions;
