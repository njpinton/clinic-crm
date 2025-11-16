---
name: django-backend-guidelines
description: Comprehensive Django REST Framework backend development guide for Python/Django. Use when creating views, serializers, models, viewsets, permissions, or working with Django APIs, PostgreSQL database access, Django ORM, DRF serializers, authentication, HIPAA compliance, or async patterns. Covers layered architecture (URLs → ViewSets/Views → Services → Models), security best practices, error handling, performance monitoring, testing strategies, and HIPAA compliance requirements for healthcare data.
---

# Django Backend Development Guidelines

## Purpose

Establish consistency and best practices for the Clinic CRM backend using Django + Django REST Framework with HIPAA compliance and healthcare-specific security patterns.

## When to Use This Skill

Automatically activates when working on:
- Creating or modifying views, viewsets, API endpoints
- Building serializers, models, services
- Implementing permissions and authentication
- Database operations with Django ORM
- Error tracking with Sentry
- Input validation with DRF serializers
- HIPAA compliance requirements
- Backend testing and refactoring

---

## Quick Start

### New Backend Feature Checklist

- [ ] **URL Pattern**: Clean definition with proper routing
- [ ] **ViewSet/View**: Use appropriate class-based views
- [ ] **Serializer**: Validation and data transformation
- [ ] **Service**: Business logic layer (if complex)
- [ ] **Model**: Database schema with proper constraints
- [ ] **Permissions**: Role-based access control
- [ ] **Audit Logging**: Track all PHI access (HIPAA)
- [ ] **Tests**: Unit + integration tests
- [ ] **Sentry**: Error tracking configured
- [ ] **Documentation**: API docs with drf-spectacular

---

## Architecture Overview

### Layered Architecture

```
HTTP Request
    ↓
URLs (routing only)
    ↓
ViewSets/Views (request handling + serialization)
    ↓
Services (business logic) [Optional for complex operations]
    ↓
Models (data access via ORM)
    ↓
Database (PostgreSQL)
```

**Key Principle:** Each layer has ONE responsibility.

---

## Directory Structure

```
backend/
├── config/              # Django settings
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   └── urls.py
├── apps/
│   ├── patients/        # Patient management app
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services.py  # Business logic
│   │   ├── permissions.py
│   │   ├── urls.py
│   │   └── tests/
│   ├── doctors/         # Doctor management app
│   ├── appointments/    # Scheduling app
│   ├── clinical_notes/  # Notes app
│   ├── lab_results/     # Laboratory app
│   └── core/            # Shared utilities
│       ├── models.py    # Abstract base models
│       ├── permissions.py
│       ├── middleware.py
│       ├── utils.py
│       └── audit.py     # Audit logging
├── manage.py
└── requirements/
    ├── base.txt
    ├── development.txt
    └── production.txt
```

**Naming Conventions:**
- Models: `PascalCase` - `Patient`, `Appointment`
- Serializers: `PascalCase + Serializer` - `PatientSerializer`
- ViewSets: `PascalCase + ViewSet` - `PatientViewSet`
- Services: `PascalCase + Service` - `AppointmentService`
- URLs: `snake_case` - `patient_urls.py`

---

## Core Principles (10 Key Rules)

### 1. Use Class-Based Views (APIView, ViewSets)

```python
# ❌ NEVER: Function-based views for complex logic
@api_view(['POST'])
def create_patient(request):
    # 200 lines of logic
    pass

# ✅ ALWAYS: Use ViewSets for CRUD, APIView for custom
from rest_framework import viewsets

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated, CanAccessPatient]
```

### 2. Validate All Input with Serializers

```python
from rest_framework import serializers

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'first_name', 'last_name', 'date_of_birth', 'medical_record_number']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_date_of_birth(self, value):
        if value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future")
        return value
```

### 3. All Errors to Sentry

```python
import sentry_sdk

try:
    result = perform_operation()
except Exception as error:
    sentry_sdk.capture_exception(error)
    raise
```

### 4. Use settings, NEVER hardcoded values

```python
from django.conf import settings

# ❌ NEVER
timeout = 30
secret_key = "hardcoded-secret"

# ✅ ALWAYS
timeout = settings.API_TIMEOUT
secret_key = settings.SECRET_KEY
```

### 5. Implement Comprehensive Audit Logging (HIPAA)

```python
from apps.core.audit import log_phi_access

class PatientViewSet(viewsets.ModelViewSet):
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        log_phi_access(
            user=request.user,
            action='READ',
            resource_type='Patient',
            resource_id=instance.id,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return super().retrieve(request, *args, **kwargs)
```

### 6. Use Service Layer for Complex Business Logic

```python
# services.py
class AppointmentService:
    @staticmethod
    def book_appointment(patient, doctor, appointment_date):
        # Check for conflicts
        conflicts = Appointment.objects.filter(
            doctor=doctor,
            appointment_date=appointment_date,
            status__in=['scheduled', 'confirmed']
        ).exists()

        if conflicts:
            raise ValidationError("Doctor already has appointment at this time")

        # Create appointment
        appointment = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            appointment_date=appointment_date,
            status='scheduled'
        )

        # Send notification
        send_appointment_confirmation.delay(appointment.id)

        return appointment

# views.py
from .services import AppointmentService

class AppointmentViewSet(viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        appointment = AppointmentService.book_appointment(
            patient=serializer.validated_data['patient'],
            doctor=serializer.validated_data['doctor'],
            appointment_date=serializer.validated_data['appointment_date']
        )

        return Response(
            AppointmentSerializer(appointment).data,
            status=status.HTTP_201_CREATED
        )
```

### 7. Implement Role-Based Permissions

```python
from rest_framework import permissions

class CanAccessPatient(permissions.BasePermission):
    """
    Permission to check if user can access patient records.
    - Doctors can access their assigned patients
    - Admins can access all patients
    - Patients can only access their own records
    """
    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role == 'admin':
            return True

        if user.role == 'doctor':
            # Check if doctor is assigned to patient
            return obj.assigned_doctors.filter(id=user.doctor_profile.id).exists()

        if user.role == 'patient':
            return obj.user == user

        return False
```

### 8. Use Abstract Base Models

```python
# apps/core/models.py
from django.db import models
import uuid

class TimeStampedModel(models.Model):
    """Abstract base class with timestamps"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class SoftDeleteModel(models.Model):
    """Abstract base class for soft deletes (HIPAA requirement)"""
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

class UUIDModel(models.Model):
    """Abstract base class with UUID primary key"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True

# Usage
class Patient(UUIDModel, TimeStampedModel, SoftDeleteModel):
    medical_record_number = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    # ... other fields
```

### 9. Use Select/Prefetch Related for Performance

```python
# ❌ BAD: N+1 queries
patients = Patient.objects.all()
for patient in patients:
    print(patient.doctor.name)  # Queries database for each patient!

# ✅ GOOD: Single query with JOIN
patients = Patient.objects.select_related('assigned_doctor').all()
for patient in patients:
    print(patient.doctor.name)  # No extra queries

# For many-to-many or reverse foreign keys
appointments = Appointment.objects.prefetch_related(
    'patient',
    'doctor',
    'clinical_notes'
).all()
```

### 10. Comprehensive Testing Required

```python
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

class PatientAPITestCase(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='doctor'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_patient(self):
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'date_of_birth': '1990-01-01',
            'medical_record_number': 'MRN001'
        }
        response = self.client.post('/api/patients/', data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Patient.objects.count(), 1)
```

---

## Common Imports

```python
# Django Core
from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction

# Django REST Framework
from rest_framework import viewsets, status, serializers, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound

# Third Party
import sentry_sdk
from celery import shared_task

# Local
from apps.core.models import TimeStampedModel, SoftDeleteModel
from apps.core.permissions import IsDoctor, IsAdmin
from apps.core.audit import log_phi_access
```

---

## HIPAA Compliance Requirements

### 1. Audit Logging (MANDATORY)

```python
# apps/core/audit.py
from django.db import models

class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    action = models.CharField(max_length=20)  # CREATE, READ, UPDATE, DELETE
    resource_type = models.CharField(max_length=50)
    resource_id = models.UUIDField()
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['resource_type', 'resource_id']),
        ]

def log_phi_access(user, action, resource_type, resource_id, ip_address, **metadata):
    """Log all PHI access"""
    AuditLog.objects.create(
        user=user,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip_address,
        metadata=metadata
    )
```

### 2. Data Encryption

```python
from django.db import models
from django_cryptography.fields import encrypt

class Patient(models.Model):
    # Encrypt sensitive fields
    social_security_number = encrypt(models.CharField(max_length=11, blank=True))
    insurance_id = encrypt(models.CharField(max_length=50, blank=True))

    # Regular fields
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
```

### 3. Session Timeout

```python
# settings.py
SESSION_COOKIE_AGE = 900  # 15 minutes
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
```

### 4. Password Policies

```python
# settings.py
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]
```

---

## API Documentation

### Use drf-spectacular for OpenAPI/Swagger

```python
# settings.py
INSTALLED_APPS = [
    ...
    'drf_spectacular',
]

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Clinic CRM API',
    'DESCRIPTION': 'API for managing clinic operations',
    'VERSION': '1.0.0',
}

# urls.py
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

# views.py - Add docstrings
class PatientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing patients.

    list: Return a list of all patients
    retrieve: Return patient details
    create: Create a new patient
    update: Update patient information
    destroy: Soft delete a patient
    """
    queryset = Patient.objects.filter(is_deleted=False)
    serializer_class = PatientSerializer
```

---

## Performance Optimization

### 1. Database Indexing

```python
class Patient(models.Model):
    medical_record_number = models.CharField(max_length=50, unique=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['last_name', 'first_name']),
            models.Index(fields=['date_of_birth']),
        ]
```

### 2. Query Optimization

```python
# Use select_related for foreign keys
patients = Patient.objects.select_related('assigned_doctor').all()

# Use prefetch_related for many-to-many
appointments = Appointment.objects.prefetch_related('patient', 'doctor').all()

# Only fetch needed fields
patients = Patient.objects.values('id', 'first_name', 'last_name')

# Use bulk operations
Patient.objects.bulk_create([patient1, patient2, patient3])
```

### 3. Caching

```python
from django.core.cache import cache

def get_patient(patient_id):
    cache_key = f'patient_{patient_id}'
    patient = cache.get(cache_key)

    if patient is None:
        patient = Patient.objects.get(id=patient_id)
        cache.set(cache_key, patient, timeout=300)  # 5 minutes

    return patient
```

---

## Error Handling

### Custom Exception Handler

```python
# apps/core/exceptions.py
from rest_framework.views import exception_handler
from rest_framework.response import Response
import sentry_sdk

def custom_exception_handler(exc, context):
    # Call DRF's default handler first
    response = exception_handler(exc, context)

    # Capture to Sentry
    sentry_sdk.capture_exception(exc)

    if response is not None:
        response.data = {
            'error': {
                'message': str(exc),
                'detail': response.data
            }
        }

    return response

# settings.py
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler'
}
```

---

## Testing Patterns

### Model Tests

```python
from django.test import TestCase

class PatientModelTest(TestCase):
    def test_patient_creation(self):
        patient = Patient.objects.create(
            first_name='John',
            last_name='Doe',
            date_of_birth='1990-01-01',
            medical_record_number='MRN001'
        )
        self.assertEqual(str(patient), 'John Doe')
```

### API Tests

```python
from rest_framework.test import APITestCase

class PatientAPITest(APITestCase):
    def test_list_patients_requires_auth(self):
        response = self.client.get('/api/patients/')
        self.assertEqual(response.status_code, 401)

    def test_create_patient(self):
        self.client.force_authenticate(user=self.doctor_user)
        data = {...}
        response = self.client.post('/api/patients/', data)
        self.assertEqual(response.status_code, 201)
```

---

## Anti-Patterns to Avoid

❌ Business logic in serializers or views
❌ Direct database queries in templates
❌ Missing error handling
❌ No input validation
❌ Exposing sensitive data in API responses
❌ No audit logging for PHI access
❌ Using MD5/SHA1 for passwords
❌ Hardcoded secrets

---

## Related Skills

- **nextjs-frontend-guidelines** - Frontend patterns for clinic CRM
- **django-api-tester** - Testing Django REST APIs
- **sentry-django** - Sentry integration for Django

---

**Skill Status**: COMPLETE ✅
**Line Count**: < 500 ✅
**HIPAA Focused**: ✅
