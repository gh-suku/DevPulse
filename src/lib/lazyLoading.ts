// Issue #39: Code Splitting and Lazy Loading
// Utilities for implementing lazy loading and code splitting

import { lazy, ComponentType } from 'react';

/**
 * Lazy load a component with retry logic
 * Handles network failures by retrying the import
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries: number = 3
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | null = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await componentImport();
      } catch (error) {
        lastError = error as Error;
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
    
    throw lastError || new Error('Failed to load component');
  });
}

/**
 * Preload a lazy component
 * Useful for prefetching components before they're needed
 */
export function preloadComponent(
  componentImport: () => Promise<{ default: ComponentType<any> }>
): void {
  componentImport().catch(err => {
    console.warn('Failed to preload component:', err);
  });
}
