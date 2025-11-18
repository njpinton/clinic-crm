"""
Appointment views for the Clinic CRM.
Following django-backend-guidelines: ViewSets with HIPAA audit logging and proper permissions.
"""
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
import sentry_sdk

from .models import Appointment, AppointmentReminder
from .serializers import (
    AppointmentSerializer,
    AppointmentListSerializer,
    AppointmentCreateSerializer,
    AppointmentUpdateSerializer,
    AppointmentCancelSerializer,
    AppointmentRescheduleSerializer,
    AppointmentReminderSerializer,
)
from .permissions import (
    CanAccessAppointment,
    CanModifyAppointment,
    CanCheckInAppointment,
    CanCompleteAppointment,
    CanManageReminders,
)
from apps.core.utils import log_phi_access


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing appointments.

    Includes HIPAA audit logging for all PHI access.

    Permissions:
    - Admins/Receptionists: Full access to all appointments
    - Doctors: Access to their own appointments
    - Patients: Access to their own appointments
    - Nurses: Read-only access to all appointments
    """
    permission_classes = [IsAuthenticated, CanAccessAppointment, CanModifyAppointment]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'appointment_type', 'patient', 'doctor']
    search_fields = [
        'patient__user__first_name',
        'patient__user__last_name',
        'doctor__user__first_name',
        'doctor__user__last_name',
        'reason',
    ]
    ordering_fields = ['appointment_datetime', 'created_at', 'status']
    ordering = ['-appointment_datetime']

    def get_queryset(self):
        """
        Optimize queries with select_related and prefetch_related.
        Filter based on user role.
        """
        queryset = Appointment.objects.select_related(
            'patient',
            'patient__user',
            'doctor',
            'doctor__user',
            'cancelled_by',
            'rescheduled_from'
        ).prefetch_related(
            'doctor__specializations',
            'reminders'
        )

        user = self.request.user

        # Filter by user role
        if user.role == 'doctor':
            # Doctors see only their appointments
            try:
                from apps.doctors.models import Doctor
                doctor = Doctor.objects.get(user=user)
                queryset = queryset.filter(doctor=doctor)
            except Doctor.DoesNotExist:
                return queryset.none()

        elif user.role == 'patient':
            # Patients see only their appointments
            try:
                from apps.patients.models import Patient
                patient = Patient.objects.get(user=user)
                queryset = queryset.filter(patient=patient)
            except Patient.DoesNotExist:
                return queryset.none()

        # Admins, receptionists, and nurses see all appointments (no filter)

        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            queryset = queryset.filter(appointment_datetime__gte=start_date)
        if end_date:
            queryset = queryset.filter(appointment_datetime__lte=end_date)

        # Filter by upcoming/past
        filter_type = self.request.query_params.get('filter')
        if filter_type == 'upcoming':
            queryset = queryset.filter(
                appointment_datetime__gte=timezone.now(),
                status__in=['scheduled', 'confirmed']
            )
        elif filter_type == 'today':
            today = timezone.now().date()
            queryset = queryset.filter(
                appointment_datetime__date=today
            )
        elif filter_type == 'past':
            queryset = queryset.filter(
                appointment_datetime__lt=timezone.now()
            )

        return queryset.distinct()

    def get_serializer_class(self):
        """
        Use different serializers for different actions.
        """
        if self.action == 'list':
            return AppointmentListSerializer
        elif self.action == 'create':
            return AppointmentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AppointmentUpdateSerializer
        elif self.action == 'cancel':
            return AppointmentCancelSerializer
        elif self.action == 'reschedule':
            return AppointmentRescheduleSerializer
        return AppointmentSerializer

    def list(self, request, *args, **kwargs):
        """List appointments with audit logging."""
        try:
            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='LIST',
                resource_type='Appointment',
                resource_id=None,
                details='Viewed appointment list'
            )

            return super().list(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error retrieving appointments.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific appointment with audit logging."""
        try:
            instance = self.get_object()

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='READ',
                resource_type='Appointment',
                resource_id=str(instance.id),
                details=f'Viewed appointment: {instance.patient.full_name} with {instance.doctor.full_name}'
            )

            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error retrieving appointment.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """Create a new appointment with audit logging."""
        try:
            response = super().create(request, *args, **kwargs)

            # HIPAA Audit Logging
            if response.status_code == status.HTTP_201_CREATED:
                log_phi_access(
                    user=request.user,
                    action='CREATE',
                    resource_type='Appointment',
                    resource_id=str(response.data.get('id')),
                    details='Created new appointment'
                )

            return response
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error creating appointment.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        """Update an appointment with audit logging."""
        try:
            instance = self.get_object()
            response = super().update(request, *args, **kwargs)

            # HIPAA Audit Logging
            if response.status_code == status.HTTP_200_OK:
                log_phi_access(
                    user=request.user,
                    action='UPDATE',
                    resource_type='Appointment',
                    resource_id=str(instance.id),
                    details=f'Updated appointment: {instance.patient.full_name} with {instance.doctor.full_name}'
                )

            return response
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error updating appointment.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        """Soft delete an appointment with audit logging."""
        try:
            instance = self.get_object()
            appointment_info = f'{instance.patient.full_name} with {instance.doctor.full_name} on {instance.appointment_datetime}'

            # Soft delete
            instance.delete()

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='DELETE',
                resource_type='Appointment',
                resource_id=str(instance.id),
                details=f'Soft deleted appointment: {appointment_info}'
            )

            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error deleting appointment.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanCheckInAppointment])
    def check_in(self, request, pk=None):
        """
        Check in a patient for their appointment.
        Updates status to 'checked_in' and records check-in time.
        """
        try:
            appointment = self.get_object()

            # Validate status
            if appointment.status not in ['scheduled', 'confirmed']:
                return Response(
                    {'detail': f'Cannot check in appointment with status: {appointment.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate time (not too early)
            from datetime import timedelta
            if appointment.appointment_datetime > timezone.now() + timedelta(hours=1):
                return Response(
                    {'detail': 'Appointment is more than 1 hour away. Cannot check in yet.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check in
            appointment.check_in()

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='Appointment',
                resource_id=str(appointment.id),
                details=f'Checked in patient: {appointment.patient.full_name}'
            )

            serializer = AppointmentSerializer(appointment)
            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error checking in appointment.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanCompleteAppointment])
    def complete(self, request, pk=None):
        """
        Mark appointment as completed.
        Only doctors can complete their appointments.
        """
        try:
            appointment = self.get_object()

            # Validate status
            if appointment.status not in ['checked_in', 'in_progress']:
                return Response(
                    {'detail': f'Cannot complete appointment with status: {appointment.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Complete
            appointment.complete()

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='Appointment',
                resource_id=str(appointment.id),
                details=f'Completed appointment: {appointment.patient.full_name}'
            )

            serializer = AppointmentSerializer(appointment)
            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error completing appointment.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel an appointment.
        Requires cancellation reason.
        """
        try:
            appointment = self.get_object()

            # Validate status
            if appointment.status in ['completed', 'cancelled', 'no_show']:
                return Response(
                    {'detail': f'Cannot cancel appointment with status: {appointment.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate and get cancellation reason
            serializer = AppointmentCancelSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # Cancel
            appointment.cancel(
                user=request.user,
                reason=serializer.validated_data['cancellation_reason']
            )

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='Appointment',
                resource_id=str(appointment.id),
                details=f'Cancelled appointment: {appointment.patient.full_name} with {appointment.doctor.full_name}'
            )

            response_serializer = AppointmentSerializer(appointment)
            return Response(response_serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error cancelling appointment.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """
        Reschedule an appointment to a new time.
        Creates a new appointment and marks current as rescheduled.
        """
        try:
            appointment = self.get_object()

            # Validate status
            if appointment.status in ['completed', 'cancelled', 'no_show', 'rescheduled']:
                return Response(
                    {'detail': f'Cannot reschedule appointment with status: {appointment.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate and get new datetime
            serializer = AppointmentRescheduleSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # Reschedule
            new_appointment = appointment.reschedule(
                new_datetime=serializer.validated_data['new_datetime']
            )

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='Appointment',
                resource_id=str(appointment.id),
                details=f'Rescheduled appointment: {appointment.patient.full_name} with {appointment.doctor.full_name} to {new_appointment.appointment_datetime}'
            )

            response_serializer = AppointmentSerializer(new_appointment)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error rescheduling appointment.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def mark_no_show(self, request, pk=None):
        """
        Mark appointment as no-show.
        Only staff can mark no-shows.
        """
        if request.user.role not in ['admin', 'receptionist', 'nurse', 'doctor']:
            return Response(
                {'detail': 'Only staff can mark appointments as no-show.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            appointment = self.get_object()

            # Validate status
            if appointment.status not in ['scheduled', 'confirmed']:
                return Response(
                    {'detail': f'Cannot mark as no-show with status: {appointment.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Must be past appointment time
            if appointment.appointment_datetime > timezone.now():
                return Response(
                    {'detail': 'Cannot mark future appointments as no-show.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update status
            appointment.status = 'no_show'
            appointment.save(update_fields=['status'])

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='UPDATE',
                resource_type='Appointment',
                resource_id=str(appointment.id),
                details=f'Marked as no-show: {appointment.patient.full_name}'
            )

            serializer = AppointmentSerializer(appointment)
            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error marking as no-show.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Get upcoming appointments for the current user.
        """
        try:
            queryset = self.filter_queryset(self.get_queryset())
            queryset = queryset.filter(
                appointment_datetime__gte=timezone.now(),
                status__in=['scheduled', 'confirmed']
            ).order_by('appointment_datetime')

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='LIST',
                resource_type='Appointment',
                resource_id=None,
                details='Viewed upcoming appointments'
            )

            serializer = AppointmentListSerializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error retrieving upcoming appointments.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Get today's appointments.
        """
        try:
            today = timezone.now().date()
            queryset = self.filter_queryset(self.get_queryset())
            queryset = queryset.filter(
                appointment_datetime__date=today
            ).order_by('appointment_datetime')

            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='LIST',
                resource_type='Appointment',
                resource_id=None,
                details="Viewed today's appointments"
            )

            serializer = AppointmentListSerializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': "Error retrieving today's appointments."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AppointmentReminderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing appointment reminders.

    Permissions:
    - Admins/Receptionists: Full access
    - Doctors/Nurses: Read-only access
    """
    serializer_class = AppointmentReminderSerializer
    permission_classes = [IsAuthenticated, CanManageReminders]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['appointment', 'reminder_type', 'status']
    ordering_fields = ['scheduled_send_time', 'sent_at', 'created_at']
    ordering = ['-scheduled_send_time']

    def get_queryset(self):
        """Optimize queries."""
        queryset = AppointmentReminder.objects.select_related(
            'appointment',
            'appointment__patient',
            'appointment__doctor'
        )

        # Filter by appointment if provided
        appointment_id = self.request.query_params.get('appointment')
        if appointment_id:
            queryset = queryset.filter(appointment_id=appointment_id)

        return queryset

    def list(self, request, *args, **kwargs):
        """List reminders with audit logging."""
        try:
            # HIPAA Audit Logging
            log_phi_access(
                user=request.user,
                action='LIST',
                resource_type='AppointmentReminder',
                resource_id=None,
                details='Viewed appointment reminders'
            )

            return super().list(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error retrieving reminders.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """Create a new reminder with audit logging."""
        try:
            response = super().create(request, *args, **kwargs)

            # HIPAA Audit Logging
            if response.status_code == status.HTTP_201_CREATED:
                log_phi_access(
                    user=request.user,
                    action='CREATE',
                    resource_type='AppointmentReminder',
                    resource_id=str(response.data.get('id')),
                    details='Created appointment reminder'
                )

            return response
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'detail': 'Error creating reminder.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
