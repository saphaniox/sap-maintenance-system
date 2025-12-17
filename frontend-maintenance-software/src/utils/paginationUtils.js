// Pagination Utilities

/**
 * Paginate an array of data
 * @param {Array} data - Array to paginate
 * @param {number} page - Current page (1-indexed)
 * @param {number} pageSize - Number of items per page
 * @returns {Object} Paginated result with data and metadata
 */
export const paginate = (data, page = 1, pageSize = 10) => {
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    data: data.slice(startIndex, endIndex),
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    startIndex: startIndex + 1,
    endIndex: Math.min(endIndex, totalItems),
  };
};

/**
 * Generate page numbers for pagination UI
 * @param {number} currentPage - Current page
 * @param {number} totalPages - Total number of pages
 * @param {number} maxVisible - Maximum number of page buttons to show
 * @returns {Array} Array of page numbers to display
 */
export const getPageNumbers = (currentPage, totalPages, maxVisible = 5) => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  const halfVisible = Math.floor(maxVisible / 2);
  let start = currentPage - halfVisible;
  let end = currentPage + halfVisible;
  
  if (start < 1) {
    start = 1;
    end = maxVisible;
  }
  
  if (end > totalPages) {
    end = totalPages;
    start = totalPages - maxVisible + 1;
  }
  
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
};

/**
 * Sort array by key
 * @param {Array} data - Array to sort
 * @param {string} key - Key to sort by (supports nested keys with dot notation)
 * @param {string} direction - Sort direction ('asc' for ascending, 'desc' for descending)
 * @returns {Array} Sorted array
 */
export const sortData = (data, key, direction = 'asc') => {
  const sorted = [...data].sort((itemA, itemB) => {
    let valueFromItemA = itemA[key];
    let valueFromItemB = itemB[key];
    
    // Handle nested keys (e.g., 'user.name' → user.name)
    if (key.includes('.')) {
      const nestedKeys = key.split('.');
      // Navigate through nested properties: nestedKeys = ['user', 'name']
      valueFromItemA = nestedKeys.reduce((currentObj, nestedKey) => currentObj?.[nestedKey], itemA);
      valueFromItemB = nestedKeys.reduce((currentObj, nestedKey) => currentObj?.[nestedKey], itemB);
    }
    
    // Handle null/undefined: push nulls to the end
    if (valueFromItemA === null || valueFromItemA === undefined) return 1;
    if (valueFromItemB === null || valueFromItemB === undefined) return -1;
    
    // Handle dates: convert to timestamps for comparison
    if (valueFromItemA instanceof Date || valueFromItemB instanceof Date) {
      valueFromItemA = new Date(valueFromItemA).getTime();
      valueFromItemB = new Date(valueFromItemB).getTime();
    }
    
    // Handle strings: case-insensitive comparison
    if (typeof valueFromItemA === 'string' && typeof valueFromItemB === 'string') {
      valueFromItemA = valueFromItemA.toLowerCase();
      valueFromItemB = valueFromItemB.toLowerCase();
    }
    
    // Compare values and return sort order
    if (valueFromItemA < valueFromItemB) {
      return direction === 'asc' ? -1 : 1; // Ascending: -1 means A comes first
    }
    if (valueFromItemA > valueFromItemB) {
      return direction === 'asc' ? 1 : -1; // Descending: 1 means B comes first
    }
    return 0; // Values are equal
  });
  
  return sorted;
};
