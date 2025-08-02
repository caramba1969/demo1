/**
 * Centralized error handling utilities for user-friendly error messages
 */

export interface UserError {
  message: string;
  type: 'error' | 'warning' | 'info';
  code?: string;
}

/**
 * Maps common error patterns to user-friendly messages
 */
export function getUserFriendlyError(error: unknown): UserError {
  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      type: 'error'
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Network/connectivity errors
    if (error.message.includes('fetch') || error.message.includes('network') || error.name === 'TypeError') {
      return {
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        type: 'error',
        code: 'NETWORK_ERROR'
      };
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return {
        message: 'The request took too long to complete. Please try again.',
        type: 'error',
        code: 'TIMEOUT_ERROR'
      };
    }

    return {
      message: error.message,
      type: 'error'
    };
  }

  // Handle API response errors
  if (error?.status || error?.statusCode) {
    const status = error.status || error.statusCode;
    
    switch (status) {
      case 400:
        return {
          message: error.message || 'Invalid request. Please check your input and try again.',
          type: 'error',
          code: 'BAD_REQUEST'
        };
      case 401:
        return {
          message: 'Please sign in to continue.',
          type: 'warning',
          code: 'UNAUTHORIZED'
        };
      case 403:
        return {
          message: 'You don\'t have permission to perform this action.',
          type: 'error',
          code: 'FORBIDDEN'
        };
      case 404:
        return {
          message: 'The requested resource was not found.',
          type: 'error',
          code: 'NOT_FOUND'
        };
      case 409:
        return {
          message: error.message || 'This item already exists. Please try with a different name.',
          type: 'error',
          code: 'CONFLICT'
        };
      case 429:
        return {
          message: 'Too many requests. Please wait a moment before trying again.',
          type: 'warning',
          code: 'RATE_LIMITED'
        };
      case 500:
        return {
          message: 'Something went wrong on our end. Please try again in a few moments.',
          type: 'error',
          code: 'SERVER_ERROR'
        };
      case 503:
        return {
          message: 'The service is temporarily unavailable. Please try again later.',
          type: 'warning',
          code: 'SERVICE_UNAVAILABLE'
        };
      default:
        return {
          message: error.message || 'An unexpected error occurred. Please try again.',
          type: 'error',
          code: 'UNKNOWN_ERROR'
        };
    }
  }

  // Handle specific error patterns
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    // Database/MongoDB errors
    if (message.includes('mongodb') || message.includes('database')) {
      return {
        message: 'Database connection issue. Please try again in a moment.',
        type: 'error',
        code: 'DATABASE_ERROR'
      };
    }

    // Authentication errors
    if (message.includes('authentication') || message.includes('auth')) {
      return {
        message: 'Authentication failed. Please sign in again.',
        type: 'warning',
        code: 'AUTH_ERROR'
      };
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return {
        message: 'Please check your input and make sure all required fields are filled correctly.',
        type: 'error',
        code: 'VALIDATION_ERROR'
      };
    }

    // Factory-specific errors
    if (message.includes('factory')) {
      if (message.includes('not found')) {
        return {
          message: 'Factory not found. It may have been deleted or you may not have access to it.',
          type: 'error',
          code: 'FACTORY_NOT_FOUND'
        };
      }
      if (message.includes('access denied')) {
        return {
          message: 'You don\'t have permission to access this factory.',
          type: 'error',
          code: 'FACTORY_ACCESS_DENIED'
        };
      }
      return {
        message: 'There was an issue with the factory operation. Please try again.',
        type: 'error',
        code: 'FACTORY_ERROR'
      };
    }

    // Recipe/Item errors
    if (message.includes('recipe not found')) {
      return {
        message: 'The selected recipe was not found. Please choose a different recipe.',
        type: 'error',
        code: 'RECIPE_NOT_FOUND'
      };
    }

    if (message.includes('item not found')) {
      return {
        message: 'The selected item was not found. Please choose a different item.',
        type: 'error',
        code: 'ITEM_NOT_FOUND'
      };
    }

    if (message.includes('recipe does not produce')) {
      return {
        message: 'The selected recipe doesn\'t produce the chosen item. Please select a compatible recipe.',
        type: 'error',
        code: 'RECIPE_ITEM_MISMATCH'
      };
    }

    return {
      message: error.message,
      type: 'error'
    };
  }

  // Default fallback
  return {
    message: 'An unexpected error occurred. Please try again.',
    type: 'error',
    code: 'UNKNOWN_ERROR'
  };
}

/**
 * Handles fetch response errors and converts them to user-friendly messages
 */
export async function handleFetchError(response: Response): Promise<UserError> {
  try {
    const errorData = await response.json();
    return getUserFriendlyError({
      status: response.status,
      message: errorData.error || errorData.message,
      ...errorData
    });
  } catch {
    return getUserFriendlyError({
      status: response.status,
      message: `Request failed (${response.status})`
    });
  }
}

/**
 * Hook for handling errors in React components
 */
export function useErrorHandler() {
  const handleError = (error: unknown): UserError => {
    console.error('Error occurred:', error);
    return getUserFriendlyError(error);
  };

  return { handleError };
}