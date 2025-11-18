/**
 * Common types and enums used across the application
 */

// Common API response structure
export interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Pagination params
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

// Common timestamp fields
export interface TimestampFields {
  created_at: string;
  updated_at: string;
}

// Soft delete fields
export interface SoftDeleteFields extends TimestampFields {
  deleted_at: string | null;
}

// Gender choices
export type Gender = 'M' | 'F' | 'O' | 'U';

// US States (common ones, can be expanded)
export type USState =
  | 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'FL' | 'GA'
  | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MD'
  | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ'
  | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI' | 'SC'
  | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY';

// API Error response
export interface ApiError {
  detail?: string;
  error?: string;
  [key: string]: any;
}
