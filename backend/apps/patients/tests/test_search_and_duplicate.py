"""
Tests for patient search and duplicate detection endpoints.

Tests:
- Patient search with various query types (name, MRN, phone, email, DOB)
- Duplicate detection with multi-criteria matching
- Confidence scoring
- Error handling
- Audit logging
"""

import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import datetime, timedelta

from apps.patients.models import Patient
from apps.core.models import AuditLog


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def authenticated_client(db):
    """Create authenticated API client"""
    from django.contrib.auth import get_user_model
    User = get_user_model()

    user = User.objects.create_user(
        email='doctor@test.com',
        password='testpass123',
        role='doctor',
    )

    client = APIClient()
    # Use JWT token authentication
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


@pytest.fixture
def test_patients(db):
    """Create test patients"""
    patients = []

    # Patient 1: John Doe - will be searched
    patients.append(Patient.objects.create(
        first_name='John',
        last_name='Doe',
        date_of_birth='1990-01-15',
        phone='09123456789',
        email='john@example.com',
    ))

    # Patient 2: Jane Smith
    patients.append(Patient.objects.create(
        first_name='Jane',
        last_name='Smith',
        date_of_birth='1985-06-20',
        phone='09987654321',
        email='jane@example.com',
    ))

    # Patient 3: John Smith (different first name)
    patients.append(Patient.objects.create(
        first_name='John',
        last_name='Smith',
        date_of_birth='1995-03-10',
        phone='09555555555',
        email='johnsmith@example.com',
    ))

    return patients


@pytest.mark.django_db
class TestPatientSearch:
    """Test patient search endpoint"""

    def test_search_requires_authentication(self, api_client, test_patients):
        """Test that search requires authentication"""
        url = reverse('patient-search')
        response = api_client.get(url, {'q': 'John'})

        assert response.status_code == 401

    def test_search_by_first_name(self, authenticated_client, test_patients):
        """Test searching by first name"""
        url = reverse('patient-search')
        response = authenticated_client.get(url, {'q': 'John'})

        assert response.status_code == 200
        results = response.data['results']
        assert len(results) == 2
        assert all(p['first_name'] == 'John' for p in results)

    def test_search_by_last_name(self, authenticated_client, test_patients):
        """Test searching by last name"""
        url = reverse('patient-search')
        response = authenticated_client.get(url, {'q': 'Doe'})

        assert response.status_code == 200
        results = response.data['results']
        assert len(results) == 1
        assert results[0]['last_name'] == 'Doe'

    def test_search_by_email(self, authenticated_client, test_patients):
        """Test searching by email"""
        url = reverse('patient-search')
        response = authenticated_client.get(url, {'q': 'john@example.com'})

        assert response.status_code == 200
        results = response.data['results']
        assert len(results) == 1
        assert results[0]['email'] == 'john@example.com'

    def test_search_by_phone(self, authenticated_client, test_patients):
        """Test searching by phone"""
        url = reverse('patient-search')
        response = authenticated_client.get(url, {'q': '09123456789'})

        assert response.status_code == 200
        results = response.data['results']
        assert len(results) == 1
        assert results[0]['phone'] == '09123456789'

    def test_search_by_mrn(self, authenticated_client, test_patients):
        """Test searching by medical record number"""
        patient = test_patients[0]
        url = reverse('patient-search')
        response = authenticated_client.get(url, {'q': patient.medical_record_number})

        assert response.status_code == 200
        results = response.data['results']
        assert len(results) == 1
        assert results[0]['medical_record_number'] == patient.medical_record_number

    def test_search_case_insensitive(self, authenticated_client, test_patients):
        """Test that search is case insensitive"""
        url = reverse('patient-search')
        response = authenticated_client.get(url, {'q': 'JOHN'})

        assert response.status_code == 200
        results = response.data['results']
        assert len(results) == 2

    def test_search_empty_query(self, authenticated_client, test_patients):
        """Test search with empty query returns no results"""
        url = reverse('patient-search')
        response = authenticated_client.get(url, {'q': ''})

        assert response.status_code == 200
        assert len(response.data['results']) == 0

    def test_search_no_results(self, authenticated_client, test_patients):
        """Test search with no matching results"""
        url = reverse('patient-search')
        response = authenticated_client.get(url, {'q': 'NonExistent'})

        assert response.status_code == 200
        assert len(response.data['results']) == 0

    def test_search_creates_audit_log(self, authenticated_client, test_patients):
        """Test that search creates audit log"""
        initial_count = AuditLog.objects.count()

        url = reverse('patient-search')
        response = authenticated_client.get(url, {'q': 'John'})

        assert response.status_code == 200

        # Verify audit log created
        assert AuditLog.objects.count() > initial_count
        log = AuditLog.objects.latest('created_at')
        assert log.action == 'LIST'
        assert log.resource_type == 'Patient'


@pytest.mark.django_db
class TestDuplicateDetection:
    """Test duplicate patient detection endpoint"""

    def test_duplicate_check_requires_authentication(self, api_client):
        """Test that duplicate check requires authentication"""
        url = reverse('patient-check-duplicate')
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'date_of_birth': '1990-01-15',
        }
        response = api_client.post(url, data, format='json')

        assert response.status_code == 401

    def test_duplicate_check_required_fields(self, authenticated_client):
        """Test duplicate check requires first_name, last_name, DOB"""
        url = reverse('patient-check-duplicate')

        # Missing last_name
        response = authenticated_client.post(url, {
            'first_name': 'John',
            'date_of_birth': '1990-01-15',
        }, format='json')

        assert response.status_code == 400
        assert 'last_name' in str(response.data).lower() or 'last name' in str(response.data).lower()

    def test_duplicate_check_no_duplicates(self, authenticated_client):
        """Test duplicate check when no duplicates exist"""
        url = reverse('patient-check-duplicate')
        data = {
            'first_name': 'NewPerson',
            'last_name': 'NoMatch',
            'date_of_birth': '1985-12-25',
        }

        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == 200
        assert response.data['duplicates_found'] is False
        assert len(response.data['potential_duplicates']) == 0

    def test_duplicate_check_exact_name_dob_match(self, authenticated_client, test_patients):
        """Test duplicate check finds exact name + DOB match with 95% confidence"""
        john = test_patients[0]

        url = reverse('patient-check-duplicate')
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'date_of_birth': '1990-01-15',
        }

        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == 200
        assert response.data['duplicates_found'] is True

        duplicates = response.data['potential_duplicates']
        assert len(duplicates) >= 1

        # Find the exact match
        exact_match = next((d for d in duplicates if d['match_type'] == 'exact_name_dob'), None)
        assert exact_match is not None
        assert exact_match['confidence'] == 95
        assert exact_match['full_name'] == 'John Doe'

    def test_duplicate_check_phone_match(self, authenticated_client, test_patients):
        """Test duplicate check finds phone number match with 80% confidence"""
        john = test_patients[0]

        url = reverse('patient-check-duplicate')
        data = {
            'first_name': 'Different',
            'last_name': 'Person',
            'date_of_birth': '2000-01-01',
            'phone': '09123456789',  # Same as John Doe
        }

        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == 200
        assert response.data['duplicates_found'] is True

        duplicates = response.data['potential_duplicates']
        assert any(d['match_type'] == 'phone_match' for d in duplicates)
        phone_match = next(d for d in duplicates if d['match_type'] == 'phone_match')
        assert phone_match['confidence'] == 80

    def test_duplicate_check_email_match(self, authenticated_client, test_patients):
        """Test duplicate check finds email match with 85% confidence"""
        john = test_patients[0]

        url = reverse('patient-check-duplicate')
        data = {
            'first_name': 'Different',
            'last_name': 'Person',
            'date_of_birth': '2000-01-01',
            'email': 'john@example.com',  # Same as John Doe
        }

        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == 200
        assert response.data['duplicates_found'] is True

        duplicates = response.data['potential_duplicates']
        assert any(d['match_type'] == 'email_match' for d in duplicates)
        email_match = next(d for d in duplicates if d['match_type'] == 'email_match')
        assert email_match['confidence'] == 85

    def test_duplicate_check_invalid_date_format(self, authenticated_client):
        """Test duplicate check with invalid date format"""
        url = reverse('patient-check-duplicate')
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'date_of_birth': 'invalid-date',
        }

        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == 400
        assert 'date' in response.data.get('error', '').lower() or 'date' in str(response.data).lower()

    def test_duplicate_check_age_validation(self, authenticated_client):
        """Test that patients must be 18+ years old"""
        url = reverse('patient-check-duplicate')

        # Create DOB for someone under 18
        under_18_dob = (datetime.now() - timedelta(days=365*17)).strftime('%Y-%m-%d')

        data = {
            'first_name': 'Young',
            'last_name': 'Person',
            'date_of_birth': under_18_dob,
        }

        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == 400
        assert '18' in response.data.get('error', '') or '18' in str(response.data)

    def test_duplicate_check_creates_audit_log(self, authenticated_client, test_patients):
        """Test that duplicate check creates audit log"""
        initial_count = AuditLog.objects.count()

        url = reverse('patient-check-duplicate')
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'date_of_birth': '1990-01-15',
        }

        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == 200

        # Verify audit log created
        assert AuditLog.objects.count() > initial_count
        log = AuditLog.objects.latest('created_at')
        assert log.action == 'READ'
        assert log.resource_type == 'Patient'

    def test_duplicate_check_multiple_matches(self, authenticated_client, test_patients):
        """Test duplicate check with phone and email matches"""
        # Create another patient with same email as test_patients[0]
        Patient.objects.create(
            first_name='Another',
            last_name='Doe',
            date_of_birth='1991-01-15',
            phone='09999999999',
            email='john@example.com',  # Same email as John Doe
        )

        url = reverse('patient-check-duplicate')
        data = {
            'first_name': 'Different',
            'last_name': 'Person',
            'date_of_birth': '2000-01-01',
            'phone': '09123456789',  # John Doe's phone
            'email': 'john@example.com',  # John Doe and Another Doe's email
        }

        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == 200
        assert response.data['duplicates_found'] is True

        # Should find multiple matches
        duplicates = response.data['potential_duplicates']
        assert len(duplicates) > 0

    def test_duplicate_check_result_format(self, authenticated_client, test_patients):
        """Test that duplicate check returns properly formatted results"""
        url = reverse('patient-check-duplicate')
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'date_of_birth': '1990-01-15',
        }

        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == 200

        # Check response structure
        assert 'duplicates_found' in response.data
        assert 'potential_duplicates' in response.data
        assert 'count' in response.data

        # Check duplicate result structure
        for duplicate in response.data['potential_duplicates']:
            assert 'id' in duplicate
            assert 'full_name' in duplicate
            assert 'date_of_birth' in duplicate
            assert 'medical_record_number' in duplicate
            assert 'phone' in duplicate
            assert 'email' in duplicate
            assert 'match_type' in duplicate
            assert 'confidence' in duplicate


@pytest.mark.django_db
class TestSearchAndDuplicateIntegration:
    """Integration tests for search and duplicate detection"""

    def test_search_then_create_workflow(self, authenticated_client):
        """Test complete workflow: search for patient, check duplicates, then create"""
        # Step 1: Search for non-existent patient
        url = reverse('patient-search')
        response = authenticated_client.get(url, {'q': 'NewPatient'})
        assert response.status_code == 200
        assert len(response.data['results']) == 0

        # Step 2: Check for duplicates before creation
        url = reverse('patient-check-duplicate')
        data = {
            'first_name': 'NewPatient',
            'last_name': 'TestCase',
            'date_of_birth': '1990-05-15',
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == 200
        assert response.data['duplicates_found'] is False

        # Step 3: Create the patient
        patient = Patient.objects.create(
            first_name='NewPatient',
            last_name='TestCase',
            date_of_birth='1990-05-15',
        )

        # Step 4: Verify can now search for them
        url = reverse('patient-search')
        response = authenticated_client.get(url, {'q': 'NewPatient'})
        assert response.status_code == 200
        assert len(response.data['results']) == 1

        # Step 5: Verify duplicate check finds them
        url = reverse('patient-check-duplicate')
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == 200
        assert response.data['duplicates_found'] is True
