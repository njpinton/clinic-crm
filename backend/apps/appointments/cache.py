"""
Caching utilities for appointments.

Provides cache key generation and cache management for doctor schedules,
availability slots, and appointment data.
"""
from datetime import datetime, date, timedelta
from django.core.cache import cache
from typing import Any, Optional, List

from apps.doctors.models import Doctor
from apps.appointments.models import Appointment


class AppointmentCacheManager:
    """Manager for appointment-related cache operations."""

    # Cache key prefixes
    DOCTOR_SLOTS_KEY = 'appointments:doctor:{doctor_id}:slots:{date}'
    DOCTOR_SCHEDULE_KEY = 'appointments:doctor:{doctor_id}:schedule:{date}'
    DOCTOR_AVAILABILITY_KEY = 'appointments:doctor:{doctor_id}:availability:{date}'
    APPOINTMENT_DETAIL_KEY = 'appointments:detail:{appointment_id}'
    DOCTOR_APPOINTMENTS_KEY = 'appointments:doctor:{doctor_id}:list:{page}'

    # Cache TTLs (in seconds)
    SLOTS_TTL = 86400  # 24 hours - Doctor schedule doesn't change often
    AVAILABILITY_TTL = 3600  # 1 hour - Availability may change frequently
    DETAIL_TTL = 300  # 5 minutes - Appointment details
    LIST_TTL = 600  # 10 minutes - Appointment lists

    @staticmethod
    def get_slots_cache_key(doctor_id: str, date_obj: date) -> str:
        """Generate cache key for available appointment slots."""
        return AppointmentCacheManager.DOCTOR_SLOTS_KEY.format(
            doctor_id=doctor_id,
            date=date_obj.isoformat()
        )

    @staticmethod
    def get_schedule_cache_key(doctor_id: str, date_obj: date) -> str:
        """Generate cache key for doctor's schedule on a specific date."""
        return AppointmentCacheManager.DOCTOR_SCHEDULE_KEY.format(
            doctor_id=doctor_id,
            date=date_obj.isoformat()
        )

    @staticmethod
    def get_availability_cache_key(doctor_id: str, date_obj: date) -> str:
        """Generate cache key for doctor's availability."""
        return AppointmentCacheManager.DOCTOR_AVAILABILITY_KEY.format(
            doctor_id=doctor_id,
            date=date_obj.isoformat()
        )

    @staticmethod
    def get_detail_cache_key(appointment_id: str) -> str:
        """Generate cache key for appointment detail."""
        return AppointmentCacheManager.APPOINTMENT_DETAIL_KEY.format(
            appointment_id=appointment_id
        )

    @staticmethod
    def get_list_cache_key(doctor_id: str, page: int = 1) -> str:
        """Generate cache key for doctor's appointment list."""
        return AppointmentCacheManager.DOCTOR_APPOINTMENTS_KEY.format(
            doctor_id=doctor_id,
            page=page
        )

    @staticmethod
    def cache_available_slots(doctor_id: str, date_obj: date, slots: List[datetime]) -> None:
        """Cache available appointment slots for a doctor on a specific date."""
        key = AppointmentCacheManager.get_slots_cache_key(doctor_id, date_obj)
        cache.set(key, slots, AppointmentCacheManager.SLOTS_TTL)

    @staticmethod
    def get_cached_slots(doctor_id: str, date_obj: date) -> Optional[List[datetime]]:
        """Retrieve cached available slots for a doctor."""
        key = AppointmentCacheManager.get_slots_cache_key(doctor_id, date_obj)
        return cache.get(key)

    @staticmethod
    def invalidate_doctor_cache(doctor_id: str, date_obj: Optional[date] = None) -> None:
        """
        Invalidate doctor's schedule cache for a specific date or all dates.

        Args:
            doctor_id: Doctor UUID
            date_obj: Optional specific date to invalidate. If None, invalidates
                     the next 30 days of cache for this doctor.
        """
        if date_obj:
            # Invalidate specific date
            keys_to_delete = [
                AppointmentCacheManager.get_slots_cache_key(doctor_id, date_obj),
                AppointmentCacheManager.get_schedule_cache_key(doctor_id, date_obj),
                AppointmentCacheManager.get_availability_cache_key(doctor_id, date_obj),
            ]
            cache.delete_many(keys_to_delete)
        else:
            # Invalidate next 30 days (when appointment is created/modified without specific date)
            today = date.today()
            for i in range(30):
                current_date = today + timedelta(days=i)
                keys_to_delete = [
                    AppointmentCacheManager.get_slots_cache_key(doctor_id, current_date),
                    AppointmentCacheManager.get_schedule_cache_key(doctor_id, current_date),
                    AppointmentCacheManager.get_availability_cache_key(doctor_id, current_date),
                ]
                cache.delete_many(keys_to_delete)

    @staticmethod
    def invalidate_appointment_detail(appointment_id: str) -> None:
        """Invalidate cached appointment detail."""
        key = AppointmentCacheManager.get_detail_cache_key(appointment_id)
        cache.delete(key)

    @staticmethod
    def cache_appointment_detail(appointment_id: str, data: Any) -> None:
        """Cache appointment detail."""
        key = AppointmentCacheManager.get_detail_cache_key(appointment_id)
        cache.set(key, data, AppointmentCacheManager.DETAIL_TTL)

    @staticmethod
    def get_cached_appointment_detail(appointment_id: str) -> Optional[Any]:
        """Retrieve cached appointment detail."""
        key = AppointmentCacheManager.get_detail_cache_key(appointment_id)
        return cache.get(key)

    @staticmethod
    def clear_all_cache() -> None:
        """Clear all appointment-related cache (use with caution)."""
        cache.clear()


class CacheInvalidationHelper:
    """Helper for handling cache invalidation on appointment changes."""

    @staticmethod
    def on_appointment_created(appointment: Appointment) -> None:
        """Invalidate cache when a new appointment is created."""
        if appointment.doctor:
            AppointmentCacheManager.invalidate_doctor_cache(
                str(appointment.doctor.id),
                appointment.appointment_datetime.date()
            )

    @staticmethod
    def on_appointment_updated(appointment: Appointment) -> None:
        """Invalidate cache when an appointment is updated."""
        if appointment.doctor:
            AppointmentCacheManager.invalidate_doctor_cache(
                str(appointment.doctor.id),
                appointment.appointment_datetime.date()
            )
        AppointmentCacheManager.invalidate_appointment_detail(str(appointment.id))

    @staticmethod
    def on_appointment_deleted(appointment: Appointment) -> None:
        """Invalidate cache when an appointment is deleted (soft delete)."""
        if appointment.doctor:
            AppointmentCacheManager.invalidate_doctor_cache(
                str(appointment.doctor.id),
                appointment.appointment_datetime.date()
            )
        AppointmentCacheManager.invalidate_appointment_detail(str(appointment.id))

    @staticmethod
    def on_appointment_rescheduled(
        appointment: Appointment,
        old_datetime: datetime,
        new_datetime: datetime
    ) -> None:
        """Invalidate cache when an appointment is rescheduled."""
        if appointment.doctor:
            doctor_id = str(appointment.doctor.id)
            # Invalidate both old and new date
            AppointmentCacheManager.invalidate_doctor_cache(
                doctor_id,
                old_datetime.date()
            )
            AppointmentCacheManager.invalidate_doctor_cache(
                doctor_id,
                new_datetime.date()
            )
        AppointmentCacheManager.invalidate_appointment_detail(str(appointment.id))
