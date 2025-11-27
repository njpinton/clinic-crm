"""
API views for core app functionality, including audit logs.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import UserRateThrottle
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
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
