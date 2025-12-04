"""
Appointment services for business logic.

Handles availability checking, conflict detection, and validation.
Implements atomic transactions to prevent race conditions and double-booking.
Uses PostgreSQL functions for efficient slot calculation.
"""
from datetime import datetime, time, timedelta
from django.utils import timezone
from django.db import transaction, IntegrityError, connection
from django.db.models import Q

from apps.appointments.models import Appointment
from apps.patients.models import Patient
from apps.doctors.models import Doctor


class AppointmentAvailabilityService:
    """Service for checking appointment availability and conflicts."""

    # Default working hours
    WORKING_START_HOUR = 9
    WORKING_END_HOUR = 17
    SLOT_DURATION_MINUTES = 30  # Default slot duration

    def get_available_slots(
        self,
        doctor: Doctor,
        date: datetime.date,
        duration_minutes: int = 30,
        start_hour: int = None,
        end_hour: int = None
    ) -> list:
        """
        Get available time slots for a doctor on a given date.

        Uses PostgreSQL function for efficient server-side calculation instead of Python loops.
        This dramatically improves performance for large availability queries.

        Args:
            doctor: Doctor instance
            date: Date to check availability for
            duration_minutes: Appointment duration in minutes
            start_hour: Start working hour (default: 9 AM)
            end_hour: End working hour (default: 5 PM)

        Returns:
            List of available datetime slots
        """
        start_hour = start_hour or self.WORKING_START_HOUR
        end_hour = end_hour or self.WORKING_END_HOUR

        try:
            # Call PostgreSQL function for efficient slot calculation
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT slot_time FROM get_available_slots(
                        %s, %s, %s, %s, %s
                    )
                    ORDER BY slot_time
                    """,
                    [
                        str(doctor.id),      # doctor_id (UUID)
                        date,                # date
                        duration_minutes,    # duration_minutes
                        start_hour,          # start_hour
                        end_hour,            # end_hour
                    ]
                )

                # Convert database results to datetime objects
                available_slots = [row[0] for row in cursor.fetchall()]
                return available_slots

        except Exception as e:
            # Fallback to Python implementation if PostgreSQL function fails
            # This ensures availability checks work even if the function is not available
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"PostgreSQL get_available_slots() failed: {e}. Falling back to Python implementation.")

            return self._get_available_slots_python(
                doctor, date, duration_minutes, start_hour, end_hour
            )

    def _get_available_slots_python(
        self,
        doctor: Doctor,
        date: datetime.date,
        duration_minutes: int,
        start_hour: int,
        end_hour: int
    ) -> list:
        """
        Python fallback implementation for getting available slots.

        Used when PostgreSQL function is unavailable or during early deployments
        before migrations have run.
        """
        available_slots = []
        current_hour = start_hour

        while current_hour < end_hour:
            for minute in range(0, 60, self.SLOT_DURATION_MINUTES):
                slot_time = timezone.make_aware(
                    datetime.combine(date, time(current_hour, minute))
                )

                # Skip past slots
                if slot_time <= timezone.now():
                    continue

                # Check if slot is available
                if self.is_slot_available(doctor, slot_time, duration_minutes):
                    available_slots.append(slot_time)

            current_hour += 1

        return available_slots

    def is_slot_available(
        self,
        doctor: Doctor,
        appointment_datetime: datetime,
        duration_minutes: int = 30
    ) -> bool:
        """
        Check if a specific time slot is available for a doctor.

        Args:
            doctor: Doctor instance
            appointment_datetime: Proposed appointment time
            duration_minutes: Appointment duration in minutes

        Returns:
            True if slot is available, False otherwise
        """
        # Check if time is in the past
        if appointment_datetime <= timezone.now():
            return False

        # Check for conflicts with existing appointments
        if self.has_conflict(doctor, appointment_datetime, duration_minutes):
            return False

        return True

    def has_conflict(
        self,
        doctor: Doctor,
        appointment_datetime: datetime,
        duration_minutes: int = 30
    ) -> bool:
        """
        Check if an appointment conflicts with existing appointments.

        Conflicts occur when appointment times overlap, accounting for duration.
        NOTE: This check is not atomic - use check_and_book_appointment() instead
        when creating new appointments to prevent race conditions.

        Args:
            doctor: Doctor instance
            appointment_datetime: Proposed appointment time
            duration_minutes: Appointment duration in minutes

        Returns:
            True if conflict exists, False otherwise
        """
        appointment_end = appointment_datetime + timedelta(minutes=duration_minutes)

        # Fetch all active appointments for this doctor
        existing_appointments = Appointment.objects.filter(
            doctor=doctor,
            deleted_at__isnull=True,  # Exclude soft-deleted appointments
            status__in=['scheduled', 'confirmed', 'checked_in', 'in_progress']
        ).values('appointment_datetime', 'duration_minutes')

        # Check for conflicts in Python
        # Overlap occurs when: existing_start < new_end AND existing_end > new_start
        for appointment in existing_appointments:
            existing_end = appointment['appointment_datetime'] + timedelta(
                minutes=appointment['duration_minutes']
            )
            if appointment['appointment_datetime'] < appointment_end and existing_end > appointment_datetime:
                return True

        return False

    @transaction.atomic
    def check_and_book_appointment(
        self,
        doctor: Doctor,
        appointment_datetime: datetime,
        duration_minutes: int = 30
    ) -> bool:
        """
        Atomically check for conflicts and lock if available.

        Uses SELECT FOR UPDATE to prevent race conditions and double-booking.
        This method must be called within a transaction when creating appointments.

        Args:
            doctor: Doctor instance
            appointment_datetime: Proposed appointment time
            duration_minutes: Appointment duration in minutes

        Returns:
            True if slot is available and locked, False if conflict exists

        Raises:
            IntegrityError if a unique constraint is violated
        """
        appointment_end = appointment_datetime + timedelta(minutes=duration_minutes)

        # Lock the appointment table for this doctor
        # SELECT FOR UPDATE prevents other transactions from modifying during check
        existing_appointments = list(Appointment.objects.select_for_update().filter(
            doctor=doctor,
            deleted_at__isnull=True,
            status__in=['scheduled', 'confirmed', 'checked_in', 'in_progress']
        ).values('appointment_datetime', 'duration_minutes'))

        # Check for conflicts within the lock
        for appointment in existing_appointments:
            existing_end = appointment['appointment_datetime'] + timedelta(
                minutes=appointment['duration_minutes']
            )
            if appointment['appointment_datetime'] < appointment_end and existing_end > appointment_datetime:
                # Conflict exists - transaction will be rolled back
                return False

        # No conflicts found - safe to proceed with creation
        # Lock will be held until transaction completes
        return True

    def get_conflicting_appointments(
        self,
        doctor: Doctor,
        appointment_datetime: datetime,
        duration_minutes: int = 30
    ) -> list:
        """
        Get appointments that conflict with a proposed appointment.

        Args:
            doctor: Doctor instance
            appointment_datetime: Proposed appointment time
            duration_minutes: Appointment duration in minutes

        Returns:
            List of conflicting Appointment instances
        """
        appointment_end = appointment_datetime + timedelta(minutes=duration_minutes)

        # Fetch all active appointments for this doctor
        existing_appointments = Appointment.objects.filter(
            doctor=doctor,
            deleted_at__isnull=True,
            status__in=['scheduled', 'confirmed', 'checked_in', 'in_progress']
        )

        # Filter for conflicts in Python
        # Overlap occurs when: existing_start < new_end AND existing_end > new_start
        conflicting = []
        for appointment in existing_appointments:
            existing_end = appointment.appointment_datetime + timedelta(
                minutes=appointment.duration_minutes
            )
            if appointment.appointment_datetime < appointment_end and existing_end > appointment_datetime:
                conflicting.append(appointment)

        return conflicting


class AppointmentValidationService:
    """Service for validating appointment data."""

    VALID_APPOINTMENT_TYPES = [
        'consultation', 'follow_up', 'procedure', 'lab_work',
        'vaccination', 'physical_exam', 'emergency', 'telemedicine'
    ]

    MIN_DURATION_MINUTES = 15
    MAX_DURATION_MINUTES = 480  # 8 hours

    def validate_appointment_data(
        self,
        patient_id: str,
        doctor_id: str,
        appointment_datetime: datetime,
        appointment_type: str,
        reason: str,
        duration_minutes: int = 30
    ) -> list:
        """
        Validate all required appointment data.

        Args:
            patient_id: Patient UUID
            doctor_id: Doctor UUID
            appointment_datetime: Proposed appointment time
            appointment_type: Type of appointment
            reason: Reason for appointment
            duration_minutes: Appointment duration

        Returns:
            List of validation error messages (empty if valid)
        """
        errors = []

        # Validate patient exists
        if not self._validate_patient_exists(patient_id):
            errors.append("Patient not found.")

        # Validate doctor exists
        if not self._validate_doctor_exists(doctor_id):
            errors.append("Doctor not found.")

        # Validate appointment datetime
        if not self._validate_datetime(appointment_datetime):
            errors.append("Appointment time cannot be in the past.")

        # Validate appointment type
        if not self._validate_appointment_type(appointment_type):
            errors.append(f"Invalid appointment type: {appointment_type}")

        # Validate reason
        if not self._validate_reason(reason):
            errors.append("Reason for appointment is required.")

        # Validate duration
        if not self._validate_duration(duration_minutes):
            errors.append(f"Duration must be between {self.MIN_DURATION_MINUTES} and {self.MAX_DURATION_MINUTES} minutes.")

        return errors

    def _validate_patient_exists(self, patient_id: str) -> bool:
        """Check if patient exists."""
        try:
            Patient.objects.get(id=patient_id)
            return True
        except (Patient.DoesNotExist, ValueError):
            return False

    def _validate_doctor_exists(self, doctor_id: str) -> bool:
        """Check if doctor exists."""
        try:
            Doctor.objects.get(id=doctor_id)
            return True
        except (Doctor.DoesNotExist, ValueError):
            return False

    def _validate_datetime(self, appointment_datetime: datetime) -> bool:
        """Check if appointment time is in the future."""
        return appointment_datetime > timezone.now()

    def _validate_appointment_type(self, appointment_type: str) -> bool:
        """Check if appointment type is valid."""
        return appointment_type in self.VALID_APPOINTMENT_TYPES

    def _validate_reason(self, reason: str) -> bool:
        """Check if reason is provided."""
        return bool(reason and reason.strip())

    def _validate_duration(self, duration_minutes: int) -> bool:
        """Check if duration is within valid range."""
        return self.MIN_DURATION_MINUTES <= duration_minutes <= self.MAX_DURATION_MINUTES
