/**
 * This module sets up application monitoring for production environments
 * In a real app, you would integrate with a service like Sentry, LogRocket, etc.
 */

// Monitoring module - Only initialize in production
const isProduction = process.env.NODE_ENV === 'production';
// Can be expanded with actual monitoring services like Sentry

// Add type declarations for window Sentry object
declare global {
  interface Window {
    _SENTRY_INITIALIZED?: boolean;
    Sentry?: {
      captureException(error: Error): void;
    };
  }
}

// Simple logger implementation with severity levels
class Logger {
  private context: string;
  private includeTimestamp: boolean;

  constructor(context: string, includeTimestamp = true) {
    this.context = context;
    this.includeTimestamp = includeTimestamp;
  }

  private getTimestamp(): string {
    if (!this.includeTimestamp) return '';
    return `[${new Date().toISOString()}] `;
  }

  info(message: string, data?: any): void {
    const formattedMessage = data 
      ? `${this.getTimestamp()}[INFO] [${this.context}] ${message} ${JSON.stringify(data)}`
      : `${this.getTimestamp()}[INFO] [${this.context}] ${message}`;
    
    if (isProduction) {
      // In production, only log to console if DEBUG is enabled
      if (process.env.DEBUG === 'true') {
        console.log(formattedMessage);
      }
    } else {
      console.log(formattedMessage);
    }
  }

  warn(message: string, data?: any): void {
    const formattedMessage = data 
      ? `${this.getTimestamp()}[WARN] [${this.context}] ${message} ${JSON.stringify(data)}`
      : `${this.getTimestamp()}[WARN] [${this.context}] ${message}`;
    
    console.warn(formattedMessage);
  }

  error(message: string, error?: any): void {
    let formattedMessage = `${this.getTimestamp()}[ERROR] [${this.context}] ${message}`;
    
    // Include error details if provided
    if (error) {
      if (error instanceof Error) {
        formattedMessage += ` ${error.message}`;
        
        if (error.stack) {
          formattedMessage += `\n${error.stack}`;
        }
      } else if (typeof error === 'object') {
        formattedMessage += ` ${JSON.stringify(error)}`;
      } else {
        formattedMessage += ` ${error}`;
      }
    }
    
    console.error(formattedMessage);
    
    if (isProduction) {
      // Send error to monitoring service in production
      this.captureException(message, error);
    }
  }

  success(message: string, data?: any): void {
    const formattedMessage = data 
      ? `${this.getTimestamp()}[SUCCESS] [${this.context}] ${message} ${JSON.stringify(data)}`
      : `${this.getTimestamp()}[SUCCESS] [${this.context}] ${message}`;
    
    if (isProduction) {
      // In production, only log to console if DEBUG is enabled
      if (process.env.DEBUG === 'true') {
        console.log(formattedMessage);
      }
    } else {
      console.log(formattedMessage);
    }
  }

  debug(message: string, data?: any): void {
    // Only log debug messages in development or if DEBUG is explicitly enabled
    if (!isProduction || process.env.DEBUG === 'true') {
      const formattedMessage = data 
        ? `${this.getTimestamp()}[DEBUG] [${this.context}] ${message} ${JSON.stringify(data)}`
        : `${this.getTimestamp()}[DEBUG] [${this.context}] ${message}`;
      
      console.log(formattedMessage);
    }
  }

  // Function to track errors in production
  private captureException(message: string, error?: any): void {
    // Implementation for error monitoring service (e.g., Sentry)
    try {
      if (typeof window !== 'undefined' && window._SENTRY_INITIALIZED) {
        // Client-side error tracking
        if (window.Sentry) {
          window.Sentry.captureException(error || new Error(message));
        }
      } else if (typeof process !== 'undefined' && process.env.SENTRY_DSN) {
        // Server-side error tracking using Sentry SDK
        // This would require proper Sentry initialization elsewhere in the app
        // Here we're just assuming it has been set up with process.env.SENTRY_DSN
        
        // The actual implementation would depend on your error tracking service
        // Below is a placeholder for where the implementation would go
        console.error(`[MONITORING] Error captured: ${message}`);
      }
    } catch (e) {
      // Failsafe to ensure monitoring errors don't crash the app
      console.error('Error in monitoring system:', e);
    }
  }

  // Function to track performance metrics
  trackPerformance(name: string, durationMs: number, tags?: Record<string, string>): void {
    // Only track detailed performance in development or if explicitly enabled
    if (!isProduction || process.env.DEBUG === 'true') {
      const formattedMessage = tags 
        ? `${this.getTimestamp()}[PERF] [${this.context}] ${name}: ${durationMs}ms ${JSON.stringify(tags)}`
        : `${this.getTimestamp()}[PERF] [${this.context}] ${name}: ${durationMs}ms`;
      
      console.log(formattedMessage);
    }
    
    if (isProduction && durationMs > 1000) {
      // Track slow operations in production
      // Implement your monitoring service integration here
      console.warn(`[PERF WARNING] [${this.context}] Slow operation: ${name}: ${durationMs}ms`);
    }
  }
}

// Create a single logger instance for the application
export const logger = new Logger('WanderPaws');

// Export helper function to create context-specific loggers
export function createLogger(context: string): Logger {
  return new Logger(context);
}

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
    const url = typeof input === 'string' ? input : 
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

