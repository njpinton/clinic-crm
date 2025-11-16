---
name: django-api-tester
description: Test Django REST Framework API endpoints with authentication. Use this skill when testing API routes, validating endpoint functionality, debugging authentication issues, testing CRUD operations, or verifying API responses. Includes patterns for using pytest, DRF's APIClient, JWT authentication testing, and database verification.
---

# Django API Tester Skill

## Purpose
This skill provides patterns for testing Django REST Framework API endpoints in the Clinic CRM with proper authentication and HIPAA-compliant audit logging verification.

## When to Use This Skill
- Testing new API endpoints
- Validating route functionality after changes
- Debugging authentication issues
- Testing POST/PUT/PATCH/DELETE operations
- Verifying request/response data
- Checking HIPAA audit logs

---

## Authentication Overview

The Clinic CRM uses:
- **JWT tokens** for API authentication
- **Token-based auth** (Authorization: Bearer <token>)
- **Session authentication** for browser clients
- **Role-based permissions** (admin, doctor, patient, employee)

---

## Testing Setup

### Install Testing Dependencies

```bash
# requirements/test.txt
pytest==7.4.0
pytest-django==4.5.2
pytest-cov==4.1.0
factory-boy==3.3.0
faker==19.2.0
```

### Configure pytest

```python
# pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings.test
python_files = tests.py test_*.py *_tests.py
addopts = --reuse-db --nomigrations

# conftest.py
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email='admin@example.com',
        password='testpass123',
        role='admin',
        is_staff=True,
    )

@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        email='doctor@example.com',
        password='testpass123',
        role='doctor',
    )

@pytest.fixture
def patient_user(db):
    return User.objects.create_user(
        email='patient@example.com',
        password='testpass123',
        role='patient',
    )

@pytest.fixture
def authenticated_client(api_client, doctor_user):
    api_client.force_authenticate(user=doctor_user)
    return api_client
```

---

## Testing Patterns

### Pattern 1: Test Unauthenticated Access

```python
# apps/patients/tests/test_api.py
import pytest
from django.urls import reverse

@pytest.mark.django_db
def test_list_patients_requires_auth(api_client):
    """Test that listing patients requires authentication"""
    url = reverse('patient-list')
    response = api_client.get(url)

    assert response.status_code == 401
```

### Pattern 2: Test Authenticated GET Request

```python
@pytest.mark.django_db
def test_list_patients(authenticated_client, patient_factory):
    """Test listing patients with authentication"""
    # Create test data
    patient_factory.create_batch(5)

    url = reverse('patient-list')
    response = authenticated_client.get(url)

    assert response.status_code == 200
    assert len(response.data['results']) == 5
```

### Pattern 3: Test POST Request (Create)

```python
@pytest.mark.django_db
def test_create_patient(authenticated_client):
    """Test creating a new patient"""
    url = reverse('patient-list')
    data = {
        'first_name': 'John',
        'last_name': 'Doe',
        'date_of_birth': '1990-01-01',
        'medical_record_number': 'MRN001',
    }

    response = authenticated_client.post(url, data, format='json')

    assert response.status_code == 201
    assert response.data['first_name'] == 'John'
    assert response.data['medical_record_number'] == 'MRN001'

    # Verify database
    from apps.patients.models import Patient
    assert Patient.objects.filter(medical_record_number='MRN001').exists()
```

### Pattern 4: Test PUT Request (Update)

```python
@pytest.mark.django_db
def test_update_patient(authenticated_client, patient):
    """Test updating a patient"""
    url = reverse('patient-detail', kwargs={'pk': patient.id})
    data = {
        'first_name': 'Jane',
        'last_name': patient.last_name,
        'date_of_birth': patient.date_of_birth,
        'medical_record_number': patient.medical_record_number,
    }

    response = authenticated_client.put(url, data, format='json')

    assert response.status_code == 200
    assert response.data['first_name'] == 'Jane'

    # Verify database
    patient.refresh_from_db()
    assert patient.first_name == 'Jane'
```

### Pattern 5: Test DELETE Request

```python
@pytest.mark.django_db
def test_delete_patient(authenticated_client, patient):
    """Test soft deleting a patient"""
    url = reverse('patient-detail', kwargs={'pk': patient.id})

    response = authenticated_client.delete(url)

    assert response.status_code == 204

    # Verify soft delete
    patient.refresh_from_db()
    assert patient.is_deleted is True
```

### Pattern 6: Test Validation Errors

```python
@pytest.mark.django_db
def test_create_patient_invalid_data(authenticated_client):
    """Test creating patient with invalid data"""
    url = reverse('patient-list')
    data = {
        'first_name': '',  # Empty - should fail
        'date_of_birth': 'invalid-date',  # Invalid format
    }

    response = authenticated_client.post(url, data, format='json')

    assert response.status_code == 400
    assert 'first_name' in response.data
    assert 'date_of_birth' in response.data
```

### Pattern 7: Test Permissions

```python
@pytest.mark.django_db
def test_patient_cannot_access_other_patients(api_client, patient_user, patient):
    """Test that patients can only access their own records"""
    api_client.force_authenticate(user=patient_user)

    url = reverse('patient-detail', kwargs={'pk': patient.id})
    response = api_client.get(url)

    assert response.status_code == 403
```

### Pattern 8: Test Audit Logging (HIPAA)

```python
@pytest.mark.django_db
def test_patient_access_creates_audit_log(authenticated_client, patient):
    """Test that accessing patient creates audit log"""
    from apps.core.models import AuditLog

    initial_count = AuditLog.objects.count()

    url = reverse('patient-detail', kwargs={'pk': patient.id})
    response = authenticated_client.get(url)

    assert response.status_code == 200

    # Verify audit log created
    assert AuditLog.objects.count() == initial_count + 1

    log = AuditLog.objects.latest('timestamp')
    assert log.action == 'READ'
    assert log.resource_type == 'Patient'
    assert log.resource_id == patient.id
```

---

## Factories for Test Data

### Using factory_boy

```python
# apps/patients/tests/factories.py
import factory
from faker import Faker
from apps.patients.models import Patient

fake = Faker()

class PatientFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Patient

    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    date_of_birth = factory.Faker('date_of_birth', minimum_age=18, maximum_age=90)
    medical_record_number = factory.Sequence(lambda n: f'MRN{n:06d}')
    phone = factory.Faker('phone_number')
    email = factory.Faker('email')

# Usage in tests
@pytest.fixture
def patient(db):
    return PatientFactory()

@pytest.fixture
def patient_factory(db):
    return PatientFactory
```

---

## Testing with Real HTTP Requests

### Using requests library (for integration tests)

```python
import requests
import pytest

BASE_URL = 'http://localhost:8000'

def get_auth_token():
    """Get JWT token for testing"""
    response = requests.post(f'{BASE_URL}/api/auth/login/', json={
        'email': 'doctor@example.com',
        'password': 'testpass123',
    })
    return response.json()['access']

@pytest.mark.integration
def test_create_patient_integration():
    """Integration test with real HTTP request"""
    token = get_auth_token()
    headers = {'Authorization': f'Bearer {token}'}

    data = {
        'first_name': 'John',
        'last_name': 'Doe',
        'date_of_birth': '1990-01-01',
        'medical_record_number': 'MRN001',
    }

    response = requests.post(
        f'{BASE_URL}/api/patients/',
        json=data,
        headers=headers
    )

    assert response.status_code == 201
    assert response.json()['first_name'] == 'John'
```

---

## Testing Checklist

Before testing an endpoint:

- [ ] Identify the endpoint URL pattern
- [ ] Determine required authentication
- [ ] Prepare test data (use factories)
- [ ] Test unauthenticated access (should return 401)
- [ ] Test with proper authentication
- [ ] Test all CRUD operations (GET, POST, PUT, DELETE)
- [ ] Test validation errors
- [ ] Test permission checks
- [ ] Verify database changes
- [ ] Check audit logs are created
- [ ] Test edge cases

---

## Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest apps/patients/tests/test_api.py

# Run specific test
pytest apps/patients/tests/test_api.py::test_create_patient

# Run with coverage
pytest --cov=apps --cov-report=html

# Run only integration tests
pytest -m integration

# Run tests in parallel
pytest -n auto
```

---

## Common Test Scenarios

### Test Appointment Scheduling

```python
@pytest.mark.django_db
def test_book_appointment(authenticated_client, patient, doctor):
    """Test booking an appointment"""
    url = reverse('appointment-list')
    data = {
        'patient': patient.id,
        'doctor': doctor.id,
        'appointment_date': '2025-12-01T10:00:00Z',
        'duration_minutes': 30,
        'appointment_type': 'consultation',
    }

    response = authenticated_client.post(url, data, format='json')

    assert response.status_code == 201
    assert response.data['status'] == 'scheduled'
```

### Test Conflict Detection

```python
@pytest.mark.django_db
def test_cannot_double_book_doctor(authenticated_client, patient, doctor, appointment):
    """Test that doctor cannot be double-booked"""
    url = reverse('appointment-list')
    data = {
        'patient': patient.id,
        'doctor': doctor.id,
        'appointment_date': appointment.appointment_date,  # Same time
        'duration_minutes': 30,
    }

    response = authenticated_client.post(url, data, format='json')

    assert response.status_code == 400
    assert 'conflict' in response.data['error'].lower()
```

### Test Clinical Notes

```python
@pytest.mark.django_db
def test_create_clinical_note(authenticated_client, patient, doctor):
    """Test creating a clinical note"""
    url = reverse('clinical-note-list')
    data = {
        'patient': patient.id,
        'doctor': doctor.id,
        'note_type': 'soap',
        'content': 'Subjective: Patient reports...',
    }

    response = authenticated_client.post(url, data, format='json')

    assert response.status_code == 201

    # Verify audit log
    from apps.core.models import AuditLog
    log = AuditLog.objects.latest('timestamp')
    assert log.action == 'CREATE'
    assert log.resource_type == 'ClinicalNote'
```

---

## Debugging Failed Tests

### 401 Unauthorized
- Check authentication is set up correctly
- Verify token is valid
- Check user has required permissions

### 403 Forbidden
- User lacks required role
- Permission check failing
- Object-level permissions not met

### 404 Not Found
- URL pattern incorrect
- Object doesn't exist in database
- Check URL reversing

### 400 Bad Request
- Validation error
- Missing required fields
- Invalid data format

---

## Related Skills

- **django-backend-guidelines** - Backend development patterns
- **sentry-django** - Error tracking integration

---

**Skill Status**: COMPLETE ✅
**Line Count**: < 500 ✅
