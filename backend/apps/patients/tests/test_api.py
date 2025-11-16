"""
API tests for Patient endpoints.
Tests CRUD operations, permissions, and audit logging.
"""
import pytest
from datetime import date
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.patients.models import Patient
from apps.core.audit import AuditLog

User = get_user_model()


@pytest.fixture
def api_client():
    """Create API client."""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Create admin user."""
    return User.objects.create_user(
        email='admin@example.com',
        password='testpass123',
        role='admin',
        is_staff=True,
    )


@pytest.fixture
def doctor_user(db):
    """Create doctor user."""
    return User.objects.create_user(
        email='doctor@example.com',
        password='testpass123',
        role='doctor',
    )


@pytest.fixture
def patient_user(db):
    """Create patient user."""
    return User.objects.create_user(
        email='patient@example.com',
        password='testpass123',
        role='patient',
    )


@pytest.fixture
def patient(db):
    """Create a test patient."""
    return Patient.objects.create(
        medical_record_number='MRN001',
        first_name='John',
        last_name='Doe',
        date_of_birth=date(1990, 1, 1),
        phone='+11234567890',
        email='john.doe@example.com',
    )


@pytest.mark.django_db
class TestPatientAPI:
    """Test cases for Patient API endpoints."""

    def test_list_patients_requires_authentication(self, api_client):
        """Test that listing patients requires authentication."""
        response = api_client.get('/api/patients/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_patients_as_admin(self, api_client, admin_user, patient):
        """Test listing patients as admin."""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/patients/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1

    def test_list_patients_as_doctor(self, api_client, doctor_user, patient):
        """Test listing patients as doctor."""
        api_client.force_authenticate(user=doctor_user)
        response = api_client.get('/api/patients/')

        assert response.status_code == status.HTTP_200_OK

    def test_create_patient(self, api_client, doctor_user):
        """Test creating a new patient."""
        api_client.force_authenticate(user=doctor_user)

        data = {
            'medical_record_number': 'MRN002',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'date_of_birth': '1985-05-15',
            'gender': 'F',
            'phone': '+11234567891',
            'email': 'jane.smith@example.com',
        }

        response = api_client.post('/api/patients/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['first_name'] == 'Jane'
        assert response.data['medical_record_number'] == 'MRN002'

        # Verify patient exists in database
        assert Patient.objects.filter(medical_record_number='MRN002').exists()

    def test_create_patient_validates_date_of_birth(self, api_client, doctor_user):
        """Test that date of birth cannot be in the future."""
        api_client.force_authenticate(user=doctor_user)

        data = {
            'medical_record_number': 'MRN003',
            'first_name': 'Future',
            'last_name': 'Baby',
            'date_of_birth': '2099-01-01',  # Future date
        }

        response = api_client.post('/api/patients/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'date_of_birth' in response.data

    def test_retrieve_patient(self, api_client, doctor_user, patient):
        """Test retrieving a specific patient."""
        api_client.force_authenticate(user=doctor_user)

        response = api_client.get(f'/api/patients/{patient.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == str(patient.id)
        assert response.data['medical_record_number'] == 'MRN001'

    def test_update_patient(self, api_client, doctor_user, patient):
        """Test updating a patient."""
        api_client.force_authenticate(user=doctor_user)

        data = {
            'medical_record_number': patient.medical_record_number,
            'first_name': 'Johnny',  # Changed
            'last_name': patient.last_name,
            'date_of_birth': str(patient.date_of_birth),
            'email': 'johnny.doe@example.com',  # Changed
        }

        response = api_client.put(f'/api/patients/{patient.id}/', data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Johnny'
        assert response.data['email'] == 'johnny.doe@example.com'

        # Verify database was updated
        patient.refresh_from_db()
        assert patient.first_name == 'Johnny'

    def test_partial_update_patient(self, api_client, doctor_user, patient):
        """Test partial update of a patient."""
        api_client.force_authenticate(user=doctor_user)

        data = {
            'phone': '+19876543210',
        }

        response = api_client.patch(f'/api/patients/{patient.id}/', data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['phone'] == '+19876543210'

        # Verify other fields unchanged
        patient.refresh_from_db()
        assert patient.first_name == 'John'  # Unchanged

    def test_delete_patient_soft_deletes(self, api_client, admin_user, patient):
        """Test that deleting a patient performs soft delete."""
        api_client.force_authenticate(user=admin_user)

        response = api_client.delete(f'/api/patients/{patient.id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Patient should not appear in default queryset
        assert not Patient.objects.filter(id=patient.id).exists()

        # But should exist in all_objects
        assert Patient.all_objects.filter(id=patient.id).exists()

        patient.refresh_from_db()
        assert patient.is_deleted is True

    def test_search_patients(self, api_client, doctor_user, patient):
        """Test searching for patients."""
        api_client.force_authenticate(user=doctor_user)

        # Create additional patient
        Patient.objects.create(
            medical_record_number='MRN002',
            first_name='Jane',
            last_name='Smith',
            date_of_birth=date(1985, 5, 15),
        )

        # Search by last name
        response = api_client.get('/api/patients/', {'search': 'Doe'})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['last_name'] == 'Doe'

    def test_audit_log_created_on_patient_access(self, api_client, doctor_user, patient):
        """Test that accessing patient creates audit log."""
        api_client.force_authenticate(user=doctor_user)

        initial_count = AuditLog.objects.count()

        response = api_client.get(f'/api/patients/{patient.id}/')

        assert response.status_code == status.HTTP_200_OK

        # Verify audit log was created
        assert AuditLog.objects.count() == initial_count + 1

        log = AuditLog.objects.latest('timestamp')
        assert log.action == 'READ'
        assert log.resource_type == 'Patient'
        assert log.resource_id == patient.id
        assert log.user == doctor_user
