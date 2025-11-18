/**
 * Sentry Edge Runtime Configuration for Next.js
 * Used for middleware and edge functions
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

  // HIPAA Compliance: Scrub sensitive data before sending to Sentry
  beforeSend(event) {
    // Remove sensitive data from request
    if (event.request) {
      if (event.request.headers) {
        const headers = { ...event.request.headers };
        delete headers['authorization'];
        delete headers['cookie'];
        event.request.headers = headers;
      }
      if (event.request.query_string) {
        event.request.query_string = '[REDACTED]';
      }
    }

    // Remove user PII
    if (event.user) {
      event.user = {
        id: event.user.id,
      };
    }

    return event;
  },
});
