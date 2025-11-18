"""
Doctor permissions for the Clinic CRM.
Following django-backend-guidelines: role-based access control.
"""
from rest_framework import permissions


class CanAccessDoctor(permissions.BasePermission):
    """
    Permission to check if user can access doctor records.

    Rules:
    - Admins can access all doctors
    - Doctors can access their own profile and other doctors (read-only)
    - Nurses and receptionists can view doctors (read-only)
    - Patients cannot access doctor management
    """

    def has_permission(self, request, view):
        """Check if user has permission to access doctors list."""
        if not request.user.is_authenticated:
            return False

        # Admins have full access
        if request.user.role == 'admin':
            return True

        # Doctors, nurses, receptionists can view
        if request.user.role in ['doctor', 'nurse', 'receptionist']:
            # Can view, but modify permissions checked at object level
            if request.method in permissions.SAFE_METHODS:
                return True
            # Only admins and the doctor themselves can modify
            return request.user.role in ['admin', 'doctor']

        return False

    def has_object_permission(self, request, view, obj):
        """Check if user can access specific doctor object."""
        user = request.user

        # Admins have full access
        if user.role == 'admin':
            return True

        # Read-only for nurses and receptionists
        if user.role in ['nurse', 'receptionist']:
            return request.method in permissions.SAFE_METHODS

        # Doctors can view all, but only modify their own
        if user.role == 'doctor':
            if request.method in permissions.SAFE_METHODS:
                return True
            # Can only modify own profile
            try:
                return obj.user.id == user.id
            except AttributeError:
                return False

        return False


class CanModifyDoctor(permissions.BasePermission):
    """
    Permission to check if user can modify doctor records.

    Rules:
    - Only admins can create/update/delete doctors
    - Doctors can update their own profile (limited fields)
    """

    def has_permission(self, request, view):
        """Check if user can modify doctors."""
        if not request.user.is_authenticated:
            return False

        # Read-only methods are checked by CanAccessDoctor
        if request.method in permissions.SAFE_METHODS:
            return True

        # Only admins and doctors can modify
        return request.user.role in ['admin', 'doctor']

    def has_object_permission(self, request, view, obj):
        """Check if user can modify specific doctor."""
        user = request.user

        # Read-only is allowed (checked by CanAccessDoctor)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Admins can modify all
        if user.role == 'admin':
            return True

        # Doctors can only modify their own profile
        if user.role == 'doctor':
            try:
                return obj.user.id == user.id
            except AttributeError:
                return False

        return False


class CanManageCredentials(permissions.BasePermission):
    """
    Permission to manage doctor credentials.

    Rules:
    - Admins can manage all credentials
    - Doctors can view their own credentials
    - Only admins can verify credentials
    """

    def has_permission(self, request, view):
        """Check if user can access credentials."""
        if not request.user.is_authenticated:
            return False

        # Admins have full access
        if request.user.role == 'admin':
            return True

        # Doctors can view their own
        if request.user.role == 'doctor':
            return request.method in permissions.SAFE_METHODS

        return False

    def has_object_permission(self, request, view, obj):
        """Check if user can access specific credential."""
        user = request.user

        # Admins have full access
        if user.role == 'admin':
            return True

        # Doctors can only view their own credentials
        if user.role == 'doctor':
            if request.method in permissions.SAFE_METHODS:
                try:
                    return obj.doctor.user.id == user.id
                except AttributeError:
                    return False

        return False


class CanManageAvailability(permissions.BasePermission):
    """
    Permission to manage doctor availability schedules.

    Rules:
    - Admins can manage all schedules
    - Doctors can manage their own schedule
    - Receptionists can view all schedules
    """

    def has_permission(self, request, view):
        """Check if user can access availability."""
        if not request.user.is_authenticated:
            return False

        # Admins and doctors have full access
        if request.user.role in ['admin', 'doctor']:
            return True

        # Receptionists can view
        if request.user.role == 'receptionist':
            return request.method in permissions.SAFE_METHODS

        return False

    def has_object_permission(self, request, view, obj):
        """Check if user can access specific availability."""
        user = request.user

        # Admins have full access
        if user.role == 'admin':
            return True

        # Doctors can manage their own schedule
        if user.role == 'doctor':
            try:
                return obj.doctor.user.id == user.id
            except AttributeError:
                return False

        # Receptionists can view
        if user.role == 'receptionist':
            return request.method in permissions.SAFE_METHODS

        return False
