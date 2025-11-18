"""
User views for the Clinic CRM.
Handles user management, registration, and profile updates with HIPAA audit logging.
"""
from django.contrib.auth import get_user_model
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
import sentry_sdk

from .models import User
from .serializers import (
    UserListSerializer,
    UserDetailSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    UserRoleUpdateSerializer,
    ChangePasswordSerializer,
    UserRegistrationSerializer,
)
from .permissions import (
    CanManageUsers,
    CanChangeUserRole,
    CanActivateDeactivateUser,
)
from apps.core.audit import log_phi_access


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user management with HIPAA audit logging.

    Permissions:
    - Admins: Full access to all users
    - Users: Can view and update their own profile
    - Public: Can register as patient (separate endpoint)
    """
    permission_classes = [IsAuthenticated, CanManageUsers]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active', 'is_verified']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering_fields = ['email', 'first_name', 'last_name', 'created_at', 'role']
    ordering = ['last_name', 'first_name']

    def get_queryset(self):
        """
        Filter users based on role.
        Admins see all users, others see only themselves.
        """
        queryset = User.objects.all()

        # Non-admins can only see themselves
        if self.request.user.role != 'admin':
            queryset = queryset.filter(id=self.request.user.id)

        # Filter by role if provided
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)

        return queryset

    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == 'list':
            return UserListSerializer
        elif self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        elif self.action == 'change_role':
            return UserRoleUpdateSerializer
        elif self.action == 'change_password':
            return ChangePasswordSerializer
        return UserDetailSerializer

    def list(self, request, *args, **kwargs):
        """List users with audit logging."""
        try:
            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='LIST',
                resource_type='User',
                resource_id=None,
                request=request,                details='Viewed user list',
            )

            return super().list(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error retrieving users.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve user with audit logging."""
        try:
            instance = self.get_object()

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='READ',
                resource_type='User',
                resource_id=str(instance.id),
                request=request,                details=f'Viewed user profile: {instance.email}',
            )

            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error retrieving user.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """Create user with audit logging (admin only)."""
        try:
            response = super().create(request, *args, **kwargs)

            # HIPAA Audit Logging
            if response.status_code == status.HTTP_201_CREATED:
                log_phi_access(
                    user=request.user,
                    action='CREATE',
                    resource_type='User',
                    resource_id=str(response.data.get('id')),
                request=request,                    details=f'Created new user: {response.data.get("email")}',
                )

            return response
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error creating user.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        """Update user with audit logging."""
        try:
            instance = self.get_object()
            response = super().update(request, *args, **kwargs)

            # HIPAA Audit Logging
            if response.status_code == status.HTTP_200_OK:
                log_phi_access(
                    user=request.user,
                    action='UPDATE',
                    resource_type='User',
                    resource_id=str(instance.id),
                request=request,                    details=f'Updated user profile: {instance.email}',
                )

            return response
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error updating user.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        """Deactivate user instead of deleting (soft delete)."""
        try:
            instance = self.get_object()

            # Deactivate instead of delete
            instance.is_active = False
            instance.save(update_fields=['is_active'])

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='User',
                resource_id=str(instance.id),
                request=request,                details=f'Deactivated user: {instance.email}',
            )

            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error deactivating user.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanChangeUserRole])
    def change_role(self, request, pk=None):
        """
        Change user's role (admin only).
        Requires separate permission to prevent unauthorized role changes.
        """
        try:
            user = self.get_object()
            serializer = UserRoleUpdateSerializer(
                data=request.data,
                context={'user': user, 'request': request}
            )
            serializer.is_valid(raise_exception=True)

            old_role = user.role
            new_role = serializer.validated_data['role']

            user.role = new_role
            user.save(update_fields=['role'])

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='User',
                resource_id=str(user.id),
                request=request,                details=f'Changed role from {old_role} to {new_role} for user: {user.email}',
            )

            return Response({
                'detail': f'User role changed from {old_role} to {new_role}.',
                'user': UserDetailSerializer(user).data
            })
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error changing user role.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """
        Change current user's password.
        Requires current password for verification.
        """
        try:
            serializer = ChangePasswordSerializer(
                data=request.data,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)

            # Change password
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='User',
                resource_id=str(request.user.id),
                request=request,                details='Changed password',
            )

            return Response({'detail': 'Password changed successfully.'})
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error changing password.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanActivateDeactivateUser])
    def activate(self, request, pk=None):
        """Activate a user (admin only)."""
        try:
            user = self.get_object()
            user.is_active = True
            user.save(update_fields=['is_active'])

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='User',
                resource_id=str(user.id),
                request=request,                details=f'Activated user: {user.email}',
            )

            return Response({'detail': 'User activated successfully.'})
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error activating user.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanActivateDeactivateUser])
    def deactivate(self, request, pk=None):
        """Deactivate a user (admin only)."""
        try:
            user = self.get_object()
            user.is_active = False
            user.save(update_fields=['is_active'])

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='User',
                resource_id=str(user.id),
                request=request,                details=f'Deactivated user: {user.email}',
            )

            return Response({'detail': 'User deactivated successfully.'})
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error deactivating user.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user's profile."""
        try:
            serializer = UserDetailSerializer(request.user)

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='READ',
                resource_type='User',
                resource_id=str(request.user.id),
                request=request,                details='Viewed own profile',
            )

            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error retrieving profile.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserRegistrationViewSet(viewsets.GenericViewSet):
    """
    Public registration endpoint for patients.
    No authentication required.
    """
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    @action(detail=False, methods=['post'])
    def register(self, request):
        """
        Register a new patient user.
        Public endpoint - no authentication required.
        """
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()

            # HIPAA Audit Logging (use system user for public registration)
            log_phi_access(
                user=user,  # Log as the newly created user
                action='CREATE',
                resource_type='User',
                resource_id=str(user.id),
                request=request,                details=f'New patient registered: {user.email}',
            )

            return Response(
                {
                    'detail': 'Registration successful. Please verify your email.',
                    'user': UserDetailSerializer(user).data
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error during registration.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
