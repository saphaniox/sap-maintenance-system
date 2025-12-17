import React from 'react';
import '../styles/components/LoadingSkeleton.css';

// Loading skeleton for better UX instead of just spinners
export function SkeletonCard({ count = 1 }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-badge"></div>
          </div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text short"></div>
          <div className="skeleton-footer">
            <div className="skeleton skeleton-button"></div>
            <div className="skeleton skeleton-button"></div>
          </div>
        </div>
      ))}
    </>
  );
}

export function SkeletonTable({ rows = 5, columns = 6 }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="skeleton skeleton-th"></div>
        ))}
      </div>
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {[...Array(columns)].map((_, colIndex) => (
            <div key={colIndex} className="skeleton skeleton-td"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStat({ count = 4 }) {
  return (
    <div className="skeleton-stats">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="skeleton-stat-card">
          <div className="skeleton skeleton-stat-icon"></div>
          <div className="skeleton-stat-content">
            <div className="skeleton skeleton-stat-label"></div>
            <div className="skeleton skeleton-stat-value"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="skeleton-list">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="skeleton-list-item">
          <div className="skeleton skeleton-avatar"></div>
          <div className="skeleton-list-content">
            <div className="skeleton skeleton-list-title"></div>
            <div className="skeleton skeleton-list-subtitle"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Default export wrapper for backward compatibility
export function LoadingSkeleton({ count = 1, type = 'card' } = {}) {
  switch (type) {
    case 'table':
      return <SkeletonTable rows={count} columns={6} />;
    case 'stat':
      return <SkeletonStat count={count} />;
    case 'list':
      return <SkeletonList count={count} />;
    case 'card':
    default:
      return <SkeletonCard count={count} />;
  }
}

export default SkeletonCard;
