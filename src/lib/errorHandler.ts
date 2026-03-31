// Centralized error handling service

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorLog {
  message: string;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: any;
}

class ErrorHandler {
  private errors: ErrorLog[] = [];
  private maxErrors = 100;

  /**
   * Log an error with context
   */
  log(error: any, severity: ErrorSeverity = 'medium', context?: any) {
    const errorLog: ErrorLog = {
      message: error?.message || String(error),
      severity,
      timestamp: new Date(),
      context
    };

    this.errors.push(errorLog);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${severity.toUpperCase()}]`, errorLog.message, context);
    }

    // In production, you would send to error tracking service like Sentry
    // Example: Sentry.captureException(error, { level: severity, extra: context });
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: any): string {
    if (typeof error === 'string') return error;
    
    // Handle Supabase errors
    if (error?.code) {
      switch (error.code) {
        case '23505':
          return 'This item already exists';
        case '23503':
          return 'Cannot delete: item is referenced elsewhere';
        case 'PGRST116':
          return 'Item not found';
        default:
          return error.message || 'An error occurred';
      }
    }

    return error?.message || 'An unexpected error occurred';
  }

  /**
   * Get all logged errors
   */
  getErrors(): ErrorLog[] {
    return [...this.errors];
  }

  /**
   * Clear error log
   */
  clear() {
    this.errors = [];
  }
}

export const errorHandler = new ErrorHandler();

/**
 * Handle async operations with consistent error handling
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    errorHandler.log(error, 'medium', { operation: errorMessage });
    return { data: null, error: errorHandler.getUserMessage(error) };
  }
}
