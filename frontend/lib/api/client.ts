/**
 * Centralized API client with automatic token timeout detection.
 * Handles 401 errors by automatically logging out the user.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Callback function to handle logout
 */
let logoutCallback: (() => void) | null = null;

/**
 * Set the logout callback function
 * This should be called from the AuthContext
 */
export function setLogoutCallback(callback: () => void) {
  logoutCallback = callback;
}

/**
 * Helper function to handle API responses with automatic logout on 401
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  // Check for 401 Unauthorized - token has expired
  if (response.status === 401) {
    let errorMessage = 'Your session has expired. Please log in again.';

    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // If response is not JSON, use default error message
    }

    // Trigger logout if callback is set
    if (logoutCallback) {
      logoutCallback();
    }

    throw new ApiError(errorMessage, response.status);
  }

  // Handle other error responses
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    let errorData;

    try {
      errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // If response is not JSON, use default error message
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Base API URL from environment variables
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000';
