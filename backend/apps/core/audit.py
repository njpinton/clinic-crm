"""
HIPAA-compliant audit logging system.
Tracks all access to Protected Health Information (PHI).
"""
from .models import AuditLog


def log_phi_access(user, action, resource_type, resource_id, request, details='', **kwargs):
    """
    Helper function to log PHI access.

    Args:
        user: The user performing the action
        action: One of CREATE, READ, UPDATE, DELETE, LIST, EXPORT, PRINT
        resource_type: Type of resource (e.g., 'Patient', 'ClinicalNote')
        resource_id: ID of the resource (can be None for LIST actions)
        request: Django request object
        details: Human-readable description of the action
        **kwargs: Additional fields (was_successful, error_message, etc.)
    """
    return AuditLog.objects.create(
        user=user,
        user_email=user.email,
        user_role=user.role if hasattr(user, 'role') else 'unknown',
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else None,
        details=details,
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        request_method=request.method,
        request_path=request.path,
        query_params=request.META.get('QUERY_STRING', ''),
        was_successful=kwargs.get('was_successful', True),
        error_message=kwargs.get('error_message', ''),
    )


def get_client_ip(request):
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
