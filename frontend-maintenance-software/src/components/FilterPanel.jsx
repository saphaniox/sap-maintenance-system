import React, { useState, useEffect } from 'react';
import '../styles/components/FilterPanel.css';

function FilterPanel({ filters, onFilterChange, onSaveFilter, savedFilters = [], onLoadFilter, onDeleteFilter }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    // Keep local copy in sync when parent changes filters
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    // Update a single filter field and notify parent component
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onFilterChange(updated);
  };

  const handleSaveFilter = () => {
    // Save current filters with a custom name for quick access later
    if (filterName.trim()) {
      onSaveFilter(filterName, localFilters);
      setShowSaveModal(false);
      setFilterName('');
    }
  };

  const clearAllFilters = () => {
    // Reset all filters to empty/default state
    const cleared = Object.keys(localFilters).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {});
    setLocalFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters = () => {
    // Check if any filters are currently applied
    return Object.values(localFilters).some(value => value !== '' && value !== null && value !== undefined);
  };

  return (
    <div className={`filter-panel ${isExpanded ? 'expanded' : ''}`}>
      <div className="filter-header">
        <button className="filter-toggle" onClick={() => setIsExpanded(!isExpanded)}>
          <span className="filter-icon">🔍</span>
          <span className="filter-title">Filters</span>
          {/* Show how many filters are active */}
          {hasActiveFilters() && <span className="filter-badge">{Object.values(localFilters).filter(v => v).length}</span>}
          <span className={`toggle-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </button>

        {hasActiveFilters() && (
          <button className="clear-filters-btn" onClick={clearAllFilters}>
            Clear All
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="filter-content">
          {/* Saved Filters - quick access to frequently used filter combinations */}
          {savedFilters.length > 0 && (
            <div className="saved-filters-section">
              <div className="section-title">
                <span className="bookmark-icon">⭐</span> Saved Filters
              </div>
              <div className="saved-filters-list">
                {savedFilters.map((saved, index) => (
                  <div key={index} className="saved-filter-item">
                    <button
                      className="load-filter-btn"
                      onClick={() => onLoadFilter(saved.filters)}
                    >
                      <span className="filter-name-icon">📁</span>
                      {saved.name}
                    </button>
                    <button
                      className="delete-filter-btn"
                      onClick={() => onDeleteFilter(index)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Fields - the actual filter inputs */}
          <div className="filter-fields">
            {Object.entries(localFilters).map(([key, value]) => (
              <div key={key} className="filter-field">
                <label className="filter-label">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                {renderFilterInput(key, value, handleFilterChange)}
              </div>
            ))}
          </div>

          {/* Actions - save current filter setup for reuse */}
          <div className="filter-actions">
            <button className="save-filter-btn" onClick={() => setShowSaveModal(true)}>
              <span>⭐</span> Save Filter
            </button>
          </div>
        </div>
      )}

      {/* Save Filter Modal - popup for naming and saving filter combinations */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="save-filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Save Filter</h3>
              <button className="modal-close" onClick={() => setShowSaveModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="filter-name-input"
                placeholder="Enter filter name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveFilter} disabled={!filterName.trim()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderFilterInput(key, value, onChange) {
  // Figure out what kind of input to show based on the field name
  const type = getInputType(key);

  if (type === 'select') {
    const options = getSelectOptions(key);
    return (
      <select
        className="filter-select"
        value={value || ''}
        onChange={(e) => onChange(key, e.target.value)}
      >
        <option value="">All</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }

  if (type === 'date') {
    return (
      <input
        type="date"
        className="filter-input"
        value={value || ''}
        onChange={(e) => onChange(key, e.target.value)}
      />
    );
  }

  // Default to text input for everything else
  return (
    <input
      type="text"
      className="filter-input"
      placeholder={`Filter by ${key}...`}
      value={value || ''}
      onChange={(e) => onChange(key, e.target.value)}
    />
  );
}

function getInputType(key) {
  // Decide if this field should be a dropdown, date picker, or text input
  if (['status', 'type', 'priority', 'role', 'category'].includes(key.toLowerCase())) {
    return 'select';
  }
  if (key.toLowerCase().includes('date')) {
    return 'date';
  }
  return 'text';
}

function getSelectOptions(key) {
  // Dropdown options for common filter fields
  const options = {
    status: [
      { value: 'pending', label: 'Pending' },
      { value: 'in-progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' }
    ],
    priority: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' }
    ],
    type: [
      { value: 'preventive', label: 'Preventive' },
      { value: 'corrective', label: 'Corrective' },
      { value: 'emergency', label: 'Emergency' }
    ],
    role: [
      { value: 'operator', label: 'Operator' },
      { value: 'supervisor', label: 'Supervisor' },
      { value: 'manager', label: 'Manager' },
      { value: 'administrator', label: 'Administrator' }
    ]
  };

  return options[key.toLowerCase()] || [];
}

export default FilterPanel;
