/**
 * This module sets up application monitoring for production environments
 * In a real app, you would integrate with a service like Sentry, LogRocket, etc.
 */

// Monitoring module - Only initialize in production
const isProduction = process.env.NODE_ENV === 'production';
// Can be expanded with actual monitoring services like Sentry

export function setupMonitoring() {
  if (typeof window === 'undefined' || !isProduction) return;

  // Global error handling
  setupGlobalErrorTracking();
  
  // Performance monitoring
  setupPerformanceTracking();
  
  // API call tracking
  setupAPITracking();
  
  console.log('Monitoring initialized in production environment');
}

function setupGlobalErrorTracking() {
  // Listen for unhandled errors
  window.addEventListener('error', (event) => {
    reportError({
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });
  
  // Listen for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    reportError({
      message: 'Unhandled Promise Rejection',
      error: event.reason
    });
  });
}

function setupPerformanceTracking() {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Check if it's a navigation timing entry
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          reportPerformanceMetric('page-load', {
            url: window.location.href,
            loadTime: navEntry.loadEventEnd - navEntry.startTime,
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            timeToInteractive: navEntry.domContentLoadedEventEnd
          });
        }
      }
    });
    
    // Observe navigation and resource timings
    observer.observe({ entryTypes: ['navigation', 'resource'] });
  }
}

function setupAPITracking() {
  // Override fetch to measure API call performance
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    const startTime = performance.now();
    let url = typeof input === 'string' ? input : 
              input instanceof URL ? input.toString() : 
              input instanceof Request ? input.url : '';
    
    try {
      const response = await originalFetch(input, init);
      const endTime = performance.now();
      
      // Only track API calls
      if (url.includes('/api/')) {
        reportPerformanceMetric('api-call', {
          url: url,
          duration: endTime - startTime,
          status: response.status,
          success: response.ok
        });
      }
      
      return response;
    } catch (error) {
      const endTime = performance.now();
      
      if (url.includes('/api/')) {
        reportPerformanceMetric('api-call', {
          url: url,
          duration: endTime - startTime,
          status: 0,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      throw error;
    }
  };
}

// Report functions - Can be expanded to send to monitoring services
function reportError(errorData: {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  error?: any;
}) {
  if (isProduction) {
    console.error('Error tracked:', errorData);
    // TODO: Send to error tracking service
  }
}

function reportPerformanceMetric(metricName: string, data: Record<string, any>) {
  if (isProduction) {
    console.info(`Performance metric - ${metricName}:`, data);
    // TODO: Send to performance monitoring service
  }
} 