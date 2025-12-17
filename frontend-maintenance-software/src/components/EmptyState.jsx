import React from 'react';
import '../styles/components/EmptyState.css';

// Generic empty state component - shows when there's no data
export function EmptyState({ 
  icon, 
  title, 
  message, 
  actionLabel, 
  onAction,
  illustration = 'default' 
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-illustration">
        {getIllustration(illustration)}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="empty-state-action">
          {icon && <span className="empty-state-icon">{icon}</span>}
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Empty state for search results
export function EmptySearch({ searchTerm, onClear }) {
  return (
    <EmptyState
      illustration="search"
      title="No results found"
      message={`We couldn't find anything matching "${searchTerm}". Try adjusting your search or filters.`}
      actionLabel="Clear search"
      onAction={onClear}
      icon="🔍"
    />
  );
}

// Empty state for lists (machines, sites, etc.)
export function EmptyList({ 
  entityType = 'items',
  onAdd,
  addLabel = `Add ${entityType}` 
}) {
  return (
    <EmptyState
      illustration="list"
      title={`No ${entityType} yet`}
      message={`Get started by creating your first ${entityType}. You can add details, track status, and manage everything from here.`}
      actionLabel={addLabel}
      onAction={onAdd}
      icon="➕"
    />
  );
}

// Empty state for maintenance records
export function EmptyMaintenance({ onSchedule }) {
  return (
    <EmptyState
      illustration="maintenance"
      title="No maintenance scheduled"
      message="Keep your machines running smoothly by scheduling regular maintenance. Stay ahead of issues and minimize downtime."
      actionLabel="Schedule maintenance"
      onAction={onSchedule}
      icon="🔧"
    />
  );
}

// Empty state for inventory
export function EmptyInventory({ onAdd }) {
  return (
    <EmptyState
      illustration="inventory"
      title="Inventory is empty"
      message="Start tracking your spare parts and supplies. Add items to monitor stock levels and get alerts when running low."
      actionLabel="Add inventory item"
      onAction={onAdd}
      icon="📦"
    />
  );
}

// Empty state for notifications
export function EmptyNotifications() {
  return (
    <EmptyState
      illustration="notifications"
      title="All caught up!"
      message="You have no new notifications. We'll let you know when something needs your attention."
      icon="🔔"
    />
  );
}

// Empty state for permissions (when user can't access something)
export function NoPermissions() {
  return (
    <EmptyState
      illustration="permissions"
      title="Access restricted"
      message="You don't have permission to view this content. Contact your administrator if you believe this is an error."
      icon="🔒"
    />
  );
}

// SVG illustrations for different scenarios
function getIllustration(type) {
  const illustrations = {
    default: (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="60" fill="var(--gray-100)" />
        <path d="M100 70v60M70 100h60" stroke="var(--gray-400)" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
    
    search: (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="80" cy="80" r="40" stroke="var(--primary)" strokeWidth="6" />
        <path d="M110 110l30 30" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="80" cy="80" r="20" fill="var(--gray-100)" />
      </svg>
    ),
    
    list: (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="40" y="40" width="120" height="30" rx="4" fill="var(--gray-100)" />
        <rect x="40" y="85" width="120" height="30" rx="4" fill="var(--gray-100)" />
        <rect x="40" y="130" width="120" height="30" rx="4" fill="var(--gray-100)" />
      </svg>
    ),
    
    maintenance: (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50L130 80H70L100 50Z" fill="var(--primary)" />
        <rect x="90" y="80" width="20" height="70" fill="var(--primary)" />
        <circle cx="100" cy="100" r="15" fill="var(--card-bg)" stroke="var(--primary)" strokeWidth="3" />
      </svg>
    ),
    
    inventory: (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="60" y="60" width="80" height="80" rx="4" fill="var(--gray-100)" stroke="var(--primary)" strokeWidth="3" />
        <path d="M80 100h40M100 80v40" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
        <rect x="50" y="50" width="100" height="10" fill="var(--primary)" />
      </svg>
    ),
    
    notifications: (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50v10M100 140v10M70 90c0-16.569 13.431-30 30-30s30 13.431 30 30v30H70V90Z" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" />
        <path d="M85 150c0 8.284 6.716 15 15 15s15-6.716 15-15" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
    
    permissions: (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="60" y="90" width="80" height="60" rx="4" fill="var(--gray-100)" stroke="var(--warning)" strokeWidth="3" />
        <path d="M80 90V70c0-11.046 8.954-20 20-20s20 8.954 20 20v20" stroke="var(--warning)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="120" r="8" fill="var(--warning)" />
      </svg>
    )
  };
  
  return illustrations[type] || illustrations.default;
}

export default EmptyState;
