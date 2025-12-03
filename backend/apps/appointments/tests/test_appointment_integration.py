"""
Comprehensive integration tests for the complete appointment booking flow.

Tests the end-to-end appointment creation workflow including:
- Appointment type selection
- Doctor selection
- Availability checking
- Conflict detection
- Appointment creation with validation
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
class TestAppointmentBookingFlow:
    """Test the complete appointment booking workflow."""

    @pytest.fixture
    def client(self):
        """Create API client."""
        return APIClient()

    @pytest.fixture
    def user(self):
        """Create a test user."""
        return User.objects.create_user(
            email='user@test.com',
            password='testpass123',
            first_name='John',
            last_name='User',
            role='staff'
        )

    @pytest.fixture
    def doctor(self):
        """Create a test doctor."""
        doctor_user = User.objects.create_user(
            email='doctor@test.com',
            password='testpass123',
            first_name='Jane',
            last_name='Doctor',
            role='doctor'
        )
        return Doctor.objects.create(
            user=doctor_user,
            specialization='General Practice'
        )

    @pytest.fixture
    def patient(self):
        """Create a test patient."""
        return Patient.objects.create(
            first_name='Bob',
            last_name='Patient',
            date_of_birth='1985-06-15'
        )

    def test_complete_appointment_booking_happy_path(self, client, user, doctor, patient):
        """Test complete workflow: availability → conflict check → creation."""
        client.force_authenticate(user=user)

        # Step 1: Check availability for a future date
        tomorrow = timezone.now() + timedelta(days=1)
        response = client.get(
            '/api/appointments/availability/',
            {
                'doctor_id': str(doctor.id),
                'date': tomorrow.strftime('%Y-%m-%d'),
                'duration_minutes': 30
            }
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'slots' in response.data
        assert len(response.data['slots']) > 0

        # Get a slot from available slots
        slot_datetime = response.data['slots'][0]

        # Step 2: Check for conflicts at this time
        response = client.post(
            '/api/appointments/check_conflict/',
            {
                'doctor_id': str(doctor.id),
                'appointment_datetime': slot_datetime,
                'duration_minutes': 30
            }
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['has_conflict'] is False
        assert response.data['conflicting_appointments'] == []

        # Step 3: Create the appointment
        response = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': str(doctor.id),
                'appointment_datetime': slot_datetime,
                'appointment_type': 'consultation',
                'duration_minutes': 30,
                'reason': 'General checkup'
            }
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['id']
        assert response.data['status'] == 'scheduled'

    def test_appointment_creation_with_all_fields(self, client, user, doctor, patient):
        """Test appointment creation with all optional fields."""
        client.force_authenticate(user=user)

        future_time = timezone.now() + timedelta(days=2, hours=2)
        response = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': str(doctor.id),
                'appointment_datetime': future_time.isoformat(),
                'appointment_type': 'follow_up',
                'duration_minutes': 45,
                'reason': 'Follow-up for blood pressure monitoring'
            }
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['appointment_type'] == 'follow_up'
        assert response.data['duration_minutes'] == 45
        assert response.data['reason'] == 'Follow-up for blood pressure monitoring'

    def test_appointment_creation_prevents_double_booking(self, client, user, doctor, patient):
        """Test that creating overlapping appointments is prevented."""
        client.force_authenticate(user=user)

        appointment_time = timezone.now() + timedelta(days=1, hours=2)

        # Create first appointment
        response1 = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': str(doctor.id),
                'appointment_datetime': appointment_time.isoformat(),
                'appointment_type': 'consultation',
                'duration_minutes': 30,
                'reason': 'First appointment'
            }
        )
        assert response1.status_code == status.HTTP_201_CREATED

        # Try to create overlapping appointment at same time
        response2 = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': str(doctor.id),
                'appointment_datetime': appointment_time.isoformat(),
                'appointment_type': 'consultation',
                'duration_minutes': 30,
                'reason': 'Second appointment'
            }
        )
        assert response2.status_code == status.HTTP_400_BAD_REQUEST
        assert 'conflict' in response2.data['detail'].lower()

    def test_availability_reflects_booked_appointments(self, client, user, doctor, patient):
        """Test that booked appointments are excluded from availability."""
        client.force_authenticate(user=user)

        appointment_time = timezone.now().replace(
            hour=10, minute=0, second=0, microsecond=0
        ) + timedelta(days=1)

        # Create an appointment
        Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            appointment_datetime=appointment_time,
            duration_minutes=30,
            appointment_type='consultation',
            reason='Test appointment'
        )

        # Check availability - the booked slot should not appear
        response = client.get(
            '/api/appointments/availability/',
            {
                'doctor_id': str(doctor.id),
                'date': appointment_time.date().isoformat()
            }
        )

        assert response.status_code == status.HTTP_200_OK
        assert appointment_time.isoformat() not in response.data['slots']

    def test_appointment_validation_missing_required_fields(self, client, user, doctor, patient):
        """Test that appointment creation validates all required fields."""
        client.force_authenticate(user=user)

        future_time = timezone.now() + timedelta(days=1, hours=2)

        # Missing patient_id
        response = client.post(
            '/api/appointments/',
            {
                'doctor_id': str(doctor.id),
                'appointment_datetime': future_time.isoformat(),
                'appointment_type': 'consultation',
                'duration_minutes': 30,
                'reason': 'Test'
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'patient_id' in str(response.data).lower()

        # Missing doctor_id
        response = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'appointment_datetime': future_time.isoformat(),
                'appointment_type': 'consultation',
                'duration_minutes': 30,
                'reason': 'Test'
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'doctor_id' in str(response.data).lower()

        # Missing appointment_datetime
        response = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': str(doctor.id),
                'appointment_type': 'consultation',
                'duration_minutes': 30,
                'reason': 'Test'
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'appointment_datetime' in str(response.data).lower()

    def test_appointment_validation_invalid_doctor(self, client, user, patient):
        """Test appointment creation fails with non-existent doctor."""
        client.force_authenticate(user=user)

        future_time = timezone.now() + timedelta(days=1, hours=2)
        response = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': '00000000-0000-0000-0000-000000000000',
                'appointment_datetime': future_time.isoformat(),
                'appointment_type': 'consultation',
                'duration_minutes': 30,
                'reason': 'Test'
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'doctor' in response.data['detail'].lower()

    def test_appointment_validation_invalid_patient(self, client, user, doctor):
        """Test appointment creation fails with non-existent patient."""
        client.force_authenticate(user=user)

        future_time = timezone.now() + timedelta(days=1, hours=2)
        response = client.post(
            '/api/appointments/',
            {
                'patient_id': '00000000-0000-0000-0000-000000000000',
                'doctor_id': str(doctor.id),
                'appointment_datetime': future_time.isoformat(),
                'appointment_type': 'consultation',
                'duration_minutes': 30,
                'reason': 'Test'
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'patient' in response.data['detail'].lower()

    def test_appointment_validation_past_datetime(self, client, user, doctor, patient):
        """Test appointment creation fails with past datetime."""
        client.force_authenticate(user=user)

        past_time = timezone.now() - timedelta(hours=1)
        response = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': str(doctor.id),
                'appointment_datetime': past_time.isoformat(),
                'appointment_type': 'consultation',
                'duration_minutes': 30,
                'reason': 'Test'
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'past' in response.data['detail'].lower() or 'future' in response.data['detail'].lower()

    def test_appointment_validation_invalid_type(self, client, user, doctor, patient):
        """Test appointment creation fails with invalid appointment type."""
        client.force_authenticate(user=user)

        future_time = timezone.now() + timedelta(days=1, hours=2)
        response = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': str(doctor.id),
                'appointment_datetime': future_time.isoformat(),
                'appointment_type': 'invalid_type',
                'duration_minutes': 30,
                'reason': 'Test'
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'appointment_type' in response.data['detail'].lower() or 'type' in response.data['detail'].lower()

    def test_appointment_validation_invalid_duration(self, client, user, doctor, patient):
        """Test appointment creation with invalid duration values."""
        client.force_authenticate(user=user)

        future_time = timezone.now() + timedelta(days=1, hours=2)

        # Duration too short (less than 15 minutes)
        response = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': str(doctor.id),
                'appointment_datetime': future_time.isoformat(),
                'appointment_type': 'consultation',
                'duration_minutes': 5,
                'reason': 'Test'
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'duration' in response.data['detail'].lower()

        # Duration too long (more than 8 hours)
        response = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': str(doctor.id),
                'appointment_datetime': future_time.isoformat(),
                'appointment_type': 'procedure',
                'duration_minutes': 600,  # 10 hours
                'reason': 'Test'
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'duration' in response.data['detail'].lower()

    def test_appointment_validation_missing_reason(self, client, user, doctor, patient):
        """Test appointment creation with missing or empty reason."""
        client.force_authenticate(user=user)

        future_time = timezone.now() + timedelta(days=1, hours=2)

        # Missing reason field
        response = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': str(doctor.id),
                'appointment_datetime': future_time.isoformat(),
                'appointment_type': 'consultation',
                'duration_minutes': 30
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'reason' in response.data['detail'].lower()

        # Empty reason
        response = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': str(doctor.id),
                'appointment_datetime': future_time.isoformat(),
                'appointment_type': 'consultation',
                'duration_minutes': 30,
                'reason': '   '  # Whitespace only
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_appointment_retrieval_after_creation(self, client, user, doctor, patient):
        """Test that created appointments can be retrieved."""
        client.force_authenticate(user=user)

        future_time = timezone.now() + timedelta(days=1, hours=2)
        create_response = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': str(doctor.id),
                'appointment_datetime': future_time.isoformat(),
                'appointment_type': 'consultation',
                'duration_minutes': 30,
                'reason': 'Test checkup'
            }
        )
        assert create_response.status_code == status.HTTP_201_CREATED
        appointment_id = create_response.data['id']

        # Retrieve the appointment
        response = client.get(f'/api/appointments/{appointment_id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == appointment_id
        assert response.data['patient_id'] == str(patient.id)
        assert response.data['doctor_id'] == str(doctor.id)
        assert response.data['reason'] == 'Test checkup'

    def test_multiple_appointments_same_day_different_times(self, client, user, doctor, patient):
        """Test that multiple non-overlapping appointments can be created on same day."""
        client.force_authenticate(user=user)

        appointment_date = timezone.now() + timedelta(days=1)

        # Create first appointment at 10:00
        time1 = appointment_date.replace(hour=10, minute=0, second=0, microsecond=0)
        response1 = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': str(doctor.id),
                'appointment_datetime': time1.isoformat(),
                'appointment_type': 'consultation',
                'duration_minutes': 30,
                'reason': 'First appointment'
            }
        )
        assert response1.status_code == status.HTTP_201_CREATED

        # Create second appointment at 11:00 (30 minutes after first ends)
        time2 = appointment_date.replace(hour=11, minute=0, second=0, microsecond=0)
        response2 = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': str(doctor.id),
                'appointment_datetime': time2.isoformat(),
                'appointment_type': 'follow_up',
                'duration_minutes': 30,
                'reason': 'Second appointment'
            }
        )
        assert response2.status_code == status.HTTP_201_CREATED

    def test_appointment_creation_requires_authentication(self, client, doctor, patient):
        """Test that appointment creation requires authentication."""
        future_time = timezone.now() + timedelta(days=1, hours=2)
        response = client.post(
            '/api/appointments/',
            {
                'patient_id': str(patient.id),
                'doctor_id': str(doctor.id),
                'appointment_datetime': future_time.isoformat(),
                'appointment_type': 'consultation',
                'duration_minutes': 30,
                'reason': 'Test'
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_availability_with_various_durations(self, client, user, doctor):
        """Test that availability correctly reflects different appointment durations."""
        client.force_authenticate(user=user)

        tomorrow = timezone.now() + timedelta(days=1)

        # Get availability for 30-minute slots
        response_30 = client.get(
            '/api/appointments/availability/',
            {
                'doctor_id': str(doctor.id),
                'date': tomorrow.strftime('%Y-%m-%d'),
                'duration_minutes': 30
            }
        )
        assert response_30.status_code == status.HTTP_200_OK
        slots_30 = response_30.data['slots']

        # Get availability for 60-minute slots
        response_60 = client.get(
            '/api/appointments/availability/',
            {
                'doctor_id': str(doctor.id),
                'date': tomorrow.strftime('%Y-%m-%d'),
                'duration_minutes': 60
            }
        )
        assert response_60.status_code == status.HTTP_200_OK
        slots_60 = response_60.data['slots']

        # 60-minute slots should be fewer or equal to 30-minute slots
        assert len(slots_60) <= len(slots_30)
