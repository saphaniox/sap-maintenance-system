// Inventory View - Professional CRUD implementation
import React, { useState, useEffect } from 'react';
import InventoryService from '../services/inventory.service';
import SiteService from '../services/site.service';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { PaginationControls } from '../utils/pagination';
import { usePagination } from '../utils/pagination';
import { convertToCSV, downloadCSV, downloadJSON, printData } from '../utils/exportUtils';
import '../styles/pages/Inventory.css';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showAdjustStock, setShowAdjustStock] = useState(null);
  
  // Pagination & Sorting
  const [sortKey, setSortKey] = useState('name');
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
    name: '',
    category: '',
    department: 'general',
    currentStock: '',
    minStock: '',
    unit: 'pcs',
    location: '',
    site: '',
    description: '',
    cost: '',
    supplier: '',
    sku: '',
  });

  const [adjustmentData, setAdjustmentData] = useState({
    quantity: '',
    reason: '',
    type: 'add', // add or subtract
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsData, sitesData] = await Promise.all([
        InventoryService.getAll(),
        SiteService.getAllSites(),
      ]);
      setItems(itemsData);
      setSites(sitesData);
    } catch (error) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      department: 'general',
      currentStock: '',
      minStock: '',
      unit: 'pcs',
      location: '',
      site: '',
      description: '',
      cost: '',
      supplier: '',
      sku: '',
    });
    setEditingItem(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name || '',
      category: item.category || '',
      department: item.department || 'general',
      currentStock: item.currentStock || '',
      minStock: item.minStock || '',
      unit: item.unit || 'pcs',
      location: item.location || '',
      site: item.site?._id || item.site || '',
      description: item.description || '',
      cost: item.cost || '',
      supplier: item.supplier || '',
      sku: item.sku || '',
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    setDeleteConfirm(item);
  };

  const confirmDelete = async () => {
    try {
      await InventoryService.delete(deleteConfirm._id);
      toast.success('Inventory item deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete item');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await InventoryService.update(editingItem._id, formData);
        toast.success('Inventory item updated successfully');
      } else {
        await InventoryService.create(formData);
        toast.success('Inventory item created successfully');
      }
      
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to save item');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdjustmentChange = (e) => {
    const { name, value } = e.target;
    setAdjustmentData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdjustStock = (item) => {
    setShowAdjustStock(item);
    setAdjustmentData({
      quantity: '',
      reason: '',
      type: 'add',
    });
  };

  const submitStockAdjustment = async (e) => {
    e.preventDefault();
    
    try {
      const { quantity, type } = adjustmentData;
      const adjustment = type === 'add' ? parseInt(quantity) : -parseInt(quantity);
      const newStock = showAdjustStock.currentStock + adjustment;

      if (newStock < 0) {
        toast.error('Stock cannot be negative');
        return;
      }

      await InventoryService.update(showAdjustStock._id, {
        currentStock: newStock,
      });

      toast.success('Stock adjusted successfully');
      setShowAdjustStock(null);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to adjust stock');
    }
  };

  const isLowStock = (item) => {
    return item.currentStock <= item.minStock;
  };

  const getStockBadgeClass = (item) => {
    if (item.currentStock === 0) return 'badge badge-danger';
    if (isLowStock(item)) return 'badge badge-warning';
    return 'badge badge-success';
  };

  const getStockLabel = (item) => {
    if (item.currentStock === 0) return 'OUT OF STOCK';
    if (isLowStock(item)) return 'LOW STOCK';
    return 'IN STOCK';
  };

  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesLowStock = !showLowStockOnly || isLowStock(item);
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Sort inventory items by selected column (supports nested fields like 'category.name')
  const sortedItems = [...filteredItems].sort((itemA, itemB) => {
    // Helper function to get nested object values (e.g., 'category.name' → item.category.name)
    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((current, key) => current?.[key], obj) || '';
    };
    
    // Extract values from both items using the sort path
    const itemAValue = getNestedValue(itemA, sortKey);
    const itemBValue = getNestedValue(itemB, sortKey);
    
    // Compare alphabetically/numerically
    if (sortDirection === 'asc') {
      return String(itemAValue).localeCompare(String(itemBValue));
    } else {
      return String(itemBValue).localeCompare(String(itemAValue));
    }
  });

  const paginationResult = getPaginatedData(sortedItems);
  const paginatedItems = Array.isArray(paginationResult?.data) 
    ? paginationResult.data 
    : Array.isArray(paginationResult) 
    ? paginationResult 
    : [];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, showLowStockOnly]);

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
    const exportData = filteredItems.map(item => ({
      Name: item.name,
      Category: item.category || '-',
      'Current Stock': `${item.currentStock} ${item.unit}`,
      'Min Stock': `${item.minStock} ${item.unit}`,
      Location: item.location || '-',
      Status: getStockLabel(item),
      Cost: item.cost || '-',
      Supplier: item.supplier || '-',
    }));
    const csv = convertToCSV(exportData);
    downloadCSV(csv, 'inventory-items.csv');
    setShowExportMenu(false);
    toast.success('Exported to CSV');
  };

  const handleExportJSON = () => {
    downloadJSON(filteredItems, 'inventory-items.json');
    setShowExportMenu(false);
    toast.success('Exported to JSON');
  };

  const handlePrint = () => {
    const headers = ['Name', 'Category', 'Current Stock', 'Min Stock', 'Location', 'Status'];
    const rows = filteredItems.map(item => [
      item.name,
      item.category || '-',
      `${item.currentStock} ${item.unit}`,
      `${item.minStock} ${item.unit}`,
      item.location || '-',
      getStockLabel(item),
    ]);
    printData('Inventory Items', headers, rows);
    setShowExportMenu(false);
  };

  const modalFooter = (
    <>
      <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
        Cancel
      </button>
      <button type="submit" form="inventory-form" className="btn btn-primary">
        {editingItem ? 'Update Item' : 'Create Item'}
      </button>
    </>
  );

  const adjustmentModalFooter = (
    <>
      <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustStock(null)}>
        Cancel
      </button>
      <button type="submit" form="adjustment-form" className="btn btn-primary">
        Apply Adjustment
      </button>
    </>
  );

  return (
    <div className="inventory-page">
      <div className="card">
        <div className="card-header">
          <h1>Inventory Management</h1>
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
              + Add Item
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Search and Filters */}
          <div className="inventory-filters">
            <div className="search-box">
              <input
                type="text"
                className="form-control"
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="form-control"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <label className="low-stock-toggle">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
              />
              <span>Low Stock Only</span>
            </label>
          </div>

          {/* Loading/Empty State */}
          {loading ? (
            <div className="loading">
              <div className="spinner spinner-primary"></div>
              <p>Loading inventory...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">
              <p>No inventory items found</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => handleSort('name')}>
                        Name{getSortIcon('name')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('category')}>
                        Category{getSortIcon('category')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('currentStock')}>
                        Current Stock{getSortIcon('currentStock')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('minStock')}>
                        Min Stock{getSortIcon('minStock')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('site.name')}>
                        Site{getSortIcon('site.name')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('location')}>
                        Location{getSortIcon('location')}
                      </th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item) => (
                    <tr key={item._id} className={isLowStock(item) ? 'low-stock-row' : ''}>
                      <td>
                        <strong>{item.name}</strong>
                        {item.description && (
                          <>
                            <br />
                            <small className="text-muted">{item.description}</small>
                          </>
                        )}
                        {item.sku && (
                          <>
                            <br />
                            <small className="text-muted">SKU: {item.sku}</small>
                          </>
                        )}
                      </td>
                      <td>{item.category || '-'}</td>
                      <td>
                        {item.currentStock} {item.unit}
                      </td>
                      <td>
                        {item.minStock} {item.unit}
                      </td>
                      <td>
                        {item.site ? (
                          <>
                            <strong>{item.site.name}</strong>
                            <br />
                            <small className="text-muted">{item.site.code}</small>
                          </>
                        ) : '-'}
                      </td>
                      <td>{item.location || '-'}</td>
                      <td>
                        <span className={getStockBadgeClass(item)}>
                          {getStockLabel(item)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleAdjustStock(item)}
                        >
                          Adjust
                        </button>
                        <button
                          className="btn btn-sm btn-info ml-1"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger ml-1"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </button>
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
        title={editingItem ? 'Edit Inventory Item' : 'Add New Item'}
        footer={modalFooter}
        size="large"
      >
        <form id="inventory-form" onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div className="form-section">
            <h4>Basic Information</h4>
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Item Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Bearing 6205"
                    required
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    name="category"
                    className="form-control"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Category</option>
                    <optgroup label="Electrical">
                      <option value="Cables & Wires">Cables & Wires</option>
                      <option value="Switches & Relays">Switches & Relays</option>
                      <option value="Circuit Breakers">Circuit Breakers</option>
                      <option value="Motors">Motors</option>
                      <option value="Electrical Components">Electrical Components</option>
                    </optgroup>
                    <optgroup label="Mechanical">
                      <option value="Bearings">Bearings</option>
                      <option value="Gears">Gears</option>
                      <option value="Belts & Chains">Belts & Chains</option>
                      <option value="Shafts">Shafts</option>
                      <option value="Fasteners">Fasteners (Bolts, Nuts, Screws)</option>
                    </optgroup>
                    <optgroup label="Hydraulic & Pneumatic">
                      <option value="Hydraulic Hoses">Hydraulic Hoses</option>
                      <option value="Pneumatic Cylinders">Pneumatic Cylinders</option>
                      <option value="Valves">Valves</option>
                      <option value="Pumps">Pumps</option>
                      <option value="Seals & Gaskets">Seals & Gaskets</option>
                    </optgroup>
                    <optgroup label="Maintenance Supplies">
                      <option value="Lubricants">Lubricants & Oils</option>
                      <option value="Filters">Filters (Air, Oil, Hydraulic)</option>
                      <option value="Greases">Greases</option>
                      <option value="Cleaning Agents">Cleaning Agents</option>
                    </optgroup>
                    <optgroup label="Tools & Equipment">
                      <option value="Hand Tools">Hand Tools</option>
                      <option value="Power Tools">Power Tools</option>
                      <option value="Measuring Instruments">Measuring Instruments</option>
                      <option value="Safety Equipment">Safety Equipment (PPE)</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="Consumables">Consumables</option>
                      <option value="Raw Materials">Raw Materials</option>
                      <option value="Spare Parts">General Spare Parts</option>
                      <option value="Other">Other</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select
                    name="department"
                    className="form-control"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="electrical">Electrical</option>
                    <option value="mechanical">Mechanical</option>
                    <option value="hydraulic">Hydraulic</option>
                    <option value="pneumatic">Pneumatic</option>
                    <option value="electronics">Electronics</option>
                    <option value="safety">Safety</option>
                    <option value="general">General Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                  <small className="form-text text-muted">Functional department responsible for this item</small>
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    name="description"
                    className="form-control"
                    value={formData.description}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Brief description of the item"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stock Information Section */}
          <div className="form-section">
            <h4>Stock Information</h4>
            {editingItem && (
              <div className="alert alert-info mb-3">
                <strong>Current Stock in System:</strong> {editingItem.currentStock} {editingItem.unit}
                <br />
                <small>Use "Adjust Stock" button in the table to modify stock levels</small>
              </div>
            )}
            <div className="row">
              <div className="col-4">
                <div className="form-group">
                  <label className="form-label">{editingItem ? 'Current Stock (Read-only)' : 'Initial Stock *'}</label>
                  <input
                    type="number"
                    name="currentStock"
                    className="form-control"
                    value={formData.currentStock}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    disabled={!!editingItem}
                    required={!editingItem}
                  />
                  {editingItem && (
                    <small className="form-text text-muted">Stock cannot be edited here. Use "Adjust Stock" button.</small>
                  )}
                </div>
              </div>
              <div className="col-4">
                <div className="form-group">
                  <label className="form-label">Minimum Stock Level *</label>
                  <input
                    type="number"
                    name="minStock"
                    className="form-control"
                    value={formData.minStock}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    placeholder="0"
                    required
                  />
                  <small className="form-text text-muted">Alert threshold for low stock</small>
                </div>
              </div>
              <div className="col-4">
                <div className="form-group">
                  <label className="form-label">Unit of Measurement *</label>
                  <select
                    name="unit"
                    className="form-control"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="ltr">Liters (ltr)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="m">Meters (m)</option>
                    <option value="cm">Centimeters (cm)</option>
                    <option value="ft">Feet (ft)</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="set">Set</option>
                    <option value="roll">Roll</option>
                    <option value="bottle">Bottle</option>
                    <option value="unit">Unit</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Site Information Section */}
          <div className="form-section">
            <h4>Location Details (Optional)</h4>
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Site</label>
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
                  <label className="form-label">Specific Location</label>
                  <input
                    type="text"
                    name="location"
                    className="form-control"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Shelf A3, Bin 12"
                  />
                  <small className="form-text text-muted">Exact storage location within site</small>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details Section */}
          <div className="form-section">
            <h4>Additional Details (Optional)</h4>
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">SKU / Part Number</label>
                  <input
                    type="text"
                    name="sku"
                    className="form-control"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="e.g., SKU-12345"
                  />
                  <small className="form-text text-muted">Stock keeping unit or part number</small>
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Cost per Unit (UGX)</label>
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
                  <small className="form-text text-muted">Purchase or unit cost</small>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Supplier Name</label>
              <input
                type="text"
                name="supplier"
                className="form-control"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="e.g., ABC Supplies Ltd"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={!!showAdjustStock}
        onClose={() => setShowAdjustStock(null)}
        title={`Adjust Stock: ${showAdjustStock?.name}`}
        footer={adjustmentModalFooter}
        size="small"
      >
        <form id="adjustment-form" onSubmit={submitStockAdjustment}>
          <div className="stock-current">
            <p>Current Stock: <strong>{showAdjustStock?.currentStock} {showAdjustStock?.unit}</strong></p>
          </div>

          <div className="form-group">
            <label className="form-label required">Type</label>
            <select
              name="type"
              className="form-control"
              value={adjustmentData.type}
              onChange={handleAdjustmentChange}
              required
            >
              <option value="add">Add Stock</option>
              <option value="subtract">Remove Stock</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Quantity</label>
            <input
              type="number"
              name="quantity"
              className="form-control"
              value={adjustmentData.quantity}
              onChange={handleAdjustmentChange}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea
              name="reason"
              className="form-control"
              value={adjustmentData.reason}
              onChange={handleAdjustmentChange}
              rows="3"
              placeholder="Optional reason for adjustment"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Inventory Item"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Inventory;
