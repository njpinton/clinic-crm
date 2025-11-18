# Sentry Setup for Clinic CRM Frontend

This document explains the Sentry error tracking setup for the frontend application, including HIPAA compliance measures.

## Overview

Sentry is configured to track errors and performance while maintaining HIPAA compliance by automatically scrubbing all Protected Health Information (PHI) before sending data to Sentry's servers.

## Configuration Files

### 1. Sentry Config Files

- **`sentry.client.config.ts`**: Client-side error tracking configuration
- **`sentry.server.config.ts`**: Server-side error tracking configuration
- **`sentry.edge.config.ts`**: Edge runtime error tracking configuration
- **`instrumentation.ts`**: Next.js instrumentation file for automatic initialization

### 2. Error Boundaries

- **`app/error.tsx`**: Global error boundary for the entire app
- **`app/global-error.tsx`**: Root layout error boundary
- **`app/(dashboard)/patients/error.tsx`**: Page-specific error boundary example

### 3. Helper Library

- **`lib/sentry.ts`**: Utility functions for consistent Sentry usage across the app

## Environment Variables

Add these to your `.env.local` file:

```bash
# Required: Sentry DSN
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development

# Optional: For production source map uploads
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token
```

### Getting Your Sentry DSN

1. Create a Sentry account at https://sentry.io
2. Create a new project for your Next.js application
3. Navigate to Settings → Projects → [Your Project] → Client Keys (DSN)
4. Copy the DSN and add it to your `.env.local` file

## HIPAA Compliance

### Automatic PHI Scrubbing

All Sentry configurations include automatic scrubbing of:

- Patient names (first_name, last_name, full_name)
- Dates of birth (date_of_birth, dob)
- Medical record numbers (mrn, medical_record_number)
- Contact information (email, phone, address)
- Social security numbers (ssn)
- Insurance information (policy_number, group_number)
- Authentication tokens
- Passwords
- Medical data (diagnosis, symptoms, medications, lab results)

### How It Works

1. **beforeSend Hook**: Every error is processed before sending to Sentry
2. **Data Scrubbing**: All sensitive fields are replaced with `[REDACTED]`
3. **Header Removal**: Authorization and Cookie headers are removed
4. **User Context**: Only non-identifying info (user ID, role) is included
5. **Console Logs**: Not captured to avoid leaking PHI

### Example

```typescript
// Before scrubbing
{
  patient: {
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    mrn: "MRN-2025-001"
  }
}

// After scrubbing (sent to Sentry)
{
  patient: {
    first_name: "[REDACTED]",
    last_name: "[REDACTED]",
    email: "[REDACTED]",
    mrn: "[REDACTED]"
  }
}
```

## Usage

### Using Error Boundaries

Error boundaries automatically catch and report errors:

```tsx
// Errors in this component are automatically caught
export default function MyPage() {
  // Your code here
  throw new Error('Something went wrong');
}
```

### Manual Error Tracking

Use the helper library for manual error tracking:

```typescript
import { captureException, captureMessage, addBreadcrumb } from '@/lib/sentry';

// Capture an exception
try {
  await fetchPatientData();
} catch (error) {
  captureException(error, {
    tags: { operation: 'fetch-patients' },
    extra: { userId: user.id },
  });
}

// Capture a message
captureMessage('User performed important action', 'info', {
  tags: { feature: 'appointments' },
});

// Add breadcrumb
addBreadcrumb('User clicked create button', 'user-action', 'info');
```

### Setting User Context

```typescript
import { setUser, clearUser } from '@/lib/sentry';

// On login (only non-PHI data)
setUser({
  id: user.id,
  role: user.role,
});

// On logout
clearUser();
```

### Tracking Async Operations

```typescript
import { withErrorTracking } from '@/lib/sentry';

const result = await withErrorTracking(
  async () => {
    return await fetchData();
  },
  {
    operation: 'fetch-data',
    tags: { feature: 'patients' },
  }
);
```

## Performance Monitoring

Sentry is configured to track performance:

- **Sample Rate**: 10% in production, 100% in development
- **Route Tracing**: Automatically traces API calls
- **Custom Transactions**: Use `startTransaction()` for custom tracking

```typescript
import { startTransaction } from '@/lib/sentry';

const transaction = startTransaction('patient-search', 'search');
try {
  // Your code here
  await searchPatients(query);
} finally {
  transaction?.finish();
}
```

## Testing Sentry

To test that Sentry is working:

```typescript
// In your browser console or test file
import * as Sentry from '@sentry/nextjs';

Sentry.captureMessage('Test message from Clinic CRM');
```

Check your Sentry dashboard to confirm the message was received.

## Production Checklist

Before deploying to production:

- [ ] Set `NEXT_PUBLIC_SENTRY_DSN` in production environment
- [ ] Set `NEXT_PUBLIC_SENTRY_ENVIRONMENT=production`
- [ ] Configure source map uploads with `SENTRY_AUTH_TOKEN`
- [ ] Verify PHI scrubbing is working
- [ ] Test error boundaries
- [ ] Set up Sentry alerts and notifications
- [ ] Configure Sentry performance monitoring thresholds

## Best Practices

1. **Never log PHI**: Avoid including patient data in error messages
2. **Use error boundaries**: Let errors bubble up to boundaries
3. **Add context carefully**: Only include non-identifying information
4. **Test in development**: Ensure errors are being captured correctly
5. **Monitor regularly**: Check Sentry dashboard for issues
6. **Set up alerts**: Configure notifications for critical errors

## Troubleshooting

### Errors not appearing in Sentry

1. Check that `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. Verify the DSN is from the correct Sentry project
3. Check browser console for Sentry initialization errors
4. Ensure you're not in development mode with Sentry disabled

### Too many errors being captured

1. Add errors to `ignoreErrors` in Sentry config files
2. Adjust sample rate in production
3. Use custom error filtering in `beforeSend` hook

### Source maps not uploading

1. Verify `SENTRY_AUTH_TOKEN` has correct permissions
2. Check that `SENTRY_ORG` and `SENTRY_PROJECT` match your Sentry setup
3. Ensure you're running a production build (`npm run build`)

## Support

For Sentry-specific issues:
- Sentry Documentation: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Sentry Support: https://sentry.io/support/

For HIPAA compliance questions:
- Review the PHI scrubbing code in `sentry.*.config.ts`
- Consult with your HIPAA compliance officer
