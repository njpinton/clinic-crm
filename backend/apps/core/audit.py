"""
HIPAA-compliant audit logging system.
Tracks all access to Protected Health Information (PHI).
"""
from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    """
    Audit log for HIPAA compliance.
    Records all access to patient data and other sensitive information.
    """
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('READ', 'Read'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,  # Never delete audit logs
        related_name='audit_logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, db_index=True)
    resource_type = models.CharField(max_length=50, db_index=True)
    resource_id = models.UUIDField(db_index=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['resource_type', 'resource_id']),
            models.Index(fields=['action', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.user} {self.action} {self.resource_type} at {self.timestamp}"


def log_phi_access(user, action, resource_type, resource_id, request, **metadata):
    """
    Helper function to log PHI access.

    Args:
        user: The user performing the action
        action: One of CREATE, READ, UPDATE, DELETE
        resource_type: Type of resource (e.g., 'Patient', 'ClinicalNote')
        resource_id: UUID of the resource
        request: Django request object
        **metadata: Additional metadata to log
    """
    return AuditLog.objects.create(
        user=user,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        metadata=metadata
    )


def get_client_ip(request):
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
