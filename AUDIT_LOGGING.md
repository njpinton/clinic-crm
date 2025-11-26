# Audit Logging System - Change Tracking Documentation

## Overview

The Clinic CRM implements a comprehensive **Audit Logging** (also known as **Audit Trail**) system to track all changes and access to Protected Health Information (PHI). This system is HIPAA-compliant and provides a complete history of who accessed what data, when, and from where.

## What is Audit Logging?

**Audit Logging** is a security feature that automatically records all significant events in the system, including:
- Creating new records (CREATE)
- Viewing sensitive data (READ)
- Modifying existing records (UPDATE)
- Deleting records (DELETE)
- Listing/searching records (LIST)
- Exporting data (EXPORT)
- Printing records (PRINT)

This creates an immutable trail of all system activities for compliance, security, and troubleshooting purposes.

## Implementation Location

**File**: `backend/apps/core/audit.py`
**Model**: `backend/apps/core/models.py` (`AuditLog` model)

## Core Components

### 1. AuditLog Model

The `AuditLog` model stores every audited event with the following information:

```python
class AuditLog(UUIDModel, TimeStampedModel):
    # Who performed the action
    user = ForeignKey(User)
    user_email = CharField  # Stored separately for record retention
    user_role = CharField    # User's role at the time of access

    # What action was performed
    action = CharField(choices=ACTION_CHOICES)
    # Choices: CREATE, READ, UPDATE, DELETE, LIST, EXPORT, PRINT

    # What resource was accessed
    resource_type = CharField  # e.g., 'Patient', 'ClinicalNote'
    resource_id = CharField    # UUID of the specific record

    # Additional context
    details = TextField  # Human-readable description
    ip_address = GenericIPAddressField  # Client IP address
    user_agent = TextField  # Browser/client information
    request_method = CharField  # HTTP method (GET, POST, etc.)
    request_path = CharField  # API endpoint accessed
    query_params = TextField  # Query string parameters

    # Success/failure tracking
    was_successful = BooleanField(default=True)
    error_message = TextField(blank=True)

    # Timestamp (auto-generated, timezone-aware)
    created_at = DateTimeField(auto_now_add=True)
```

### 2. Helper Function: log_phi_access()

The `log_phi_access()` function is the main interface for creating audit log entries:

```python
from apps.core.audit import log_phi_access

log_phi_access(
    user=request.user,
    action='CREATE',  # or READ, UPDATE, DELETE, LIST, etc.
    resource_type='ClinicalNote',
    resource_id=note.id,
    request=request,
    details='Created new SOAP note for patient',
    was_successful=True,  # Optional, defaults to True
    error_message=''  # Optional, for failed operations
)
```

## Where Audit Logging is Implemented

### Clinical Notes (✓ Implemented)

**File**: `backend/apps/clinical_notes/views.py`

All clinical notes operations are audited:

```python
class ClinicalNoteViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        instance = serializer.save()
        log_phi_access(
            user=self.request.user,
            action='CREATE',
            resource_type='ClinicalNote',
            resource_id=instance.id,
            request=self.request,
            details=f'Created {instance.get_note_type_display()} note'
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        log_phi_access(
            user=request.user,
            action='READ',
            resource_type='ClinicalNote',
            resource_id=instance.id,
            request=request,
            details=f'Viewed clinical note'
        )
        return super().retrieve(request, *args, **kwargs)

    def perform_update(self, serializer):
        instance = serializer.save()
        log_phi_access(
            user=self.request.user,
            action='UPDATE',
            resource_type='ClinicalNote',
            resource_id=instance.id,
            request=self.request,
            details='Updated clinical note'
        )

    def perform_destroy(self, instance):
        log_phi_access(
            user=self.request.user,
            action='DELETE',
            resource_type='ClinicalNote',
            resource_id=instance.id,
            request=self.request,
            details='Soft-deleted clinical note'
        )
        super().perform_destroy(instance)

    def list(self, request, *args, **kwargs):
        log_phi_access(
            user=request.user,
            action='LIST',
            resource_type='ClinicalNote',
            resource_id=None,
            request=request,
            details=f'Listed clinical notes'
        )
        return super().list(request, *args, **kwargs)
```

### Patients (Recommended to Implement)

To add audit logging to patient operations, update `backend/apps/patients/views.py`:

```python
from apps.core.audit import log_phi_access

class PatientViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        instance = serializer.save()
        log_phi_access(
            user=self.request.user,
            action='CREATE',
            resource_type='Patient',
            resource_id=instance.id,
            request=self.request,
            details=f'Created patient: {instance.full_name}'
        )

    # Add similar logging to retrieve, update, destroy, list methods
```

## Querying Audit Logs

### View Recent Activity

```python
from apps.core.models import AuditLog

# Get all audit logs for a specific patient
patient_logs = AuditLog.objects.filter(
    resource_type='Patient',
    resource_id=patient_id
).order_by('-created_at')

# Get all actions by a specific user
user_logs = AuditLog.objects.filter(
    user=user
).order_by('-created_at')

# Get all failed operations
failed_ops = AuditLog.objects.filter(
    was_successful=False
).order_by('-created_at')

# Get all CREATE actions in the last 24 hours
from datetime import timedelta
from django.utils import timezone

recent_creates = AuditLog.objects.filter(
    action='CREATE',
    created_at__gte=timezone.now() - timedelta(days=1)
)
```

### Django Admin Interface

The AuditLog model is registered in Django Admin for easy viewing:

1. Navigate to `http://localhost:8000/admin/core/auditlog/`
2. Filter by user, action, resource type, date range
3. Search by details or IP address
4. Export logs for compliance reporting

## HIPAA Compliance Features

### 1. Immutable Records
- Audit logs cannot be modified after creation
- No delete permissions in Django Admin (read-only)
- Database constraints prevent updates

### 2. Complete Data Retention
- Stores user email and role separately (in case user is deleted)
- Captures IP address and user agent for forensics
- Timestamps are timezone-aware (Asia/Manila)

### 3. Soft Delete Pattern
- Records are marked as deleted, not actually removed
- Audit logs preserve record IDs even after "deletion"
- Supports compliance retention requirements

### 4. Access Control
- Only superusers can view audit logs
- Logged users cannot view or modify their own logs
- Segregation of duties principle

## Best Practices

### 1. Always Use log_phi_access()
```python
# ✓ Good
log_phi_access(user, 'CREATE', 'Patient', patient.id, request, 'Created patient')

# ✗ Bad
# Directly creating AuditLog objects (bypasses helper function)
```

### 2. Provide Meaningful Details
```python
# ✓ Good
details='Updated patient email from john@old.com to john@new.com'

# ✗ Bad
details='Updated patient'  # Too vague
```

### 3. Log Both Success and Failure
```python
try:
    patient = Patient.objects.get(id=patient_id)
    log_phi_access(user, 'READ', 'Patient', patient_id, request,
                   'Viewed patient record', was_successful=True)
except Patient.DoesNotExist:
    log_phi_access(user, 'READ', 'Patient', patient_id, request,
                   'Attempted to view non-existent patient',
                   was_successful=False,
                   error_message='Patient not found')
```

### 4. Use Appropriate Action Types
- **CREATE**: New record created
- **READ**: Viewed single record
- **UPDATE**: Modified existing record
- **DELETE**: Deleted/soft-deleted record
- **LIST**: Queried multiple records
- **EXPORT**: Downloaded/exported data
- **PRINT**: Printed records

## Timezone Handling

All audit log timestamps use **Asia/Manila** timezone (Philippine Standard Time):

```python
# In settings/base.py
TIME_ZONE = 'Asia/Manila'
USE_TZ = True  # Timezone-aware datetimes
```

- Stored as UTC in database
- Displayed as Manila time in admin interface
- No daylight saving time adjustments needed

## Monitoring and Alerts

### Suspicious Activity Patterns to Monitor

1. **High-volume access**: User accessing >100 records/hour
2. **After-hours access**: Access outside business hours
3. **Failed attempts**: Multiple failed READ attempts
4. **Bulk exports**: Large EXPORT operations
5. **Role mismatch**: Admin accessing patient data without justification

### Sample Query for Monitoring
```python
# Find users with excessive failed attempts
from django.db.models import Count

suspicious_users = AuditLog.objects.filter(
    was_successful=False,
    created_at__gte=timezone.now() - timedelta(hours=1)
).values('user').annotate(
    failure_count=Count('id')
).filter(failure_count__gt=10)
```

## Data Retention Policy

### HIPAA Requirements
- Audit logs must be retained for **6 years** from creation date
- Logs must be protected from unauthorized modification
- Logs must be backed up regularly

### Implementation
```python
# Script to archive old audit logs (run monthly)
from datetime import timedelta
from django.utils import timezone

cutoff_date = timezone.now() - timedelta(days=365*6)  # 6 years

# Export to secure archive before deletion
old_logs = AuditLog.objects.filter(created_at__lt=cutoff_date)
# ... export logic ...

# Only after secure backup
# old_logs.delete()  # Carefully consider if deletion is appropriate
```

## Summary

- **What it tracks**: All PHI access and modifications
- **Who can see it**: Superusers only
- **Where it's stored**: `core_auditlog` database table
- **How long**: 6 years minimum (HIPAA requirement)
- **Current status**: ✓ Implemented for Clinical Notes, ready for other models

## Next Steps

1. Add audit logging to Patient ViewSet
2. Add audit logging to Appointment ViewSet
3. Set up automated monitoring for suspicious patterns
4. Configure log archival and backup procedures
5. Create compliance reports for auditors

---

**Last Updated**: November 26, 2025
**Timezone**: Asia/Manila (PST)
**Compliance**: HIPAA-compliant audit trail system
