"""
User permissions for the Clinic CRM.
Controls who can create, view, and modify users.
"""
from rest_framework import permissions


class CanManageUsers(permissions.BasePermission):
    """
    Permission for user management.

    Rules:
    - Admins can manage all users
    - Users can view and update their own profile
    - Role changes require admin privileges
    """

    def has_permission(self, request, view):
        """Check if user can access user management endpoints."""
        if not request.user.is_authenticated:
            return False

        # Anyone authenticated can view users (filtered by has_object_permission)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Only admins can create new users
        if view.action == 'create':
            return request.user.role == 'admin'

        # Authenticated users can update (object permission checks ownership)
        return True

    def has_object_permission(self, request, view, obj):
        """Check if user can access specific user object."""
        user = request.user

        # Admins can access all users
        if user.role == 'admin':
            return True

        # Users can view their own profile
        if request.method in permissions.SAFE_METHODS:
            return obj.id == user.id

        # Users can update their own profile
        if request.method in ['PUT', 'PATCH']:
            return obj.id == user.id

        # Only admins can delete users
        if request.method == 'DELETE':
            return user.role == 'admin'

        return False


class CanChangeUserRole(permissions.BasePermission):
    """
    Permission for changing user roles.
    Only admins can change roles.
    """

    def has_permission(self, request, view):
        """Only admins can change roles."""
        if not request.user.is_authenticated:
            return False

        return request.user.role == 'admin'

    def has_object_permission(self, request, view, obj):
        """Admins can change any user's role except their own."""
        if request.user.role != 'admin':
            return False

        # Don't allow changing your own role
        if obj.id == request.user.id:
            return False

        return True


class CanActivateDeactivateUser(permissions.BasePermission):
    """
    Permission for activating/deactivating users.
    Only admins can activate/deactivate users.
    """

    def has_permission(self, request, view):
        """Only admins can activate/deactivate users."""
        if not request.user.is_authenticated:
            return False

        return request.user.role == 'admin'

    def has_object_permission(self, request, view, obj):
        """Admins can activate/deactivate any user except themselves."""
        if request.user.role != 'admin':
            return False

        # Don't allow deactivating yourself
        if obj.id == request.user.id:
            return False

        return True
