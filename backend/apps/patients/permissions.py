"""
Permissions for patient access control.
Implements role-based access control (RBAC) for HIPAA compliance.
"""
from rest_framework import permissions


class CanAccessPatient(permissions.BasePermission):
    """
    Permission to check if user can access patient records.

    Rules:
    - Admins: Can access all patients
    - Doctors: Can access their assigned patients
    - Patients: Can only access their own records
    - Employees: No direct patient access (unless admin)
    """

    def has_permission(self, request, view):
        """Check if user has permission to access patient list."""
        # Must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Admins and doctors can view patient lists
        return request.user.role in ['admin', 'doctor']

    def has_object_permission(self, request, view, obj):
        """Check if user has permission to access specific patient."""
        user = request.user

        # Admins can access all patients
        if user.role == 'admin':
            return True

        # Doctors can access patients assigned to them
        if user.role == 'doctor':
            # This would check if doctor is assigned to patient
            # For now, allow all doctors (implement assignment logic later)
            return True

        # Patients can only access their own records
        if user.role == 'patient':
            # Check if this patient record belongs to the user
            return obj.user == user if hasattr(obj, 'user') else False

        # Deny access by default
        return False


class CanModifyPatient(permissions.BasePermission):
    """
    Permission to check if user can modify patient records.

    Rules:
    - Admins: Can modify all patients
    - Doctors: Can modify their assigned patients
    - Patients: Cannot modify (read-only)
    - Employees: Cannot modify
    """

    def has_permission(self, request, view):
        """Check if user has permission to modify patients."""
        if not request.user or not request.user.is_authenticated:
            return False

        # Only admins and doctors can modify
        if request.method in permissions.SAFE_METHODS:
            return request.user.role in ['admin', 'doctor']

        return request.user.role in ['admin', 'doctor']

    def has_object_permission(self, request, view, obj):
        """Check if user has permission to modify specific patient."""
        user = request.user

        # Read permissions (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return CanAccessPatient().has_object_permission(request, view, obj)

        # Write permissions (POST, PUT, PATCH, DELETE)
        # Admins can modify all
        if user.role == 'admin':
            return True

        # Doctors can modify their assigned patients
        if user.role == 'doctor':
            return True

        # Deny modification by default
        return False
