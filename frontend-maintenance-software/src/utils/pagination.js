import { useState, useEffect, useCallback } from 'react';

/**
 * Pagination hook for optimized data loading
 * @param {function} fetchFunction - Function to fetch paginated data
 * @param {object} options - Pagination options
 * @returns {object} Pagination state and controls
 */
export function usePagination(fetchFunction = null, options = {}) {
  const {
    initialPage = 1,
    initialPageSize = 10,
    cacheKey = null,
    autoFetch = true
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    pageSize: initialPageSize,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchPage = useCallback(async (page = pagination.currentPage, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      setError(null);

      if (!fetchFunction) {
        // No server-side fetch; nothing to do here
        setLoading(false);
        return null;
      }

      const result = await fetchFunction({
        page,
        limit: pageSize,
        offset: (page - 1) * pageSize
      });

      setData(result.data || result.items || []);
      setPagination({
        currentPage: page,
        pageSize,
        totalItems: result.total || result.totalCount || 0,
        totalPages: Math.ceil((result.total || result.totalCount || 0) / pageSize),
        hasNextPage: page < Math.ceil((result.total || result.totalCount || 0) / pageSize),
        hasPrevPage: page > 1
      });

      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, pagination.currentPage, pagination.pageSize]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchPage(page);
    }
  }, [fetchPage, pagination.totalPages]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      goToPage(pagination.currentPage + 1);
    }
  }, [goToPage, pagination.hasNextPage, pagination.currentPage]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      goToPage(pagination.currentPage - 1);
    }
  }, [goToPage, pagination.hasPrevPage, pagination.currentPage]);

  const changePageSize = useCallback((newPageSize) => {
    fetchPage(1, newPageSize);
  }, [fetchPage]);

  const refresh = useCallback(() => {
    fetchPage(pagination.currentPage, pagination.pageSize);
  }, [fetchPage, pagination.currentPage, pagination.pageSize]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && fetchFunction) {
      fetchPage();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side pagination helper
  const getPaginatedData = useCallback((items = []) => {
    return getPaginatedDataLocal(items, pagination.currentPage, pagination.pageSize);
  }, [pagination.currentPage, pagination.pageSize]);

  return {
    data,
    loading,
    error,
    pagination,
    currentPage: pagination.currentPage,
    pageSize: pagination.pageSize,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
    startIndex: (pagination.currentPage - 1) * pagination.pageSize,
    endIndex: Math.min(pagination.currentPage * pagination.pageSize - 1, pagination.totalItems - 1),
    setCurrentPage: goToPage,
    setPageSize: changePageSize,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    refresh,
    fetchPage,
    getPaginatedData
  };
}

/**
 * Helper for client-side pagination
 * @param {Array} items - Source array
 * @param {number} page - current page
 * @param {number} pageSize - page size
 * @returns {object} { data, startIndex, endIndex, totalItems, totalPages }
 */
export function getPaginatedDataLocal(items = [], page = 1, pageSize = 10) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const data = items.slice(startIndex, endIndex);
  return { data, startIndex, endIndex: endIndex - 1, totalItems, totalPages };
}

/**
 * Infinite scroll hook for loading more data
 * @param {function} fetchFunction - Function to fetch more data
 * @param {object} options - Infinite scroll options
 * @returns {object} Infinite scroll state and controls
 */
export function useInfiniteScroll(fetchFunction, options = {}) {
  const {
    initialPageSize = 20,
    threshold = 100, // pixels from bottom to trigger load
    enabled = true
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const result = await fetchFunction({
        page,
        limit: initialPageSize,
        offset: (page - 1) * initialPageSize
      });

      const newItems = result.data || result.items || [];
      setData(prev => [...prev, ...newItems]);

      // Check if there's more data
      const totalLoaded = data.length + newItems.length;
      const totalAvailable = result.total || result.totalCount || 0;

      setHasMore(totalLoaded < totalAvailable && newItems.length > 0);
      setPage(prev => prev + 1);

    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, page, initialPageSize, loading, hasMore, enabled, data.length]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  // Scroll handler for infinite scroll
  const handleScroll = useCallback((element) => {
    if (!element || !enabled) return;

    const { scrollTop, scrollHeight, clientHeight } = element;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < threshold) {
      loadMore();
    }
  }, [loadMore, threshold, enabled]);

  // Initial load
  useEffect(() => {
    if (enabled && data.length === 0) {
      loadMore();
    }
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    handleScroll
  };
}

/**
 * Pagination component for UI
 * Moved to components/Pagination.jsx to separate concerns
 */
// Export for backward compatibility - components should import from components/Pagination.jsx
export { PaginationControls } from '../components/Pagination';

export default usePagination;
