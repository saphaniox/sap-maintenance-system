import { useState, useEffect, useCallback } from 'react';

/**
 * Simple data caching utility for API responses
 * Provides TTL (Time To Live) and automatic cleanup
 */

class Cache {
  constructor() {
    this.cache = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Set a value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 5 * 60 * 1000) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if expired/not found
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const [key, item] of this.cache) {
      if (now > item.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      hitRate: this.cache.size > 0 ? (valid / this.cache.size * 100).toFixed(1) : 0
    };
  }

  /**
   * Start automatic cleanup of expired items
   */
  startCleanup() {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache) {
        if (now > item.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Create singleton instance
const apiCache = new Cache();

export default apiCache;

/**
 * React hook for cached API calls
 * @param {string} cacheKey - Unique cache key
 * @param {function} apiCall - Function that returns a promise
 * @param {number} ttl - Cache TTL in milliseconds
 * @returns {object} { data, loading, error, refetch }
 */
export function useCachedApi(cacheKey, apiCall, ttl = 5 * 60 * 1000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first (unless forcing refresh)
      if (!force && apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey);
        setData(cachedData);
        setLoading(false);
        return cachedData;
      }

      // Make API call
      const result = await apiCall();

      // Cache the result
      apiCache.set(cacheKey, result, ttl);
      setData(result);
      setLoading(false);

      return result;
    } catch (err) {
      setError(err);
      setLoading(false);
      throw err;
    }
  }, [cacheKey, apiCall, ttl]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true)
  };
}

/**
 * Higher-order component for caching
 * @param {function} apiCall - API function to cache
 * @param {string} cacheKey - Cache key
 * @param {number} ttl - Cache TTL
 * @returns {function} Wrapped component
 */
export function withCache(apiCall, cacheKey, ttl = 5 * 60 * 1000) {
  return async (...args) => {
    // Check cache first
    if (apiCache.has(cacheKey)) {
      return apiCache.get(cacheKey);
    }

    // Make API call and cache result
    const result = await apiCall(...args);
    apiCache.set(cacheKey, result, ttl);

    return result;
  };
}

/**
 * Cache invalidation helpers
 */
export const cacheUtils = {
  // Generate a stable cache key from a URL and params
  generateKey: (url, params) => {
    try {
      const normalizedParams = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
      return `${url}|${normalizedParams}`;
    } catch (err) {
      return `${url}`;
    }
  },

  // Get a value from cache
  get: (key) => apiCache.get(key),

  // Set a value in cache
  set: (key, value, ttl) => apiCache.set(key, value, ttl),

  // Check if key exists
  has: (key) => apiCache.has(key),

  // Invalidate specific cache key
  invalidate: (key) => apiCache.delete(key),

  // Invalidate multiple keys matching pattern
  invalidatePattern: (pattern) => {
    const regex = new RegExp(pattern);
    for (const key of apiCache.cache.keys()) {
      if (regex.test(key)) {
        apiCache.delete(key);
      }
    }
  },

  // Clear all cache
  clearAll: () => apiCache.clear(),

  // Get cache stats
  getStats: () => apiCache.getStats(),

  // Prefetch data
  prefetch: async (cacheKey, apiCall, ttl) => {
    try {
      const result = await apiCall();
      apiCache.set(cacheKey, result, ttl);
      return result;
    } catch (error) {
      console.warn('Prefetch failed:', error);
      return null;
    }
  }
};
