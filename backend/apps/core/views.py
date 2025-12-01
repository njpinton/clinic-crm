"""
API views for core app functionality, including audit logs and dashboard.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from django.utils import timezone
from datetime import timedelta
from apps.core.models import AuditLog
from apps.core.serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for audit logs.

    Audit logs cannot be created, modified, or deleted through the API.
    They are created automatically by the audit logging middleware.

    Authorization:
    - Admin users can view all audit logs
    - Regular users can only view logs for their own actions

    This ensures users cannot view audit trails for resources they don't have access to.

    Supports filtering by:
    - action (CREATE, READ, UPDATE, DELETE, LIST, EXPORT, PRINT)
    - resource_type (e.g., "Patient", "Appointment")
    - resource_id (UUID of the resource)
    - user (UUID of the user)

    Example:
        GET /api/audit-logs/?resource_type=Patient&resource_id=123
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['action', 'resource_type', 'resource_id', 'user']
    ordering_fields = ['created_at', 'action', 'resource_type']
    ordering = ['-created_at']  # Most recent first

    def get_queryset(self):
        """
        Filter audit logs based on user role and permissions.

        - Admin users can see all audit logs
        - Regular users can only see logs for their own actions

        This prevents unauthorized access to audit trails for resources
        the user doesn't have permission to view.
        """
        user = self.request.user

        # Optimize query with select_related to avoid N+1 queries
        queryset = AuditLog.objects.select_related('user').all()

        # Admin users can view all audit logs
        if hasattr(user, 'role') and user.role == 'admin':
            return queryset

        # Regular users can only view their own audit logs
        return queryset.filter(user=user)


class DashboardViewSet(viewsets.ViewSet):
    """
    ViewSet for dashboard statistics and recent activities.
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics."""
        try:
            from apps.patients.models import Patient
            from apps.appointments.models import Appointment
            from apps.clinical_notes.models import ClinicalNote

            today = timezone.now().date()

            # Get total patients
            total_patients = Patient.objects.count()

            # Get appointments today
            appointments_today = Appointment.objects.filter(
                appointment_datetime__date=today
            ).count()

            # Get pending lab orders (placeholder - would need lab app)
            pending_lab_orders = 0

            # Get active clinical notes (notes created today or recently updated)
            active_notes = ClinicalNote.objects.filter(
                created_at__date=today
            ).count()

            return Response({
                'totalPatients': total_patients,
                'appointmentsToday': appointments_today,
                'pendingLabOrders': pending_lab_orders,
                'activeNotes': active_notes,
            })
        except Exception as e:
            return Response(
                {'detail': f'Error retrieving dashboard stats: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def activities(self, request):
        """Get recent system activities from audit logs."""
        try:
            # Get recent audit logs (last 10)
            recent_logs = AuditLog.objects.select_related('user').order_by(
                '-created_at'
            )[:10]

            activities = []
            for log in recent_logs:
                activities.append({
                    'id': str(log.id),
                    'user': f"{log.user.first_name} {log.user.last_name}".strip() or log.user.email,
                    'action': log.action.lower(),
                    'resource': f"{log.resource_type} ({log.resource_id[:8]})" if log.resource_id else log.resource_type,
                    'timestamp': log.created_at.isoformat(),
                })

            return Response(activities)
        except Exception as e:
            return Response(
                {'detail': f'Error retrieving activities: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
