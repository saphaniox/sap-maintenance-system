// Cache Manager - Auto-clear cache on version change
import { APP_VERSION } from '../config/version';

const STORAGE_KEY = 'app_version';
const CACHE_CLEARED_KEY = 'cache_last_cleared';

/**
 * Check if app version changed and clear cache if needed
 */
export const checkVersionAndClearCache = () => {
  const storedVersion = localStorage.getItem(STORAGE_KEY);
  const currentVersion = APP_VERSION;

  console.log('🔍 Cache Manager - Checking version...');
  console.log('   Stored version:', storedVersion);
  console.log('   Current version:', currentVersion);

  if (storedVersion !== currentVersion) {
    console.log('🔄 Version changed - Clearing cache...');
    clearAllCache();
    localStorage.setItem(STORAGE_KEY, currentVersion);
    localStorage.setItem(CACHE_CLEARED_KEY, new Date().toISOString());
    console.log('✅ Cache cleared for new version:', currentVersion);
    return true;
  }

  console.log('✓ Version unchanged - No cache clearing needed');
  return false;
};

/**
 * Clear all browser cache
 */
export const clearAllCache = () => {
  console.log('🗑️ Clearing all caches...');

  // Clear localStorage (keep auth tokens)
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  localStorage.clear();
  if (token) localStorage.setItem('token', token);
  if (user) localStorage.setItem('user', user);

  // Clear sessionStorage
  sessionStorage.clear();

  // Clear service worker caches
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        console.log('   Deleting cache:', cacheName);
        caches.delete(cacheName);
      });
    });
  }

  // Unregister service worker to force fresh registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        console.log('   Unregistering service worker...');
        registration.unregister();
      });
    });
  }

  console.log('✅ All caches cleared');
};

/**
 * Force clear cache and reload
 */
export const forceClearAndReload = () => {
  console.log('🔄 Force clearing cache and reloading...');
  clearAllCache();
  localStorage.setItem(CACHE_CLEARED_KEY, new Date().toISOString());
  window.location.reload(true); // Hard reload
};

/**
 * Get last cache clear timestamp
 */
export const getLastCacheCleared = () => {
  return localStorage.getItem(CACHE_CLEARED_KEY);
};

// Auto-check on import
checkVersionAndClearCache();

// Listen for service worker messages
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'CACHE_CLEARED') {
      console.log('📢 Service Worker cleared cache for version:', event.data.version);
      localStorage.setItem(STORAGE_KEY, event.data.version);
      localStorage.setItem(CACHE_CLEARED_KEY, new Date().toISOString());
    }
  });
}

export default {
  checkVersionAndClearCache,
  clearAllCache,
  forceClearAndReload,
  getLastCacheCleared
};
