"""
Comprehensive tests for appointment API endpoints.

Tests the availability checking and conflict detection endpoints.
"""
import pytest
from datetime import datetime, timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.appointments.models import Appointment


User = get_user_model()


@pytest.mark.django_db
class TestAppointmentAvailabilityEndpoints:
    """Test appointment availability checking API endpoints."""

    @pytest.fixture
    def client(self):
        """Create API client."""
        return APIClient()

    @pytest.fixture
    def user(self):
        """Create a test user."""
        return User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            role='admin'
        )

    @pytest.fixture
    def doctor(self, user):
        """Create a test doctor."""
        doctor_user = User.objects.create_user(
            email='doctor@test.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role='doctor'
        )
        return Doctor.objects.create(user=doctor_user)

    @pytest.fixture
    def patient(self):
        """Create a test patient."""
        return Patient.objects.create(
            first_name='Jane',
            last_name='Smith',
            date_of_birth='1990-01-15'
        )

    def test_availability_endpoint_requires_authentication(self, client):
        """Test that availability endpoint requires authentication."""
        tomorrow = timezone.now() + timedelta(days=1)
        response = client.get(
            '/api/appointments/availability/',
            {'date': tomorrow.strftime('%Y-%m-%d'), 'doctor_id': 'fake-uuid'}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_availability_endpoint_requires_doctor_id(self, client, user):
        """Test that availability endpoint requires doctor_id parameter."""
        client.force_authenticate(user=user)
        tomorrow = timezone.now() + timedelta(days=1)
        response = client.get(
            '/api/appointments/availability/',
            {'date': tomorrow.strftime('%Y-%m-%d')}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'doctor_id' in response.data['detail']

    def test_availability_endpoint_requires_date(self, client, user, doctor):
        """Test that availability endpoint requires date parameter."""
        client.force_authenticate(user=user)
        response = client.get(
            '/api/appointments/availability/',
            {'doctor_id': str(doctor.id)}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'date' in response.data['detail']

    def test_availability_endpoint_invalid_date_format(self, client, user, doctor):
        """Test that availability endpoint validates date format."""
        client.force_authenticate(user=user)
        response = client.get(
            '/api/appointments/availability/',
            {'doctor_id': str(doctor.id), 'date': 'invalid-date'}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'YYYY-MM-DD' in response.data['detail']

    def test_availability_endpoint_doctor_not_found(self, client, user):
        """Test that availability endpoint returns 404 for non-existent doctor."""
        client.force_authenticate(user=user)
        tomorrow = timezone.now() + timedelta(days=1)
        response = client.get(
            '/api/appointments/availability/',
            {
                'doctor_id': '00000000-0000-0000-0000-000000000000',
                'date': tomorrow.strftime('%Y-%m-%d')
            }
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_availability_endpoint_returns_slots(self, client, user, doctor):
        """Test that availability endpoint returns available slots."""
        client.force_authenticate(user=user)
        tomorrow = timezone.now() + timedelta(days=1)
        response = client.get(
            '/api/appointments/availability/',
            {
                'doctor_id': str(doctor.id),
                'date': tomorrow.strftime('%Y-%m-%d')
            }
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'slots' in response.data
        assert 'slots_count' in response.data
        assert isinstance(response.data['slots'], list)
        assert len(response.data['slots']) > 0

    def test_availability_endpoint_respects_duration(self, client, user, doctor):
        """Test that availability endpoint respects duration parameter."""
        client.force_authenticate(user=user)
        tomorrow = timezone.now() + timedelta(days=1)

        # Get slots for 30 minutes
        response_30 = client.get(
            '/api/appointments/availability/',
            {
                'doctor_id': str(doctor.id),
                'date': tomorrow.strftime('%Y-%m-%d'),
                'duration_minutes': 30
            }
        )

        # Get slots for 60 minutes
        response_60 = client.get(
            '/api/appointments/availability/',
            {
                'doctor_id': str(doctor.id),
                'date': tomorrow.strftime('%Y-%m-%d'),
                'duration_minutes': 60
            }
        )

        assert response_30.status_code == status.HTTP_200_OK
        assert response_60.status_code == status.HTTP_200_OK
        # 60-minute slots should be fewer or equal
        assert len(response_60.data['slots']) <= len(response_30.data['slots'])

    def test_availability_endpoint_excludes_occupied_slots(self, client, user, doctor, patient):
        """Test that availability endpoint excludes occupied slots."""
        client.force_authenticate(user=user)

        # Create an appointment at 10:00
        appointment_time = timezone.now().replace(
            hour=10, minute=0, second=0, microsecond=0
        ) + timedelta(days=1)

        Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            appointment_datetime=appointment_time,
            duration_minutes=30,
            appointment_type='consultation',
            reason='Test appointment'
        )

        # Get available slots
        response = client.get(
            '/api/appointments/availability/',
            {
                'doctor_id': str(doctor.id),
                'date': appointment_time.date().isoformat()
            }
        )

        assert response.status_code == status.HTTP_200_OK
        # The 10:00 slot should not be in available slots
        assert appointment_time.isoformat() not in response.data['slots']


@pytest.mark.django_db
class TestAppointmentConflictDetectionEndpoints:
    """Test appointment conflict detection API endpoints."""

    @pytest.fixture
    def client(self):
        """Create API client."""
        return APIClient()

    @pytest.fixture
    def user(self):
        """Create a test user."""
        return User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            role='admin'
        )

    @pytest.fixture
    def doctor(self, user):
        """Create a test doctor."""
        doctor_user = User.objects.create_user(
            email='doctor@test.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role='doctor'
        )
        return Doctor.objects.create(user=doctor_user)

    @pytest.fixture
    def patient(self):
        """Create a test patient."""
        return Patient.objects.create(
            first_name='Jane',
            last_name='Smith',
            date_of_birth='1990-01-15'
        )

    def test_check_conflict_requires_authentication(self, client):
        """Test that check_conflict endpoint requires authentication."""
        response = client.post(
            '/api/appointments/check_conflict/',
            {
                'doctor_id': 'fake-uuid',
                'appointment_datetime': timezone.now().isoformat()
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_check_conflict_requires_doctor_id(self, client, user):
        """Test that check_conflict endpoint requires doctor_id."""
        client.force_authenticate(user=user)
        response = client.post(
            '/api/appointments/check_conflict/',
            {'appointment_datetime': timezone.now().isoformat()}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'doctor_id' in response.data['detail']

    def test_check_conflict_requires_datetime(self, client, user, doctor):
        """Test that check_conflict endpoint requires appointment_datetime."""
        client.force_authenticate(user=user)
        response = client.post(
            '/api/appointments/check_conflict/',
            {'doctor_id': str(doctor.id)}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'appointment_datetime' in response.data['detail']

    def test_check_conflict_invalid_datetime_format(self, client, user, doctor):
        """Test that check_conflict validates datetime format."""
        client.force_authenticate(user=user)
        response = client.post(
            '/api/appointments/check_conflict/',
            {
                'doctor_id': str(doctor.id),
                'appointment_datetime': 'invalid-datetime'
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'ISO format' in response.data['detail']

    def test_check_conflict_doctor_not_found(self, client, user):
        """Test that check_conflict returns 404 for non-existent doctor."""
        client.force_authenticate(user=user)
        response = client.post(
            '/api/appointments/check_conflict/',
            {
                'doctor_id': '00000000-0000-0000-0000-000000000000',
                'appointment_datetime': (timezone.now() + timedelta(days=1)).isoformat()
            }
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_check_conflict_no_conflict(self, client, user, doctor):
        """Test that check_conflict returns false when no conflict exists."""
        client.force_authenticate(user=user)
        future_time = timezone.now() + timedelta(days=1, hours=2)
        response = client.post(
            '/api/appointments/check_conflict/',
            {
                'doctor_id': str(doctor.id),
                'appointment_datetime': future_time.isoformat(),
                'duration_minutes': 30
            }
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['has_conflict'] is False
        assert response.data['conflicting_appointments'] == []

    def test_check_conflict_detects_conflict(self, client, user, doctor, patient):
        """Test that check_conflict detects appointment conflicts."""
        client.force_authenticate(user=user)

        # Create an existing appointment
        existing_time = timezone.now() + timedelta(days=1, hours=2)
        Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            appointment_datetime=existing_time,
            duration_minutes=30,
            appointment_type='consultation',
            reason='Existing appointment'
        )

        # Try to create conflicting appointment at same time
        response = client.post(
            '/api/appointments/check_conflict/',
            {
                'doctor_id': str(doctor.id),
                'appointment_datetime': existing_time.isoformat(),
                'duration_minutes': 30
            }
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['has_conflict'] is True
        assert len(response.data['conflicting_appointments']) > 0

    def test_check_conflict_partial_overlap(self, client, user, doctor, patient):
        """Test that check_conflict detects partial overlaps."""
        client.force_authenticate(user=user)

        # Create existing appointment from 10:00-10:30
        existing_time = timezone.now() + timedelta(days=1, hours=2)
        Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            appointment_datetime=existing_time,
            duration_minutes=30,
            appointment_type='consultation',
            reason='Existing appointment'
        )

        # Try to create appointment at 10:15-10:45 (overlaps)
        overlapping_time = existing_time + timedelta(minutes=15)
        response = client.post(
            '/api/appointments/check_conflict/',
            {
                'doctor_id': str(doctor.id),
                'appointment_datetime': overlapping_time.isoformat(),
                'duration_minutes': 30
            }
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['has_conflict'] is True

    def test_check_conflict_adjacent_slots_no_conflict(self, client, user, doctor, patient):
        """Test that adjacent slots don't conflict."""
        client.force_authenticate(user=user)

        # Create existing appointment from 10:00-10:30
        existing_time = timezone.now() + timedelta(days=1, hours=2)
        Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            appointment_datetime=existing_time,
            duration_minutes=30,
            appointment_type='consultation',
            reason='Existing appointment'
        )

        # Try to create appointment at 10:30-11:00 (adjacent, not overlapping)
        adjacent_time = existing_time + timedelta(minutes=30)
        response = client.post(
            '/api/appointments/check_conflict/',
            {
                'doctor_id': str(doctor.id),
                'appointment_datetime': adjacent_time.isoformat(),
                'duration_minutes': 30
            }
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['has_conflict'] is False

    def test_check_conflict_default_duration(self, client, user, doctor):
        """Test that check_conflict uses default duration if not specified."""
        client.force_authenticate(user=user)
        future_time = timezone.now() + timedelta(days=1, hours=2)
        response = client.post(
            '/api/appointments/check_conflict/',
            {
                'doctor_id': str(doctor.id),
                'appointment_datetime': future_time.isoformat()
                # No duration_minutes specified
            }
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'has_conflict' in response.data

    def test_check_conflict_returns_conflicting_appointment_details(self, client, user, doctor, patient):
        """Test that conflicting appointments include patient and time details."""
        client.force_authenticate(user=user)

        # Create existing appointment
        existing_time = timezone.now() + timedelta(days=1, hours=2)
        Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            appointment_datetime=existing_time,
            duration_minutes=30,
            appointment_type='consultation',
            reason='Existing appointment'
        )

        # Check for conflict
        response = client.post(
            '/api/appointments/check_conflict/',
            {
                'doctor_id': str(doctor.id),
                'appointment_datetime': existing_time.isoformat(),
                'duration_minutes': 30
            }
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['conflicting_appointments']) == 1

        conflict = response.data['conflicting_appointments'][0]
        assert 'id' in conflict
        assert 'patient' in conflict
        assert 'appointment_datetime' in conflict
        assert 'duration_minutes' in conflict
        assert conflict['patient'] == patient.full_name
