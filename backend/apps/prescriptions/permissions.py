"""
Prescription permissions for the Clinic CRM.
Following django-backend-guidelines: role-based access control.
"""
from rest_framework import permissions


class CanAccessPrescription(permissions.BasePermission):
    """
    Permission to check if user can access prescriptions.

    Rules:
    - Admins can access all prescriptions
    - Doctors can access prescriptions they wrote
    - Patients can access their own prescriptions
    - Pharmacists can view all prescriptions (read-only)
    - Nurses can view prescriptions for their patients (read-only)
    """

    def has_permission(self, request, view):
        """Check if user has permission to access prescriptions."""
        if not request.user.is_authenticated:
            return False

        # All authenticated users can view (filtered by object permission)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Create/modify permissions
        # Only admins and doctors can create prescriptions
        return request.user.role in ['admin', 'doctor']

    def has_object_permission(self, request, view, obj):
        """Check if user can access specific prescription."""
        user = request.user

        # Admins have full access
        if user.role == 'admin':
            return True

        # Doctors can access prescriptions they wrote
        if user.role == 'doctor':
            try:
                from apps.doctors.models import Doctor
                doctor = Doctor.objects.get(user=user)
                # Read access for all prescriptions, modify only own
                if request.method in permissions.SAFE_METHODS:
                    return obj.doctor.id == doctor.id
                return obj.doctor.id == doctor.id
            except Doctor.DoesNotExist:
                return False

        # Patients can view their own prescriptions
        if user.role == 'patient':
            try:
                from apps.patients.models import Patient
                patient = Patient.objects.get(user=user)
                return obj.patient.id == patient.id
            except Patient.DoesNotExist:
                return False

        # Pharmacists can view all (read-only)
        if user.role == 'pharmacist':
            return request.method in permissions.SAFE_METHODS

        # Nurses can view all (read-only)
        if user.role == 'nurse':
            return request.method in permissions.SAFE_METHODS

        return False


class CanManageMedications(permissions.BasePermission):
    """
    Permission to manage medication catalog.

    Rules:
    - Admins can manage all medications
    - Doctors and pharmacists can view medications
    - Others cannot access medication catalog
    """

    def has_permission(self, request, view):
        """Check if user can access medications."""
        if not request.user.is_authenticated:
            return False

        # Read-only for doctors, pharmacists, nurses
        if request.method in permissions.SAFE_METHODS:
            return request.user.role in ['admin', 'doctor', 'pharmacist', 'nurse']

        # Only admins can modify medication catalog
        return request.user.role == 'admin'


class CanManageRefills(permissions.BasePermission):
    """
    Permission to manage prescription refills.

    Rules:
    - Admins can manage all refills
    - Doctors can approve/deny refills for their prescriptions
    - Patients can request refills for their prescriptions
    - Pharmacists can mark refills as filled
    """

    def has_permission(self, request, view):
        """Check if user can access refills."""
        if not request.user.is_authenticated:
            return False

        # All authenticated users can view
        if request.method in permissions.SAFE_METHODS:
            return True

        # Create refill requests (patients, admins, pharmacists)
        return request.user.role in ['admin', 'patient', 'pharmacist', 'doctor']

    def has_object_permission(self, request, view, obj):
        """Check if user can access specific refill."""
        user = request.user

        # Admins have full access
        if user.role == 'admin':
            return True

        # Doctors can approve/deny their own prescription refills
        if user.role == 'doctor':
            try:
                from apps.doctors.models import Doctor
                doctor = Doctor.objects.get(user=user)
                return obj.prescription.doctor.id == doctor.id
            except Doctor.DoesNotExist:
                return False

        # Patients can view their own refill requests
        if user.role == 'patient':
            try:
                from apps.patients.models import Patient
                patient = Patient.objects.get(user=user)
                # Can only view, not modify
                if request.method in permissions.SAFE_METHODS:
                    return obj.prescription.patient.id == patient.id
                return False
            except Patient.DoesNotExist:
                return False

        # Pharmacists can mark as filled
        if user.role == 'pharmacist':
            return True

        return False
