import { useEffect } from 'react';

/**
 * Custom hook to set the browser tab title
 * Usage: usePageTitle('Dashboard') or usePageTitle('Machine Details', 'MC-001')
 */
export function usePageTitle(title, subtitle = null) {
  useEffect(() => {
    const baseTitle = 'Maintenance Tracker';
    
    if (subtitle) {
      // e.g., "Machine Details - MC-001 | Maintenance Tracker"
      document.title = `${title} - ${subtitle} | ${baseTitle}`;
    } else if (title) {
      // e.g., "Dashboard | Maintenance Tracker"
      document.title = `${title} | ${baseTitle}`;
    } else {
      // Just the base title
      document.title = baseTitle;
    }
    
    // Cleanup: Reset to base title when component unmounts
    return () => {
      document.title = baseTitle;
    };
  }, [title, subtitle]);
}

/**
 * Helper function to set page title imperatively
 * Useful for dynamic titles that change based on data loading
 */
export function setPageTitle(title, subtitle = null) {
  const baseTitle = 'Maintenance Tracker';
  
  if (subtitle) {
    document.title = `${title} - ${subtitle} | ${baseTitle}`;
  } else if (title) {
    document.title = `${title} | ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
}

/**
 * Get formatted page title for meta tags
 */
export function getPageTitle(title, subtitle = null) {
  const baseTitle = 'Maintenance Tracker';
  
  if (subtitle) {
    return `${title} - ${subtitle} | ${baseTitle}`;
  } else if (title) {
    return `${title} | ${baseTitle}`;
  }
  return baseTitle;
}

export default usePageTitle;
