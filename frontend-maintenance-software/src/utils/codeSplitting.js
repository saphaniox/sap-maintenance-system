import { lazy } from 'react';

/**
 * Code splitting utilities for performance optimization
 * Provides lazy loading for components and dynamic imports
 */

// Lazy load components with error boundaries
export const lazyLoad = (importFunc, fallback = null) => {
  return lazy(() =>
    importFunc().catch(error => {
      console.error('Failed to load component:', error);
      // Return a fallback component in valid format
      // If no fallback provided, shows default error message
      return fallback || {
        default: () => {
          // Return fallback UI when component fails to load
          return null; // Will be caught by error boundary
        }
      };
    })
  );
};

// Preload components for better UX
export const preloadComponent = (importFunc) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = importFunc.toString().match(/import\(['"]([^'"]+)['"]\)/)?.[1];
  if (link.href) {
    document.head.appendChild(link);
  }
};

// Dynamic import utilities
export const dynamicImport = {
  // Load script dynamically
  loadScript: (src, id) => {
    return new Promise((resolve, reject) => {
      if (document.getElementById(id)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.id = id;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  // Load CSS dynamically
  loadCSS: (href, id) => {
    return new Promise((resolve, reject) => {
      if (document.getElementById(id)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.id = id;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  },

  // Load multiple resources
  loadResources: async (resources) => {
    const promises = resources.map(resource => {
      if (resource.type === 'script') {
        return dynamicImport.loadScript(resource.src, resource.id);
      } else if (resource.type === 'css') {
        return dynamicImport.loadCSS(resource.href, resource.id);
      }
      return Promise.resolve();
    });

    return Promise.all(promises);
  }
};

// Bundle splitting strategies
export const bundleSplit = {
  // Split by route
  byRoute: (route) => {
    const routeMap = {
      '/dashboard': () => import('../views/Dashboard'),
      '/machines': () => import('../views/Machines'),
      '/maintenance': () => import('../views/Maintenance'),
      '/inventory': () => import('../views/Inventory'),
      '/analytics': () => import('../views/Analytics'),
      '/requisitions': () => import('../views/Requisitions'),
      '/production-reports': () => import('../views/ProductionReports'),
      '/profile': () => import('../views/Profile'),
    };

    return routeMap[route] || (() => import('../views/Dashboard'));
  },

  // Split by feature
  byFeature: (feature) => {
    const featureMap = {
      'charts': () => import('../components/Charts'),
      'forms': () => import('../components/Modal'),
      'export': () => import('../utils/exportUtils'),
      'notifications': () => import('../components/NotificationCenter'),
    };

    return featureMap[feature] || (() => Promise.resolve({ default: () => null }));
  }

  // Note: Heavy components like DataTable, RichTextEditor, FileUpload
  // not yet implemented - can be added as they are created
};

// Performance monitoring
export const performanceMonitor = {
  // Track bundle loading time
  trackBundleLoad: (bundleName, startTime) => {
    const loadTime = Date.now() - startTime;
    console.log(`Bundle "${bundleName}" loaded in ${loadTime}ms`);

    // Send to analytics if available
    if (window.gtag) {
      window.gtag('event', 'bundle_load', {
        bundle_name: bundleName,
        load_time: loadTime
      });
    }
  },

  // Track component render time
  trackRenderTime: (componentName, renderTime) => {
    console.log(`Component "${componentName}" rendered in ${renderTime}ms`);
  },

  // Monitor memory usage
  getMemoryUsage: () => {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }
};

// Service worker utilities for offline support
export const serviceWorkerUtils = {
  // Register service worker
  register: async (swPath = '/sw.js') => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(swPath);
        console.log('Service Worker registered:', registration);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, notify user
                console.log('New content available, please refresh.');
              }
            });
          }
        });

        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  },

  // Unregister service worker
  unregister: async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      console.log('Service Workers unregistered');
    }
  },

  // Check if app is online
  isOnline: () => navigator.onLine,

  // Listen for online/offline events
  onNetworkChange: (callback) => {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }
};

// Export registerServiceWorker as a convenience function
export const registerServiceWorker = async (swPath = '/sw.js') => {
  return serviceWorkerUtils.register(swPath);
};

// Resource hints for performance
export const resourceHints = {
  // Add preload hints
  preload: (href, as = 'fetch') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  },

  // Add prefetch hints
  prefetch: (href) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  },

  // Add preconnect hints
  preconnect: (href) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    document.head.appendChild(link);
  },

  // Add dns-prefetch hints
  dnsPrefetch: (href) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
};

export default {
  lazyLoad,
  preloadComponent,
  dynamicImport,
  bundleSplit,
  performanceMonitor,
  serviceWorkerUtils,
  resourceHints
};
