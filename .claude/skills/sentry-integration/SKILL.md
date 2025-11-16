---
name: sentry-integration
description: Add Sentry error tracking and performance monitoring to Django and Next.js applications. Use this skill when adding error handling, setting up Sentry, tracking exceptions, monitoring performance, or debugging production issues. ALL ERRORS MUST BE CAPTURED TO SENTRY - no exceptions. Covers Django integration, Next.js integration, custom error handling, performance monitoring, and HIPAA-compliant error tracking.
---

# Sentry Integration Skill

## Purpose
This skill enforces comprehensive Sentry error tracking and performance monitoring across the Clinic CRM Django backend and Next.js frontend.

## When to Use This Skill
- Setting up Sentry in Django or Next.js
- Adding error handling to code
- Capturing exceptions
- Tracking performance
- Monitoring API calls
- Debugging production issues
- Adding user context to errors

## 🚨 CRITICAL RULE

**ALL ERRORS MUST BE CAPTURED TO SENTRY** - No exceptions. Never use `print()` or `console.log()` alone for errors.

---

## Django Integration

### 1. Installation

```bash
pip install sentry-sdk[django]
```

### 2. Configuration

```python
# config/settings/base.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.environ.get('SENTRY_DSN'),
    environment=os.environ.get('ENVIRONMENT', 'development'),
    integrations=[
        DjangoIntegration(),
    ],
    traces_sample_rate=0.1,  # 10% of transactions
    send_default_pii=False,  # HIPAA: Don't send PII by default
    before_send=scrub_sensitive_data,  # Custom PII scrubbing
)

def scrub_sensitive_data(event, hint):
    """Remove sensitive data before sending to Sentry (HIPAA compliance)"""
    # Remove sensitive fields
    if 'request' in event:
        if 'data' in event['request']:
            sensitive_fields = [
                'password',
                'ssn',
                'social_security_number',
                'credit_card',
                'medical_record_number',
            ]
            for field in sensitive_fields:
                if field in event['request']['data']:
                    event['request']['data'][field] = '[Filtered]'

    return event
```

### 3. Error Capture in Views

```python
import sentry_sdk
from rest_framework import viewsets, status
from rest_framework.response import Response

class PatientViewSet(viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        try:
            # Your logic here
            patient = self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            # Log validation errors
            sentry_sdk.capture_exception(e)
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            # Log unexpected errors
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

### 4. Add Context to Errors

```python
import sentry_sdk

def process_patient_data(patient_id):
    try:
        # Add custom context
        sentry_sdk.set_context('patient', {
            'id': patient_id,
            'operation': 'process_data',
        })

        # Add user info
        sentry_sdk.set_user({
            'id': request.user.id,
            'email': request.user.email,
            'role': request.user.role,
        })

        # Add tags for filtering
        sentry_sdk.set_tag('resource_type', 'patient')
        sentry_sdk.set_tag('operation', 'data_processing')

        # Your logic
        result = perform_operation(patient_id)
        return result

    except Exception as e:
        sentry_sdk.capture_exception(e)
        raise
```

### 5. Performance Monitoring

```python
import sentry_sdk

def get_patient_with_appointments(patient_id):
    with sentry_sdk.start_transaction(op='patient.fetch', name='Get Patient with Appointments'):
        # Database query span
        with sentry_sdk.start_span(op='db.query', description='Fetch patient'):
            patient = Patient.objects.select_related('assigned_doctor').get(id=patient_id)

        # Another span
        with sentry_sdk.start_span(op='db.query', description='Fetch appointments'):
            appointments = patient.appointments.all()

        return patient, appointments
```

### 6. Celery Integration

```python
# config/celery.py
from celery import Celery
from celery.signals import task_failure
import sentry_sdk
from sentry_sdk.integrations.celery import CeleryIntegration

app = Celery('clinic_crm')

sentry_sdk.init(
    dsn=os.environ.get('SENTRY_DSN'),
    integrations=[CeleryIntegration()],
)

@task_failure.connect
def handle_task_failure(sender=None, task_id=None, exception=None, **kwargs):
    """Capture Celery task failures"""
    sentry_sdk.capture_exception(exception)
```

---

## Next.js Integration

### 1. Installation

```bash
npm install @sentry/nextjs
```

### 2. Configuration

```bash
# Run Sentry wizard
npx @sentry/wizard@latest -i nextjs
```

This creates:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

### 3. Client-Side Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    beforeSend(event) {
        // Scrub sensitive data (HIPAA)
        if (event.request?.data) {
            const sensitiveFields = ['password', 'ssn', 'medicalRecordNumber'];
            sensitiveFields.forEach(field => {
                if (event.request.data[field]) {
                    event.request.data[field] = '[Filtered]';
                }
            });
        }
        return event;
    },
});
```

### 4. Server-Side Configuration

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.ENVIRONMENT,
    tracesSampleRate: 0.1,
});
```

### 5. Error Capture in Components

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to Sentry
        Sentry.captureException(error);
    }, [error]);

    return (
        <div>
            <h2>Something went wrong!</h2>
            <button onClick={() => reset()}>Try again</button>
        </div>
    );
}
```

### 6. Add Context in Next.js

```typescript
import * as Sentry from '@sentry/nextjs';

export async function getPatient(id: string) {
    try {
        Sentry.setContext('patient', {
            id,
            operation: 'fetch',
        });

        Sentry.setTag('resource_type', 'patient');

        const response = await fetch(`/api/patients/${id}`);

        if (!response.ok) {
            throw new Error('Failed to fetch patient');
        }

        return await response.json();
    } catch (error) {
        Sentry.captureException(error);
        throw error;
    }
}
```

### 7. Performance Monitoring

```typescript
import * as Sentry from '@sentry/nextjs';

export async function fetchPatients() {
    const transaction = Sentry.startTransaction({
        op: 'http.request',
        name: 'Fetch Patients',
    });

    try {
        const span = transaction.startChild({
            op: 'http',
            description: 'GET /api/patients',
        });

        const response = await fetch('/api/patients');
        const data = await response.json();

        span.finish();
        return data;
    } finally {
        transaction.finish();
    }
}
```

### 8. Server Actions Error Handling

```typescript
'use server';

import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

export async function createPatient(formData: FormData) {
    try {
        const response = await fetch('http://localhost:8000/api/patients/', {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(formData)),
        });

        if (!response.ok) {
            throw new Error('Failed to create patient');
        }

        revalidatePath('/patients');
        return { success: true };
    } catch (error) {
        Sentry.captureException(error, {
            tags: {
                action: 'createPatient',
            },
        });
        return { success: false, error: error.message };
    }
}
```

---

## HIPAA-Compliant Error Tracking

### 1. Never Log PHI

```python
# ❌ BAD: Logs PHI
sentry_sdk.capture_message(f'Patient {patient.ssn} accessed')

# ✅ GOOD: Uses patient ID
sentry_sdk.capture_message('Patient accessed', extra={'patient_id': patient.id})
```

### 2. Scrub Sensitive Data

```python
def scrub_sensitive_data(event, hint):
    """Remove all PHI before sending to Sentry"""
    sensitive_patterns = [
        r'\d{3}-\d{2}-\d{4}',  # SSN pattern
        r'\d{16}',              # Credit card
        r'MRN\d+',              # Medical record numbers
    ]

    # Scrub event data
    if 'message' in event:
        for pattern in sensitive_patterns:
            event['message'] = re.sub(pattern, '[REDACTED]', event['message'])

    return event

sentry_sdk.init(before_send=scrub_sensitive_data)
```

### 3. Filter URLs with Sensitive Data

```python
# sentry configuration
sentry_sdk.init(
    ignore_errors=[
        'PermissionDenied',  # Don't log 403 errors
    ],
    before_send_transaction=lambda event, hint: (
        None if '/patients/' in event.get('request', {}).get('url', '')
        else event
    ),
)
```

---

## Error Levels

Use appropriate severity:

```python
# Info: General information
sentry_sdk.capture_message('User logged in', level='info')

# Warning: Recoverable issues
sentry_sdk.capture_message('API rate limit approaching', level='warning')

# Error: Operation failed
sentry_sdk.capture_exception(error, level='error')

# Fatal: System unusable
sentry_sdk.capture_exception(error, level='fatal')
```

---

## Common Patterns

### API Call with Error Tracking

```typescript
async function callAPI(endpoint: string, options: RequestInit) {
    const transaction = Sentry.startTransaction({
        op: 'http.client',
        name: `API ${options.method || 'GET'} ${endpoint}`,
    });

    try {
        const response = await fetch(endpoint, options);

        if (!response.ok) {
            const error = new Error(`API error: ${response.status}`);
            Sentry.captureException(error, {
                tags: {
                    endpoint,
                    status: response.status,
                },
            });
            throw error;
        }

        return await response.json();
    } finally {
        transaction.finish();
    }
}
```

### Form Submission with Error Tracking

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';

export function PatientForm() {
    const handleSubmit = async (data: PatientFormData) => {
        try {
            await createPatient(data);
        } catch (error) {
            Sentry.captureException(error, {
                tags: {
                    form: 'patient-create',
                },
                extra: {
                    fieldsFilled: Object.keys(data).length,
                },
            });
            // Show error to user
        }
    };
}
```

---

## Testing Sentry Integration

### Test Error Capture (Django)

```python
# Create test endpoint
from rest_framework.decorators import api_view

@api_view(['GET'])
def test_sentry(request):
    try:
        1 / 0
    except Exception as e:
        sentry_sdk.capture_exception(e)
        return Response({'message': 'Error sent to Sentry'})

# Visit endpoint and check Sentry dashboard
```

### Test Error Capture (Next.js)

```typescript
// Create test page
export default function TestSentry() {
    const triggerError = () => {
        try {
            throw new Error('Test error from Next.js');
        } catch (error) {
            Sentry.captureException(error);
        }
    };

    return <button onClick={triggerError}>Test Sentry</button>;
}
```

---

## Best Practices

✅ Capture all exceptions to Sentry
✅ Add meaningful context (user, operation, resource)
✅ Use appropriate error levels
✅ Scrub PHI before sending
✅ Set up performance monitoring
✅ Filter sensitive URLs
✅ Test error tracking in staging

❌ Never log PHI to Sentry
❌ Don't expose sensitive data in error messages
❌ Don't rely on console.log for production errors
❌ Don't ignore errors silently

---

## Related Skills

- **django-backend-guidelines** - Django error handling patterns
- **nextjs-frontend-guidelines** - Next.js error handling

---

**Skill Status**: COMPLETE ✅
**Line Count**: < 500 ✅
**HIPAA Compliant**: ✅
