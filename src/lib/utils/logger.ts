/**
 * Simple logger utility for consistent logging across the application
 */
export const logger = {
  debug: (message: string, data?: any) => {
    console.log(`🔍 ${message}`, data ? data : '');
  },
  
  info: (message: string, data?: any) => {
    console.log(`ℹ️ ${message}`, data ? data : '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ ${message}`, data ? data : '');
  },
  
  error: (message: string, data?: any) => {
    console.error(`❌ ${message}`, data ? data : '');
  },
  
  success: (message: string, data?: any) => {
    console.log(`✅ ${message}`, data ? data : '');
  }
}; 