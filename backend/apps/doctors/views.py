"""
Doctor views for the Clinic CRM.
Following django-backend-guidelines: ViewSets with HIPAA audit logging and proper permissions.
"""
from django.db import models
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
import sentry_sdk

from .models import Doctor, Specialization, DoctorCredential, DoctorAvailability
from .serializers import (
    DoctorSerializer,
    DoctorListSerializer,
    DoctorCreateSerializer,
    SpecializationSerializer,
    DoctorCredentialSerializer,
    DoctorAvailabilitySerializer,
)
from .permissions import (
    CanAccessDoctor,
    CanModifyDoctor,
    CanManageCredentials,
    CanManageAvailability,
)
from apps.core.audit import log_phi_access


class SpecializationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing medical specializations.

    Permissions:
    - Any authenticated user can view specializations
    - Only admins can create/update/delete specializations
    """
    queryset = Specialization.objects.all()
    serializer_class = SpecializationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_permissions(self):
        """
        Read-only for all authenticated users.
        Write operations require admin role.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only admins can modify specializations
            return [IsAuthenticated()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        """Create a new specialization (admin only)."""
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Only admins can create specializations.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error creating specialization.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        """Update a specialization (admin only)."""
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Only admins can update specializations.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error updating specialization.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        """Delete a specialization (admin only)."""
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Only admins can delete specializations.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error deleting specialization.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DoctorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing doctors.

    Includes HIPAA audit logging for all PHI access.

    Permissions:
    - Admins: Full access to all doctors
    - Doctors: Can view all, modify only their own profile
    - Nurses/Receptionists: Read-only access
    - Patients: No access
    """
    permission_classes = [IsAuthenticated, CanAccessDoctor, CanModifyDoctor]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_accepting_patients', 'board_certified']
    search_fields = [
        'user__first_name',
        'user__last_name',
        'user__email',
        'license_number',
        'npi_number',
        'specializations__name',
    ]
    ordering_fields = ['user__last_name', 'user__first_name', 'created_at']
    ordering = ['user__last_name', 'user__first_name']

    def get_queryset(self):
        """
        Optimize queries with select_related and prefetch_related.
        Only return non-deleted doctors.
        """
        queryset = Doctor.objects.select_related('user').prefetch_related(
            'specializations',
            'credentials',
            'availability_schedules'
        )

        # Filter by specialization if provided
        specialization_id = self.request.query_params.get('specialization')
        if specialization_id:
            queryset = queryset.filter(specializations__id=specialization_id)

        # Filter by availability status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            is_active_bool = is_active.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(user__is_active=is_active_bool)

        return queryset.distinct()

    def get_serializer_class(self):
        """
        Use different serializers for list vs detail views.
        List view uses minimal serializer for performance.
        """
        if self.action == 'list':
            return DoctorListSerializer
        elif self.action == 'create':
            return DoctorCreateSerializer
        return DoctorSerializer

    def list(self, request, *args, **kwargs):
        """List all doctors with audit logging."""
        try:
            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='LIST',
                resource_type='Doctor',
                resource_id=None,
                request=request,                details='Viewed doctor list'
            )

            return super().list(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error retrieving doctors.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific doctor with audit logging."""
        try:
            instance = self.get_object()

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='READ',
                resource_type='Doctor',
                resource_id=str(instance.id),
                request=request,                details=f'Viewed doctor profile: {instance.user.get_full_name()}'
            )

            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error retrieving doctor.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """Create a new doctor with audit logging."""
        try:
            response = super().create(request, *args, **kwargs)

            # HIPAA Audit Logging
            if response.status_code == status.HTTP_201_CREATED:
                log_phi_access(
                    user=request.user,
                    action='CREATE',
                    resource_type='Doctor',
                    resource_id=str(response.data.get('id')),
                request=request,                    details='Created new doctor profile'
                )

            return response
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error creating doctor.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        """Update a doctor with audit logging."""
        try:
            instance = self.get_object()
            response = super().update(request, *args, **kwargs)

            # HIPAA Audit Logging
            if response.status_code == status.HTTP_200_OK:
                log_phi_access(
                    user=request.user,
                    action='UPDATE',
                    resource_type='Doctor',
                    resource_id=str(instance.id),
                request=request,                    details=f'Updated doctor profile: {instance.user.get_full_name()}'
                )

            return response
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error updating doctor.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        """Soft delete a doctor with audit logging."""
        try:
            instance = self.get_object()
            doctor_name = instance.user.get_full_name()

            # Soft delete
            instance.delete()

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='DELETE',
                resource_type='Doctor',
                resource_id=str(instance.id),
                request=request,                details=f'Soft deleted doctor profile: {doctor_name}'
            )

            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error deleting doctor.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def schedule(self, request, pk=None):
        """
        Get doctor's availability schedule.
        Custom action to retrieve all availability schedules for a doctor.
        """
        try:
            doctor = self.get_object()

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='READ',
                resource_type='DoctorAvailability',
                resource_id=str(doctor.id),
                request=request,                details=f'Viewed availability schedule for: {doctor.user.get_full_name()}'
            )

            schedules = doctor.availability_schedules.filter(is_active=True)
            serializer = DoctorAvailabilitySerializer(schedules, many=True)
            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error retrieving schedule.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def credentials(self, request, pk=None):
        """
        Get doctor's credentials.
        Custom action to retrieve all credentials for a doctor.
        """
        try:
            doctor = self.get_object()

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='READ',
                resource_type='DoctorCredential',
                resource_id=str(doctor.id),
                request=request,                details=f'Viewed credentials for: {doctor.user.get_full_name()}'
            )

            credentials = doctor.credentials.all()
            serializer = DoctorCredentialSerializer(credentials, many=True)
            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error retrieving credentials.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """
        Deactivate a doctor (admin only).
        Sets user.is_active to False.
        """
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Only admins can deactivate doctors.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            doctor = self.get_object()
            doctor.user.is_active = False
            doctor.user.save(update_fields=['is_active'])

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='Doctor',
                resource_id=str(doctor.id),
                request=request,                details=f'Deactivated doctor: {doctor.user.get_full_name()}'
            )

            return Response({'detail': 'Doctor deactivated successfully.'})
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error deactivating doctor.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Activate a doctor (admin only).
        Sets user.is_active to True.
        """
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Only admins can activate doctors.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            doctor = self.get_object()
            doctor.user.is_active = True
            doctor.user.save(update_fields=['is_active'])

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='Doctor',
                resource_id=str(doctor.id),
                request=request,                details=f'Activated doctor: {doctor.user.get_full_name()}'
            )

            return Response({'detail': 'Doctor activated successfully.'})
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error activating doctor.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DoctorCredentialViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing doctor credentials.

    Permissions:
    - Admins: Full access to all credentials
    - Doctors: Can view their own credentials
    - Others: No access
    """
    serializer_class = DoctorCredentialSerializer
    permission_classes = [IsAuthenticated, CanManageCredentials]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['credential_type', 'is_verified', 'doctor']
    ordering_fields = ['issue_date', 'expiration_date', 'created_at']
    ordering = ['-issue_date']

    def get_queryset(self):
        """
        Optimize queries and filter based on user permissions.
        Doctors can only see their own credentials.
        """
        queryset = DoctorCredential.objects.select_related('doctor', 'doctor__user')

        # Filter by doctor's own credentials if not admin
        if self.request.user.role == 'doctor':
            try:
                doctor = Doctor.objects.get(user=self.request.user)
                queryset = queryset.filter(doctor=doctor)
            except Doctor.DoesNotExist:
                return queryset.none()

        # Filter by doctor if provided
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)

        return queryset

    def list(self, request, *args, **kwargs):
        """List credentials with audit logging."""
        try:
            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='LIST',
                resource_type='DoctorCredential',
                resource_id=None,
                request=request,                details='Viewed credentials list'
            )

            return super().list(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error retrieving credentials.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """Create a new credential with audit logging."""
        try:
            response = super().create(request, *args, **kwargs)

            # HIPAA Audit Logging
            if response.status_code == status.HTTP_201_CREATED:
                log_phi_access(
                    user=request.user,
                    action='CREATE',
                    resource_type='DoctorCredential',
                    resource_id=str(response.data.get('id')),
                request=request,                    details='Created new credential'
                )

            return response
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error creating credential.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """
        Verify a credential (admin only).
        Sets is_verified to True and records verification date.
        """
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Only admins can verify credentials.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            credential = self.get_object()
            credential.is_verified = True
            credential.verification_date = timezone.now().date()
            credential.save(update_fields=['is_verified', 'verification_date'])

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='DoctorCredential',
                resource_id=str(credential.id),
                request=request,                details=f'Verified credential: {credential.credential_type} for {credential.doctor.user.get_full_name()}'
            )

            return Response({'detail': 'Credential verified successfully.'})
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error verifying credential.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DoctorAvailabilityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing doctor availability schedules.

    Permissions:
    - Admins: Full access to all schedules
    - Doctors: Can manage their own schedule
    - Receptionists: Read-only access
    - Others: No access
    """
    serializer_class = DoctorAvailabilitySerializer
    permission_classes = [IsAuthenticated, CanManageAvailability]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['doctor', 'day_of_week', 'is_active']
    ordering_fields = ['day_of_week', 'start_time', 'created_at']
    ordering = ['day_of_week', 'start_time']

    def get_queryset(self):
        """
        Optimize queries and filter based on user permissions.
        Doctors can only see/manage their own schedules.
        """
        queryset = DoctorAvailability.objects.select_related('doctor', 'doctor__user')

        # Filter by doctor's own schedule if not admin/receptionist
        if self.request.user.role == 'doctor':
            try:
                doctor = Doctor.objects.get(user=self.request.user)
                queryset = queryset.filter(doctor=doctor)
            except Doctor.DoesNotExist:
                return queryset.none()

        # Filter by doctor if provided
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)

        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            is_active_bool = is_active.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_active=is_active_bool)

        return queryset

    def list(self, request, *args, **kwargs):
        """List availability schedules with audit logging."""
        try:
            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='LIST',
                resource_type='DoctorAvailability',
                resource_id=None,
                request=request,                details='Viewed availability schedules'
            )

            return super().list(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error retrieving schedules.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """Create a new availability schedule with audit logging."""
        try:
            response = super().create(request, *args, **kwargs)

            # HIPAA Audit Logging
            if response.status_code == status.HTTP_201_CREATED:
                log_phi_access(
                    user=request.user,
                    action='CREATE',
                    resource_type='DoctorAvailability',
                    resource_id=str(response.data.get('id')),
                request=request,                    details='Created new availability schedule'
                )

            return response
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error creating schedule.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        """Update an availability schedule with audit logging."""
        try:
            instance = self.get_object()
            response = super().update(request, *args, **kwargs)

            # HIPAA Audit Logging
            if response.status_code == status.HTTP_200_OK:
                log_phi_access(
                    user=request.user,
                    action='UPDATE',
                    resource_type='DoctorAvailability',
                    resource_id=str(instance.id),
                request=request,                    details=f'Updated availability for: {instance.doctor.user.get_full_name()}'
                )

            return response
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error updating schedule.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
