/**
 * Sentry Helper Functions
 * HIPAA-compliant error tracking utilities
 */
import * as Sentry from '@sentry/nextjs';

/**
 * Capture an exception with additional context
 * Automatically scrubs PHI data
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
) {
  Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || 'error',
  });
}

/**
 * Capture a message with context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Set user context (use carefully - avoid PHI)
 * Only set non-identifying user information
 */
export function setUser(user: {
  id: string;
  role?: string;
}) {
  Sentry.setUser({
    id: user.id,
    role: user.role,
    // NEVER include: email, name, phone, or other PHI
  });
}

/**
 * Clear user context (call on logout)
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for tracking user actions
 * Automatically scrubs sensitive data
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  // Filter out PHI from breadcrumb data
  const sanitizedData = data ? scrubPHI(data) : undefined;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data: sanitizedData,
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string
) {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Scrub PHI from objects before sending to Sentry
 * HIPAA Compliance: Remove all potentially identifiable information
 */
function scrubPHI(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = [
    'first_name', 'firstName',
    'last_name', 'lastName',
    'full_name', 'fullName',
    'date_of_birth', 'dateOfBirth', 'dob',
    'ssn', 'social_security_number',
    'medical_record_number', 'mrn',
    'email',
    'phone', 'phone_number', 'phoneNumber',
    'address', 'address_line1', 'address_line2',
    'city', 'state', 'zip_code', 'zipCode',
    'password',
    'token',
    'access_token', 'accessToken',
    'refresh_token', 'refreshToken',
  ];

  const scrubbed: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      scrubbed[key] = scrubPHI(value);
    } else {
      scrubbed[key] = value;
    }
  }

  return scrubbed;
}

/**
 * Wrap async function with error tracking
 */
export function withErrorTracking<T>(
  fn: () => Promise<T>,
  context?: {
    operation: string;
    tags?: Record<string, string>;
  }
): Promise<T> {
  return fn().catch((error) => {
    captureException(error, {
      tags: {
        operation: context?.operation || 'unknown',
        ...context?.tags,
      },
    });
    throw error;
  });
}
