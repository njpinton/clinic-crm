"""
Comprehensive tests for appointment services.

Tests appointment availability checking, conflict detection, and validation.
"""
import pytest
from datetime import datetime, timedelta, time
from django.utils import timezone
from django.contrib.auth import get_user_model

from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.appointments.models import Appointment
from apps.appointments.services import (
    AppointmentAvailabilityService,
    AppointmentValidationService,
)


User = get_user_model()


@pytest.mark.django_db
class TestAppointmentAvailabilityService:
    """Test appointment availability checking logic."""

    @pytest.fixture
    def doctor(self):
        """Create a test doctor."""
        user = User.objects.create_user(
            email='doctor@test.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role='doctor'
        )
        return Doctor.objects.create(user=user)

    @pytest.fixture
    def patient(self):
        """Create a test patient."""
        return Patient.objects.create(
            first_name='Jane',
            last_name='Smith',
            date_of_birth='1990-01-15'
        )

    def test_get_available_slots_returns_slots(self, doctor):
        """Test that get_available_slots returns time slots."""
        service = AppointmentAvailabilityService()
        tomorrow = timezone.now() + timedelta(days=1)

        slots = service.get_available_slots(doctor, tomorrow.date())

        assert slots is not None
        assert len(slots) > 0
        assert all(isinstance(slot, datetime) for slot in slots)

    def test_get_available_slots_excludes_existing_appointments(self, doctor, patient):
        """Test that occupied slots are excluded from availability."""
        # Create an appointment
        appointment_time = timezone.now().replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1)
        Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            appointment_datetime=appointment_time,
            duration_minutes=30,
            appointment_type='consultation',
            reason='Test appointment'
        )

        service = AppointmentAvailabilityService()
        slots = service.get_available_slots(doctor, appointment_time.date())

        # The specific time should not be in available slots
        assert appointment_time not in slots

    def test_is_slot_available_returns_true_for_free_slot(self, doctor):
        """Test that free slots are marked as available."""
        service = AppointmentAvailabilityService()
        future_time = timezone.now() + timedelta(days=1, hours=2)

        is_available = service.is_slot_available(doctor, future_time)

        assert is_available is True

    def test_is_slot_available_returns_false_for_occupied_slot(self, doctor, patient):
        """Test that occupied slots are marked as unavailable."""
        appointment_time = timezone.now() + timedelta(days=1, hours=2)
        Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            appointment_datetime=appointment_time,
            duration_minutes=30,
            appointment_type='consultation',
            reason='Test appointment'
        )

        service = AppointmentAvailabilityService()
        is_available = service.is_slot_available(doctor, appointment_time)

        assert is_available is False

    def test_is_slot_available_returns_false_for_past_time(self, doctor):
        """Test that past times are marked as unavailable."""
        service = AppointmentAvailabilityService()
        past_time = timezone.now() - timedelta(hours=1)

        is_available = service.is_slot_available(doctor, past_time)

        assert is_available is False

    def test_check_overlap_detects_conflicts(self, doctor, patient):
        """Test that overlapping appointments are detected."""
        appointment_time = timezone.now() + timedelta(days=1, hours=2)
        Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            appointment_datetime=appointment_time,
            duration_minutes=30,
            appointment_type='consultation',
            reason='Test appointment'
        )

        service = AppointmentAvailabilityService()

        # Check slot 10 minutes after start (should overlap)
        overlapping_time = appointment_time + timedelta(minutes=10)
        assert service.has_conflict(doctor, overlapping_time, duration_minutes=30) is True

    def test_check_overlap_no_conflict_for_adjacent_slots(self, doctor, patient):
        """Test that adjacent (non-overlapping) slots don't conflict."""
        appointment_time = timezone.now() + timedelta(days=1, hours=2)
        Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            appointment_datetime=appointment_time,
            duration_minutes=30,
            appointment_type='consultation',
            reason='Test appointment'
        )

        service = AppointmentAvailabilityService()

        # Check slot right after (should not overlap)
        next_slot = appointment_time + timedelta(minutes=30)
        assert service.has_conflict(doctor, next_slot, duration_minutes=30) is False

    def test_get_available_slots_respects_duration(self, doctor):
        """Test that slots account for appointment duration."""
        service = AppointmentAvailabilityService()
        tomorrow = timezone.now() + timedelta(days=1)

        slots_30min = service.get_available_slots(doctor, tomorrow.date(), duration_minutes=30)
        slots_60min = service.get_available_slots(doctor, tomorrow.date(), duration_minutes=60)

        # 60-minute slots should be fewer or equal to 30-minute slots
        assert len(slots_60min) <= len(slots_30min)


@pytest.mark.django_db
class TestAppointmentValidationService:
    """Test appointment validation logic."""

    @pytest.fixture
    def doctor(self):
        """Create a test doctor."""
        user = User.objects.create_user(
            email='doctor@test.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role='doctor'
        )
        return Doctor.objects.create(user=user)

    @pytest.fixture
    def patient(self):
        """Create a test patient."""
        return Patient.objects.create(
            first_name='Jane',
            last_name='Smith',
            date_of_birth='1990-01-15'
        )

    def test_validate_appointment_data_valid(self, doctor, patient):
        """Test validation with valid appointment data."""
        service = AppointmentValidationService()
        appointment_time = timezone.now() + timedelta(days=1, hours=2)

        errors = service.validate_appointment_data(
            patient_id=patient.id,
            doctor_id=doctor.id,
            appointment_datetime=appointment_time,
            appointment_type='consultation',
            reason='Checkup',
            duration_minutes=30
        )

        assert len(errors) == 0

    def test_validate_appointment_data_missing_patient(self, doctor):
        """Test validation fails with non-existent patient."""
        service = AppointmentValidationService()
        appointment_time = timezone.now() + timedelta(days=1, hours=2)

        errors = service.validate_appointment_data(
            patient_id='00000000-0000-0000-0000-000000000000',
            doctor_id=doctor.id,
            appointment_datetime=appointment_time,
            appointment_type='consultation',
            reason='Checkup',
            duration_minutes=30
        )

        assert len(errors) > 0
        assert any('patient' in str(e).lower() for e in errors)

    def test_validate_appointment_data_missing_doctor(self, patient):
        """Test validation fails with non-existent doctor."""
        service = AppointmentValidationService()
        appointment_time = timezone.now() + timedelta(days=1, hours=2)

        errors = service.validate_appointment_data(
            patient_id=patient.id,
            doctor_id='00000000-0000-0000-0000-000000000000',
            appointment_datetime=appointment_time,
            appointment_type='consultation',
            reason='Checkup',
            duration_minutes=30
        )

        assert len(errors) > 0
        assert any('doctor' in str(e).lower() for e in errors)

    def test_validate_appointment_data_past_datetime(self, doctor, patient):
        """Test validation fails with past appointment time."""
        service = AppointmentValidationService()
        past_time = timezone.now() - timedelta(hours=1)

        errors = service.validate_appointment_data(
            patient_id=patient.id,
            doctor_id=doctor.id,
            appointment_datetime=past_time,
            appointment_type='consultation',
            reason='Checkup',
            duration_minutes=30
        )

        assert len(errors) > 0
        assert any('time' in str(e).lower() or 'past' in str(e).lower() for e in errors)

    def test_validate_appointment_data_invalid_type(self, doctor, patient):
        """Test validation with invalid appointment type."""
        service = AppointmentValidationService()
        appointment_time = timezone.now() + timedelta(days=1, hours=2)

        errors = service.validate_appointment_data(
            patient_id=patient.id,
            doctor_id=doctor.id,
            appointment_datetime=appointment_time,
            appointment_type='invalid_type',
            reason='Checkup',
            duration_minutes=30
        )

        assert len(errors) > 0
        assert any('type' in str(e).lower() for e in errors)

    def test_validate_appointment_data_invalid_duration(self, doctor, patient):
        """Test validation with invalid duration."""
        service = AppointmentValidationService()
        appointment_time = timezone.now() + timedelta(days=1, hours=2)

        errors = service.validate_appointment_data(
            patient_id=patient.id,
            doctor_id=doctor.id,
            appointment_datetime=appointment_time,
            appointment_type='consultation',
            reason='Checkup',
            duration_minutes=0  # Invalid
        )

        assert len(errors) > 0
        assert any('duration' in str(e).lower() for e in errors)

    def test_validate_appointment_data_missing_reason(self, doctor, patient):
        """Test validation fails with empty reason."""
        service = AppointmentValidationService()
        appointment_time = timezone.now() + timedelta(days=1, hours=2)

        errors = service.validate_appointment_data(
            patient_id=patient.id,
            doctor_id=doctor.id,
            appointment_datetime=appointment_time,
            appointment_type='consultation',
            reason='',  # Empty reason
            duration_minutes=30
        )

        assert len(errors) > 0
        assert any('reason' in str(e).lower() for e in errors)
