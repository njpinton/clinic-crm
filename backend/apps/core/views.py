"""
API views for core app functionality, including audit logs.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from apps.core.models import AuditLog
from apps.core.serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for audit logs.

    Audit logs cannot be created, modified, or deleted through the API.
    They are created automatically by the audit logging middleware.

    Supports filtering by:
    - action (CREATE, READ, UPDATE, DELETE, LIST, EXPORT, PRINT)
    - resource_type (e.g., "Patient", "Appointment")
    - resource_id (UUID of the resource)
    - user (UUID of the user)

    Example:
        GET /api/audit-logs/?resource_type=Patient&resource_id=123
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['action', 'resource_type', 'resource_id', 'user']
    ordering_fields = ['created_at', 'action', 'resource_type']
    ordering = ['-created_at']  # Most recent first
