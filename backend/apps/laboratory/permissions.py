"""
Laboratory permissions for the Clinic CRM.
"""
from rest_framework import permissions


class CanAccessLaboratory(permissions.BasePermission):
    """
    Permission for laboratory access.
    - Admins/Doctors: Full access
    - Lab Technicians: Full access to tests, orders, results
    - Nurses: Read-only access
    - Patients: View own lab results
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        # Create/modify permissions
        return request.user.role in ['admin', 'doctor', 'lab_tech']

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role in ['admin', 'doctor', 'lab_tech']:
            return True

        # Nurses can view
        if user.role == 'nurse':
            return request.method in permissions.SAFE_METHODS

        # Patients can view their own results
        if user.role == 'patient':
            try:
                from apps.patients.models import Patient
                patient = Patient.objects.get(user=user)
                if hasattr(obj, 'patient'):
                    return obj.patient.id == patient.id
                elif hasattr(obj, 'lab_order'):
                    return obj.lab_order.patient.id == patient.id
            except Patient.DoesNotExist:
                return False

        return False
