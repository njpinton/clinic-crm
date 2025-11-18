/**
 * Sentry Server Configuration for Next.js
 * HIPAA-compliant error tracking with PHI data scrubbing
 */
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,

  // Adjust sample rate for production
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Enable debug in development
  debug: SENTRY_ENVIRONMENT === 'development',

  // HIPAA Compliance: Scrub sensitive data before sending to Sentry
  beforeSend(event, hint) {
    // Remove sensitive PHI data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.data) {
          breadcrumb.data = scrubSensitiveData(breadcrumb.data);
        }
        return breadcrumb;
      });
    }

    // Remove sensitive data from extra context
    if (event.extra) {
      event.extra = scrubSensitiveData(event.extra);
    }

    // Remove sensitive data from request data
    if (event.request) {
      if (event.request.data) {
        event.request.data = scrubSensitiveData(event.request.data);
      }
      if (event.request.headers) {
        // Remove authorization headers
        const headers = { ...event.request.headers };
        delete headers['authorization'];
        delete headers['cookie'];
        event.request.headers = headers;
      }
      // Scrub query parameters that might contain PHI
      if (event.request.query_string) {
        event.request.query_string = '[REDACTED]';
      }
    }

    // Remove server environment variables that might leak sensitive info
    if (event.server_name) {
      event.server_name = '[REDACTED]';
    }

    // Remove user email and other PII
    if (event.user) {
      event.user = {
        id: event.user.id,
        // Remove email, username, and other identifying info
      };
    }

    return event;
  },

  // Don't capture console logs (may contain PHI)
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === 'console') {
      return null;
    }
    return breadcrumb;
  },

  // Ignore errors that don't need tracking
  ignoreErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
  ],
});

/**
 * Scrub sensitive PHI data from objects
 * HIPAA Compliance: Remove all potentially identifiable information
 */
function scrubSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    // Patient Information
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

    // Authentication & Security
    'password',
    'token',
    'access_token', 'accessToken',
    'refresh_token', 'refreshToken',
    'authorization',
    'api_key', 'apiKey',

    // Medical Information
    'diagnosis',
    'symptoms',
    'medications',
    'prescription',
    'lab_results', 'labResults',
    'treatment',
    'notes',
    'medical_history', 'medicalHistory',

    // Insurance Information
    'insurance_number', 'insuranceNumber',
    'policy_number', 'policyNumber',
    'group_number', 'groupNumber',
  ];

  if (Array.isArray(data)) {
    return data.map(item => scrubSensitiveData(item));
  }

  const scrubbed: any = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if field is sensitive
    if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      scrubbed[key] = scrubSensitiveData(value);
    } else {
      scrubbed[key] = value;
    }
  }

  return scrubbed;
}
