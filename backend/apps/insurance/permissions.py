"""
Insurance permissions for the Clinic CRM.
"""
from rest_framework import permissions


class CanAccessInsurance(permissions.BasePermission):
    """
    Permission for insurance access.
    - Admins/Receptionists: Full access
    - Patients: View own insurance
    - Doctors/Nurses: View patient insurance (read-only)
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        # Only admins and receptionists can create/modify
        return request.user.role in ['admin', 'receptionist']

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role in ['admin', 'receptionist']:
            return True

        # Doctors and nurses can view
        if user.role in ['doctor', 'nurse']:
            return request.method in permissions.SAFE_METHODS

        # Patients can view their own insurance
        if user.role == 'patient':
            try:
                from apps.patients.models import Patient
                patient = Patient.objects.get(user=user)
                if hasattr(obj, 'patient'):
                    return obj.patient.id == patient.id
            except Patient.DoesNotExist:
                return False

        return False
