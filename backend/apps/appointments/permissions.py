"""
Appointment permissions for the Clinic CRM.
Following django-backend-guidelines: role-based access control.
"""
from rest_framework import permissions


class CanAccessAppointment(permissions.BasePermission):
    """
    Permission to check if user can access appointments.

    Rules:
    - Admins can access all appointments
    - Doctors can access their own appointments
    - Receptionists can access all appointments
    - Patients can access their own appointments
    - Nurses can view all appointments (read-only)
    """

    def has_permission(self, request, view):
        """Check if user has permission to access appointments."""
        if not request.user.is_authenticated:
            return False

        # All authenticated users can view appointments (filtered by has_object_permission)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Create/Update/Delete permissions
        # Admins and receptionists can create/modify appointments
        if request.user.role in ['admin', 'receptionist']:
            return True

        # Doctors can create appointments
        if request.user.role == 'doctor':
            return True

        # Patients can create their own appointments
        if request.user.role == 'patient':
            return True

        return False

    def has_object_permission(self, request, view, obj):
        """Check if user can access specific appointment."""
        user = request.user

        # Admins and receptionists have full access
        if user.role in ['admin', 'receptionist']:
            return True

        # Nurses can view all appointments (read-only)
        if user.role == 'nurse':
            return request.method in permissions.SAFE_METHODS

        # Doctors can access their own appointments
        if user.role == 'doctor':
            try:
                from apps.doctors.models import Doctor
                doctor = Doctor.objects.get(user=user)
                return obj.doctor.id == doctor.id
            except Doctor.DoesNotExist:
                return False

        # Patients can access their own appointments
        if user.role == 'patient':
            try:
                from apps.patients.models import Patient
                patient = Patient.objects.get(user=user)
                # Read access for own appointments
                if request.method in permissions.SAFE_METHODS:
                    return obj.patient.id == patient.id
                # Can only cancel or update own future appointments
                return obj.patient.id == patient.id and obj.is_upcoming
            except Patient.DoesNotExist:
                return False

        return False


class CanModifyAppointment(permissions.BasePermission):
    """
    Permission to check if user can modify appointments.

    Rules:
    - Admins and receptionists can modify all appointments
    - Doctors can modify their own appointments
    - Patients can cancel their own future appointments
    """

    def has_permission(self, request, view):
        """Check if user can modify appointments."""
        if not request.user.is_authenticated:
            return False

        # Read-only is checked by CanAccessAppointment
        if request.method in permissions.SAFE_METHODS:
            return True

        # Admins and receptionists can modify
        if request.user.role in ['admin', 'receptionist']:
            return True

        # Doctors can modify their appointments
        if request.user.role == 'doctor':
            return True

        # Patients can modify (cancel) their appointments
        if request.user.role == 'patient':
            return True

        return False

    def has_object_permission(self, request, view, obj):
        """Check if user can modify specific appointment."""
        user = request.user

        # Read-only is allowed (checked by CanAccessAppointment)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Admins and receptionists can modify all
        if user.role in ['admin', 'receptionist']:
            return True

        # Doctors can modify their own appointments
        if user.role == 'doctor':
            try:
                from apps.doctors.models import Doctor
                doctor = Doctor.objects.get(user=user)
                # Can only modify if not completed/cancelled
                if obj.status in ['completed', 'cancelled']:
                    return False
                return obj.doctor.id == doctor.id
            except Doctor.DoesNotExist:
                return False

        # Patients can only cancel their own future appointments
        if user.role == 'patient':
            try:
                from apps.patients.models import Patient
                patient = Patient.objects.get(user=user)
                # Can only cancel future appointments
                if obj.status in ['completed', 'cancelled', 'no_show']:
                    return False
                return obj.patient.id == patient.id and obj.is_upcoming
            except Patient.DoesNotExist:
                return False

        return False


class CanCheckInAppointment(permissions.BasePermission):
    """
    Permission to check in patients for appointments.

    Rules:
    - Admins, receptionists, nurses, and doctors can check in patients
    - Patients cannot check themselves in
    """

    def has_permission(self, request, view):
        """Check if user can check in appointments."""
        if not request.user.is_authenticated:
            return False

        # Only staff can check in patients
        return request.user.role in ['admin', 'receptionist', 'nurse', 'doctor']

    def has_object_permission(self, request, view, obj):
        """Check if user can check in specific appointment."""
        user = request.user

        # Only staff can check in
        if user.role not in ['admin', 'receptionist', 'nurse', 'doctor']:
            return False

        # Cannot check in if already checked in, completed, or cancelled
        if obj.status not in ['scheduled', 'confirmed']:
            return False

        # Cannot check in if appointment is too far in the future (e.g., > 1 hour)
        from django.utils import timezone
        from datetime import timedelta
        if obj.appointment_datetime > timezone.now() + timedelta(hours=1):
            return False

        return True


class CanCompleteAppointment(permissions.BasePermission):
    """
    Permission to complete appointments.

    Rules:
    - Only doctors can complete appointments
    - Only their own appointments
    """

    def has_permission(self, request, view):
        """Check if user can complete appointments."""
        if not request.user.is_authenticated:
            return False

        # Only doctors can complete appointments
        return request.user.role in ['admin', 'doctor']

    def has_object_permission(self, request, view, obj):
        """Check if user can complete specific appointment."""
        user = request.user

        # Admins can complete any appointment
        if user.role == 'admin':
            return True

        # Doctors can only complete their own appointments
        if user.role == 'doctor':
            try:
                from apps.doctors.models import Doctor
                doctor = Doctor.objects.get(user=user)

                # Must be checked in or in progress
                if obj.status not in ['checked_in', 'in_progress']:
                    return False

                return obj.doctor.id == doctor.id
            except Doctor.DoesNotExist:
                return False

        return False


class CanManageReminders(permissions.BasePermission):
    """
    Permission to manage appointment reminders.

    Rules:
    - Admins and receptionists can manage all reminders
    - Others cannot manage reminders
    """

    def has_permission(self, request, view):
        """Check if user can manage reminders."""
        if not request.user.is_authenticated:
            return False

        # Read-only for doctors and nurses
        if request.method in permissions.SAFE_METHODS:
            return request.user.role in ['admin', 'receptionist', 'doctor', 'nurse']

        # Only admins and receptionists can create/modify reminders
        return request.user.role in ['admin', 'receptionist']

    def has_object_permission(self, request, view, obj):
        """Check if user can manage specific reminder."""
        user = request.user

        # Admins and receptionists have full access
        if user.role in ['admin', 'receptionist']:
            return True

        # Doctors and nurses can view
        if user.role in ['doctor', 'nurse']:
            return request.method in permissions.SAFE_METHODS

        return False
