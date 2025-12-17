import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/components/Breadcrumbs.css';

export function Breadcrumbs() {
  const location = useLocation();
  
  // Build breadcrumb items from current path
  const pathnames = location.pathname.split('/').filter(x => x);
  
  // Don't show breadcrumbs on login/signup pages
  if (['/login', '/signup'].includes(location.pathname)) {
    return null;
  }
  
  // Home is always the first breadcrumb
  const breadcrumbs = [
    { path: '/', label: '🏠 Home' }
  ];
  
  // Build breadcrumb trail from URL segments
  let currentPath = '';
  pathnames.forEach(segment => {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      path: currentPath,
      label: humanizeSegment(segment)
    });
  });
  
  // Don't render if we're just at home
  if (breadcrumbs.length <= 1) {
    return null;
  }
  
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb navigation">
      <ol className="breadcrumbs-list">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={crumb.path} className="breadcrumb-item">
              {!isLast ? (
                <>
                  <Link to={crumb.path} className="breadcrumb-link">
                    {crumb.label}
                  </Link>
                  <span className="breadcrumb-separator">›</span>
                </>
              ) : (
                <span className="breadcrumb-current" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Convert URL segments to human-readable labels
function humanizeSegment(segment) {
  // Handle special cases with custom labels
  const labelMap = {
    'dashboard': '📊 Dashboard',
    'machines': '⚙️ Machines',
    'maintenance': '🔧 Maintenance',
    'inventory': '📦 Inventory',
    'sites': '📍 Sites',
    'requisitions': '📝 Requisitions',
    'analytics': '📈 Analytics',
    'reports': '📄 Reports',
    'profile': '👤 Profile',
    'settings': '⚙️ Settings',
    'new': 'New',
    'edit': 'Edit',
  };
  
  if (labelMap[segment]) {
    return labelMap[segment];
  }
  
  // Convert kebab-case or snake_case to Title Case
  return segment
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default Breadcrumbs;
