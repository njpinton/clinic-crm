"""
Core utilities for the Clinic CRM.
Includes HIPAA audit logging and common functions.
"""
import logging
from django.utils import timezone
import sentry_sdk

# Configure logger for HIPAA audit trail
audit_logger = logging.getLogger('hipaa_audit')


def log_phi_access(user, action, resource_type, resource_id=None, details='', request=None):
    """
    Log Protected Health Information (PHI) access for HIPAA compliance.

    This function creates an audit trail entry whenever PHI is accessed,
    modified, created, or deleted. This is required for HIPAA compliance.

    Logs are written to:
    1. Database (AuditLog model) - permanent storage
    2. Log files - for real-time monitoring
    3. (Future) SIEM system - for security monitoring

    Args:
        user: The user who performed the action (User model instance)
        action: The type of action (CREATE, READ, UPDATE, DELETE, LIST)
        resource_type: The type of resource accessed (e.g., 'Patient', 'Appointment')
        resource_id: The ID of the specific resource (optional for LIST actions)
        details: Additional details about the action
        request: Optional HTTP request object for capturing IP, user agent, etc.

    Example:
        log_phi_access(
            user=request.user,
            action='READ',
            resource_type='Patient',
            resource_id=str(patient.id),
            details=f'Viewed patient record: {patient.full_name}',
            request=request
        )
    """
    try:
        # Get user information
        user_email = getattr(user, 'email', 'unknown')
        user_role = getattr(user, 'role', 'unknown')
        user_id = getattr(user, 'id', None)

        # Get request metadata if available
        ip_address = None
        user_agent = ''
        request_method = ''
        request_path = ''
        query_params = ''

        if request:
            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]  # Truncate to prevent overflow
            request_method = request.method
            request_path = request.path
            query_params = request.META.get('QUERY_STRING', '')

        # Create audit log entry in database
        from apps.core.models import AuditLog
        AuditLog.objects.create(
            user=user,
            user_email=user_email,
            user_role=user_role,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            request_method=request_method,
            request_path=request_path,
            query_params=query_params,
            was_successful=True,
        )

        # Also log to file for real-time monitoring
        audit_entry = {
            'timestamp': timezone.now().isoformat(),
            'user_id': str(user_id) if user_id else 'unknown',
            'user_email': user_email,
            'user_role': user_role,
            'action': action,
            'resource_type': resource_type,
            'resource_id': resource_id or 'N/A',
            'details': details,
            'ip_address': ip_address,
        }

        audit_logger.info(
            f"HIPAA_AUDIT: {action} {resource_type} by {user_email} (role: {user_role})",
            extra=audit_entry
        )

    except Exception as e:
        # CRITICAL: Audit logging failures should never break the application
        # but should be reported to Sentry
        sentry_sdk.capture_exception(e)
        # Log error but don't raise
        logging.error(f"Failed to log PHI access: {str(e)}")


def get_client_ip(request):
    """
    Get the client IP address from request.

    Handles proxy headers (X-Forwarded-For) commonly used in production.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def mask_sensitive_data(value, show_last=4):
    """
    Mask sensitive data for logging purposes.

    Examples:
        mask_sensitive_data('1234-5678-9012-3456') -> '****-****-****-3456'
        mask_sensitive_data('john@example.com') -> 'j***@example.com'
    """
    if not value:
        return value

    value_str = str(value)

    # Handle email addresses
    if '@' in value_str:
        parts = value_str.split('@')
        if len(parts) == 2:
            return f"{parts[0][0]}***@{parts[1]}"

    # Handle other sensitive data (credit cards, SSN, etc.)
    if len(value_str) > show_last:
        masked_part = '*' * (len(value_str) - show_last)
        visible_part = value_str[-show_last:]
        return masked_part + visible_part

    return value_str


def format_phone_number(phone):
    """
    Format phone number to standard format.

    Example:
        format_phone_number('1234567890') -> '(123) 456-7890'
    """
    if not phone:
        return ''

    # Remove non-numeric characters
    digits = ''.join(filter(str.isdigit, str(phone)))

    # Format based on length
    if len(digits) == 10:
        return f"({digits[0:3]}) {digits[3:6]}-{digits[6:10]}"
    elif len(digits) == 11 and digits[0] == '1':
        return f"+1 ({digits[1:4]}) {digits[4:7]}-{digits[7:11]}"
    else:
        return phone  # Return original if can't format


def calculate_age(date_of_birth):
    """
    Calculate age from date of birth.

    Returns age in years.
    """
    if not date_of_birth:
        return None

    today = timezone.now().date()
    age = today.year - date_of_birth.year

    # Adjust if birthday hasn't occurred yet this year
    if today.month < date_of_birth.month or \
       (today.month == date_of_birth.month and today.day < date_of_birth.day):
        age -= 1

    return age


def generate_unique_code(prefix='', length=8):
    """
    Generate a unique code for various purposes.

    Example:
        generate_unique_code('RX', 8) -> 'RX-A7B3C9D2'
    """
    import secrets
    import string

    # Generate random alphanumeric string
    alphabet = string.ascii_uppercase + string.digits
    code = ''.join(secrets.choice(alphabet) for _ in range(length))

    if prefix:
        return f"{prefix}-{code}"
    return code
